import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlignJustify,
  FileText,
  GitBranchPlus,
  GitCompareArrows,
  Keyboard,
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { OrganizerNode, OrganizerProject } from '../types/organizer';
import { buildProjectSceneGeometry } from '../utils/geometry';
import { getThemeConfig } from '../utils/themes';
import { EdgeRenderer } from './EdgeRenderer';
import { NodeItem } from './NodeItem';
import { CanvasImageItem } from './CanvasImageItem';

interface CanvasProps {
  project: OrganizerProject;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedImageId?: string | null;
  connectSourceId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onSelectImage?: (id: string | null) => void;
  onCancelConnect: () => void;
  onStartCrossLink: (fromNodeId: string) => void;
  onCompleteCrossLink: (fromNodeId: string, toNodeId: string) => void;
  onMoveNode: (nodeId: string, newX: number, newY: number, moveSubtree: boolean) => void;
  onMoveImage?: (id: string, newX: number, newY: number) => void;
  onResizeImage?: (id: string, newWidth: number, newHeight: number) => void;
  onDeleteImage?: (id: string) => void;
  onToggleLockImage?: (id: string) => void;
  onAddImageFile?: (file: File, worldX?: number, worldY?: number) => void;
  onBeginDragHistory: () => void;
  onCommitNodeText: (nodeId: string, newText: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onCycleProgress: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onExpandAi: (node: OrganizerNode) => void;
  onOpenNotes: (nodeId: string) => void;
  onUpdateNode?: (nodeId: string, updates: Partial<OrganizerNode>) => void;
  onEditEdgeLabel: (edgeId: string, currentLabel: string) => void;
  onAutoAlign: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

interface LiveNodeDrag {
  ids: Set<string>;
  dx: number;
  dy: number;
}

interface LiveImageDrag {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const CanvasInner: React.FC<CanvasProps> = ({
  project,
  selectedNodeId,
  selectedEdgeId,
  selectedImageId = null,
  connectSourceId,
  onSelectNode,
  onSelectEdge,
  onSelectImage,
  onCancelConnect,
  onStartCrossLink,
  onCompleteCrossLink,
  onMoveNode,
  onMoveImage,
  onResizeImage,
  onDeleteImage,
  onToggleLockImage,
  onAddImageFile,
  onBeginDragHistory,
  onCommitNodeText,
  onToggleCollapse,
  onCycleProgress,
  onAddChild,
  onAddSibling,
  onDeleteNode,
  onDeleteEdge,
  onExpandAi,
  onOpenNotes,
  onUpdateNode,
  onEditEdgeLabel,
  onAutoAlign,
  onUndo,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const worldLayerRef = useRef<HTMLDivElement | null>(null);
  const zoomLabelRef = useRef<HTMLButtonElement | null>(null);
  const nodeToolbarRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 520, y: 340 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Estado efímero local a 120fps para mover nodos/imágenes sin re-renderizar App, Navbar ni paneles
  const [liveNodeDrag, setLiveNodeDrag] = useState<LiveNodeDrag | null>(null);
  const [liveImageDrag, setLiveImageDrag] = useState<LiveImageDrag | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const hostSizeRef = useRef({ w: 1200, h: 720 });
  const toolbarSizeRef = useRef({ w: 260, h: 38 });
  const lastGridPxRef = useRef<number>(-1);
  const viewportRafRef = useRef<number | null>(null);
  const wheelSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const objectDragRafRef = useRef<number | null>(null);
  const pendingNodeDragRef = useRef<LiveNodeDrag | null>(null);
  const pendingImageDragRef = useRef<LiveImageDrag | null>(null);

  // Referencia estable de acciones para evitar recrear callbacks en NodeItem / EdgeRenderer
  const actionsRef = useRef({
    connectSourceId,
    onSelectNode,
    onSelectEdge,
    onSelectImage,
    onCompleteCrossLink,
    onCancelConnect,
    onDeleteImage,
    onToggleLockImage,
    onMoveNode,
    onMoveImage,
    onResizeImage,
    onBeginDragHistory,
  });
  actionsRef.current = {
    connectSourceId,
    onSelectNode,
    onSelectEdge,
    onSelectImage,
    onCompleteCrossLink,
    onCancelConnect,
    onDeleteImage,
    onToggleLockImage,
    onMoveNode,
    onMoveImage,
    onResizeImage,
    onBeginDragHistory,
  };

  const projectRef = useRef(project);
  projectRef.current = project;

  // Mapa de punteros activos para soporte multitáctil (Pinch-to-Zoom + Pan con 2 dedos)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    worldMidX: number;
    worldMidY: number;
  } | null>(null);

  const dragStateRef = useRef<{
    mode: 'none' | 'pan' | 'node' | 'image' | 'resize-image';
    pointerId?: number;
    pointerType?: string;
    startClientX: number;
    startClientY: number;
    initialPanX: number;
    initialPanY: number;
    nodeId?: string;
    initialNodeX?: number;
    initialNodeY?: number;
    moveSubtree?: boolean;
    subtreeIds?: Set<string>;
    hasMoved?: boolean;
    lastDxWorld?: number;
    lastDyWorld?: number;
    imageId?: string;
    initialImageX?: number;
    initialImageY?: number;
    initialImageWidth?: number;
    initialImageHeight?: number;
    lastImageW?: number;
    lastImageH?: number;
  }>({
    mode: 'none',
    startClientX: 0,
    startClientY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const theme = getThemeConfig(project.theme);

  // Proyecto proyectado en vivo durante el arrastre: mantiene referencias === intactas en los nodos no movidos
  const effectiveProject = useMemo<OrganizerProject>(() => {
    if (!liveNodeDrag && !liveImageDrag) return project;

    let nextNodes = project.nodes;
    if (liveNodeDrag) {
      const { ids, dx, dy } = liveNodeDrag;
      nextNodes = project.nodes.map(n =>
        ids.has(n.id)
          ? {
              ...n,
              x: n.x + dx,
              y: n.y + dy,
              ribTipX: n.ribTipX !== undefined ? n.ribTipX + dx : undefined,
              ribTipY: n.ribTipY !== undefined ? n.ribTipY + dy : undefined,
              ribAnchorX: n.ribAnchorX !== undefined ? n.ribAnchorX + dx : undefined,
            }
          : n
      );
    }

    let nextImages = project.images;
    if (liveImageDrag && project.images) {
      nextImages = project.images.map(img =>
        img.id === liveImageDrag.id
          ? {
              ...img,
              x: liveImageDrag.x ?? img.x,
              y: liveImageDrag.y ?? img.y,
              width: liveImageDrag.width ?? img.width,
              height: liveImageDrag.height ?? img.height,
            }
          : img
      );
    }

    return {
      ...project,
      nodes: nextNodes,
      images: nextImages,
    };
  }, [project, liveNodeDrag, liveImageDrag]);

  const scene = useMemo(
    () => buildProjectSceneGeometry(effectiveProject),
    [effectiveProject]
  );

  // Escena estabilizada para el minimapa: evita repintar el radar SVG en cada pixel de arrastre
  const baseScene = useMemo(() => buildProjectSceneGeometry(project), [project]);

  const selectedNode = useMemo(
    () =>
      selectedNodeId
        ? scene.visibleNodes.find(n => n.id === selectedNodeId) || null
        : null,
    [selectedNodeId, scene.visibleNodes]
  );
  const selectedNodeRef = useRef<OrganizerNode | null>(selectedNode);
  selectedNodeRef.current = selectedNode;

  useEffect(() => {
    if (editingNodeId && editingNodeId !== selectedNodeId) {
      setEditingNodeId(null);
    }
  }, [selectedNodeId, editingNodeId]);

  /** Posiciona la barra flotante contextual directamente por GPU (translate3d) sin disparar Layout */
  const updateToolbarTransform = useCallback(
    (px: number, py: number, z: number, node: OrganizerNode | null) => {
      const tb = nodeToolbarRef.current;
      if (!tb || !node) return;

      const hostW = hostSizeRef.current.w;
      const hostH = hostSizeRef.current.h;
      const tbW = toolbarSizeRef.current.w;
      const tbH = toolbarSizeRef.current.h;

      const cx = px + node.x * z;
      const halfH = ((node.height || 48) * z) / 2;
      const topEdge = py + node.y * z - halfH;
      const bottomEdge = py + node.y * z + halfH;

      const clampedLeft = Math.max(
        8,
        Math.min(Math.max(8, hostW - tbW - 8), cx - tbW / 2)
      );
      const idealTop = topEdge - tbH - 10;
      const maxSafeTop = Math.max(8, hostH - 66 - tbH);
      const clampedTop =
        idealTop >= 8
          ? Math.min(maxSafeTop, idealTop)
          : Math.max(8, Math.min(maxSafeTop, bottomEdge + 10));

      tb.style.transform = `translate3d(${Math.round(clampedLeft)}px, ${Math.round(
        clampedTop
      )}px, 0)`;
    },
    []
  );

  /** Aplica Pan y Zoom directamente en GPU (Compositor) a 120fps sin re-renderizar React */
  const applyViewportToDomImmediate = useCallback(
    (px: number, py: number, z: number) => {
      if (worldLayerRef.current) {
        worldLayerRef.current.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${z})`;
      }
      if (containerRef.current && projectRef.current.canvasBg !== 'clean') {
        containerRef.current.style.backgroundPosition = `${Math.round(px)}px ${Math.round(py)}px`;
        const gridPx = Math.max(12, Math.round(24 * z));
        if (lastGridPxRef.current !== gridPx) {
          lastGridPxRef.current = gridPx;
          containerRef.current.style.backgroundSize = `${gridPx}px ${gridPx}px`;
        }
      }
      if (zoomLabelRef.current) {
        zoomLabelRef.current.textContent = `${Math.round(z * 100)}%`;
      }
      updateToolbarTransform(px, py, z, selectedNodeRef.current);
    },
    [updateToolbarTransform]
  );

  const scheduleViewportDomFlush = useCallback(() => {
    if (viewportRafRef.current !== null) return;
    viewportRafRef.current = requestAnimationFrame(() => {
      viewportRafRef.current = null;
      applyViewportToDomImmediate(
        panRef.current.x,
        panRef.current.y,
        zoomRef.current
      );
    });
  }, [applyViewportToDomImmediate]);

  const commitViewportState = useCallback((nextPan: { x: number; y: number }, nextZoom: number) => {
    panRef.current = nextPan;
    zoomRef.current = nextZoom;
    applyViewportToDomImmediate(nextPan.x, nextPan.y, nextZoom);
    setPan(nextPan);
    setZoom(nextZoom);
  }, [applyViewportToDomImmediate]);

  // Medir la barra contextual solo cuando cambia el nodo seleccionado (evita Layout Thrashing)
  useLayoutEffect(() => {
    const tb = nodeToolbarRef.current;
    if (tb && selectedNode) {
      const w = tb.offsetWidth;
      const h = tb.offsetHeight;
      if (w > 0 && h > 0) {
        toolbarSizeRef.current = { w, h };
      }
      updateToolbarTransform(
        panRef.current.x,
        panRef.current.y,
        zoomRef.current,
        selectedNode
      );
    }
  }, [selectedNode, editingNodeId, connectSourceId, isPanning, isDraggingObject, updateToolbarTransform]);

  const childrenExistSet = useMemo(() => {
    const s = new Set<string>();
    project.nodes.forEach(n => {
      if (n.parentId) s.add(n.parentId);
    });
    return s;
  }, [project.nodes]);

  /** Ajusta automáticamente el zoom y el centrado para encuadrar todo el diagrama según la pantalla */
  const fitToScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const widthHost = el.clientWidth || hostSizeRef.current.w;
    const heightHost = el.clientHeight || hostSizeRef.current.h;
    if (widthHost < 80 || heightHost < 80) return;

    const { minX, maxX, minY, maxY, width, height } = baseScene.bounds;
    const isMobile = widthHost < 640;
    const padW = isMobile ? 48 : 130;
    const padH = isMobile ? 96 : 130;

    const scaleX = (widthHost - padW) / Math.max(width, 200);
    const scaleY = (heightHost - padH) / Math.max(height, 140);
    const idealZoom = Math.min(1.08, Math.max(0.22, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    commitViewportState(
      {
        x: widthHost / 2 - centerX * idealZoom,
        y: (heightHost - (isMobile ? 20 : 0)) / 2 - centerY * idealZoom,
      },
      idealZoom
    );
  }, [baseScene.bounds, commitViewportState]);

  const prevNodeCountRef = useRef<number>(project.nodes.length);
  const lastContainerSizeRef = useRef<{ w: number; h: number } | null>(null);

  // Encuadrar suavemente al cambiar de proyecto o de tipo de estructura
  useEffect(() => {
    prevNodeCountRef.current = project.nodes.length;
    const raf = requestAnimationFrame(() => {
      fitToScreen();
    });
    return () => cancelAnimationFrame(raf);
  }, [project.id, project.type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si el mapa pasa de tener solo el nodo central (1) a ramificarse (>1), re-encuadrar automáticamente
  useEffect(() => {
    const prevCount = prevNodeCountRef.current;
    const currCount = project.nodes.length;
    prevNodeCountRef.current = currCount;
    if (prevCount <= 1 && currCount > 1) {
      const raf = requestAnimationFrame(() => fitToScreen());
      return () => cancelAnimationFrame(raf);
    }
  }, [project.nodes.length, fitToScreen]);

  // Al seleccionar o crear un nodo (solo cuando NO se está arrastrando), asegurar que quede visible
  useEffect(() => {
    if (!selectedNodeId || !containerRef.current) return;
    if (dragStateRef.current.mode !== 'none') return;

    const target = baseScene.visibleNodes.find(n => n.id === selectedNodeId);
    if (!target) return;

    const rectW = hostSizeRef.current.w;
    const rectH = hostSizeRef.current.h;
    if (rectW < 80 || rectH < 80) return;

    const z = zoomRef.current;
    const px = panRef.current.x;
    const py = panRef.current.y;

    const halfW = ((target.width || 150) * z) / 2;
    const halfH = ((target.height || 50) * z) / 2;
    const cx = px + target.x * z;
    const cy = py + target.y * z;

    const marginX = 24;
    const marginTop = 64;
    const marginBottom = 72;

    let shiftX = 0;
    let shiftY = 0;

    if (cx - halfW < marginX) {
      shiftX = marginX - (cx - halfW);
    } else if (cx + halfW > rectW - marginX) {
      shiftX = rectW - marginX - (cx + halfW);
    }

    if (cy - halfH < marginTop) {
      shiftY = marginTop - (cy - halfH);
    } else if (cy + halfH > rectH - marginBottom) {
      shiftY = rectH - marginBottom - (cy + halfH);
    }

    if (Math.abs(shiftX) > 2 || Math.abs(shiftY) > 2) {
      commitViewportState(
        {
          x: px + shiftX,
          y: py + shiftY,
        },
        z
      );
    }
  }, [selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mantener dimensiones del host en caché y centrar cuando se abren/cierran los paneles laterales
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    hostSizeRef.current = { w: el.clientWidth, h: el.clientHeight };

    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width < 80 || height < 80) return;
      hostSizeRef.current = { w: width, h: height };
      const prev = lastContainerSizeRef.current;
      lastContainerSizeRef.current = { w: width, h: height };
      if (prev && (Math.abs(width - prev.w) > 4 || Math.abs(height - prev.h) > 4)) {
        const nextPan = {
          x: panRef.current.x + (width - prev.w) / 2,
          y: panRef.current.y + (height - prev.h) / 2,
        };
        commitViewportState(nextPan, zoomRef.current);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [commitViewportState]);

  // Reencuadrar suavemente si rota la pantalla en móvil/tablet
  useEffect(() => {
    const handleOrientation = () => {
      setTimeout(() => fitToScreen(), 120);
    };
    window.addEventListener('orientationchange', handleOrientation);
    return () => window.removeEventListener('orientationchange', handleOrientation);
  }, [fitToScreen]);

  /** Zoom centrado exactamente sobre un punto de la pantalla */
  const applyZoomAtPoint = useCallback(
    (factor: number, clientX?: number, clientY?: number, immediateState = true) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = clientX !== undefined ? clientX - rect.left : rect.width / 2;
      const cy = clientY !== undefined ? clientY - rect.top : rect.height / 2;

      const prevZoom = zoomRef.current;
      const prevPan = panRef.current;
      const nextZoom = Math.min(2.8, Math.max(0.18, prevZoom * factor));

      const worldX = (cx - prevPan.x) / prevZoom;
      const worldY = (cy - prevPan.y) / prevZoom;
      const nextPan = {
        x: cx - worldX * nextZoom,
        y: cy - worldY * nextZoom,
      };

      panRef.current = nextPan;
      zoomRef.current = nextZoom;

      if (immediateState) {
        applyViewportToDomImmediate(nextPan.x, nextPan.y, nextZoom);
        setZoom(nextZoom);
        setPan(nextPan);
      } else {
        scheduleViewportDomFlush();
        if (wheelSyncTimerRef.current) clearTimeout(wheelSyncTimerRef.current);
        wheelSyncTimerRef.current = setTimeout(() => {
          setZoom(zoomRef.current);
          setPan({ ...panRef.current });
        }, 140);
      }
    },
    [applyViewportToDomImmediate, scheduleViewportDomFlush]
  );

  /** Inicializa el estado matemático de pellizco con 2 dedos */
  const startPinchGesture = useCallback(() => {
    const el = containerRef.current;
    if (!el || activePointersRef.current.size < 2) return;
    const pts = Array.from(activePointersRef.current.values());
    const p1 = pts[0];
    const p2 = pts[1];
    const rect = el.getBoundingClientRect();
    const midX = (p1.x + p2.x) / 2 - rect.left;
    const midY = (p1.y + p2.y) / 2 - rect.top;
    const dist = Math.max(20, Math.hypot(p2.x - p1.x, p2.y - p1.y));

    pinchStateRef.current = {
      initialDist: dist,
      initialZoom: zoomRef.current,
      worldMidX: (midX - panRef.current.x) / zoomRef.current,
      worldMidY: (midY - panRef.current.y) / zoomRef.current,
    };
    dragStateRef.current.mode = 'none';
    setIsPanning(false);
    setIsDraggingObject(false);
  }, []);

  // Zoom y paneo en rueda / trackpad a 120fps puros por DOM directo sin bloquear React
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        !e.ctrlKey &&
        !e.metaKey &&
        Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.8 &&
        Math.abs(e.deltaX) > 2
      ) {
        panRef.current = {
          x: panRef.current.x - e.deltaX,
          y: panRef.current.y - e.deltaY,
        };
        scheduleViewportDomFlush();
        if (wheelSyncTimerRef.current) clearTimeout(wheelSyncTimerRef.current);
        wheelSyncTimerRef.current = setTimeout(() => {
          setPan({ ...panRef.current });
        }, 140);
        return;
      }

      if (e.shiftKey && !e.ctrlKey) {
        panRef.current = {
          x: panRef.current.x - (e.deltaY || e.deltaX),
          y: panRef.current.y,
        };
        scheduleViewportDomFlush();
        if (wheelSyncTimerRef.current) clearTimeout(wheelSyncTimerRef.current);
        wheelSyncTimerRef.current = setTimeout(() => {
          setPan({ ...panRef.current });
        }, 140);
        return;
      }

      const sensitivity = e.ctrlKey ? 0.009 : 0.0016;
      const factor = Math.exp(-e.deltaY * sensitivity);
      applyZoomAtPoint(factor, e.clientX, e.clientY, false);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [applyZoomAtPoint, scheduleViewportDomFlush]);

  // Atajos de teclado globales estilo EdrawMax
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')
      ) {
        e.preventDefault();
        if (e.key === '0') fitToScreen();
        else if (e.key === '-') applyZoomAtPoint(0.86);
        else applyZoomAtPoint(1.16);
        return;
      }

      if (inInput) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
        return;
      }

      if (e.key === 'Escape') {
        if (connectSourceId) onCancelConnect();
        else {
          onSelectNode(null);
          onSelectEdge(null);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }

      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        fitToScreen();
        return;
      }

      if (selectedNodeId) {
        if (e.key === 'Tab') {
          e.preventDefault();
          onAddChild(selectedNodeId);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onAddSibling(selectedNodeId);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          const node = projectRef.current.nodes.find(n => n.id === selectedNodeId);
          if (node && !node.isRoot) {
            e.preventDefault();
            onDeleteNode(selectedNodeId);
          }
        }
      } else if (selectedEdgeId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        onDeleteEdge(selectedEdgeId);
      } else if (selectedImageId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        onDeleteImage?.(selectedImageId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    applyZoomAtPoint,
    connectSourceId,
    fitToScreen,
    onAddChild,
    onAddSibling,
    onCancelConnect,
    onDeleteEdge,
    onDeleteImage,
    onDeleteNode,
    onRedo,
    onSelectEdge,
    onSelectNode,
    onUndo,
    selectedEdgeId,
    selectedImageId,
    selectedNodeId,
  ]);

  // Callbacks estables para hijos memorizados (React.memo)
  const handleNodeSelectStable = useCallback((id: string) => {
    const act = actionsRef.current;
    if (act.connectSourceId) {
      if (act.connectSourceId !== id) {
        act.onCompleteCrossLink(act.connectSourceId, id);
      } else {
        act.onCancelConnect();
      }
      return;
    }
    act.onSelectEdge(null);
    act.onSelectNode(id);
  }, []);

  const handleNodeEditingStable = useCallback((id: string, editing: boolean) => {
    setEditingNodeId(editing ? id : null);
  }, []);

  const handleEdgeSelectStable = useCallback((id: string | null) => {
    const act = actionsRef.current;
    act.onSelectNode(null);
    act.onSelectEdge(id);
  }, []);

  const handleImageSelectStable = useCallback((id: string) => {
    const act = actionsRef.current;
    act.onSelectNode(null);
    act.onSelectEdge(null);
    act.onSelectImage?.(id);
  }, []);

  const handleImageDeleteStable = useCallback((id: string) => {
    actionsRef.current.onDeleteImage?.(id);
  }, []);

  const handleImageToggleLockStable = useCallback((id: string) => {
    actionsRef.current.onToggleLockImage?.(id);
  }, []);

  // Manejo de arrastre de lienzo (Pan) y gestos táctiles en el fondo
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size >= 2) {
      startPinchGesture();
      return;
    }

    if (connectSourceId) {
      onCancelConnect();
    }
    if (selectedNodeId) onSelectNode(null);
    if (selectedEdgeId) onSelectEdge(null);
    if (selectedImageId) onSelectImage?.(null);
    setIsPanning(true);
    dragStateRef.current = {
      mode: 'pan',
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialPanX: panRef.current.x,
      initialPanY: panRef.current.y,
    };
  };

  const handleNodeStartDrag = useCallback(
    (e: React.PointerEvent, node: OrganizerNode) => {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointersRef.current.size >= 2) {
        startPinchGesture();
        return;
      }

      if (spacePressed) {
        setIsPanning(true);
        dragStateRef.current = {
          mode: 'pan',
          pointerId: e.pointerId,
          pointerType: e.pointerType,
          startClientX: e.clientX,
          startClientY: e.clientY,
          initialPanX: panRef.current.x,
          initialPanY: panRef.current.y,
        };
        return;
      }

      // Precalcular subrama 1 sola vez al tocar el cuadro (0 BFS durante los frames de movimiento)
      const moveSubtree = !e.altKey;
      const subtreeIds = new Set<string>([node.id]);
      if (moveSubtree && !node.isRoot) {
        const allNodes = projectRef.current.nodes;
        const queue = [node.id];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          for (let i = 0; i < allNodes.length; i++) {
            const candidate = allNodes[i];
            if (candidate.parentId === curr && !subtreeIds.has(candidate.id)) {
              subtreeIds.add(candidate.id);
              queue.push(candidate.id);
            }
          }
        }
      }

      dragStateRef.current = {
        mode: 'node',
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialPanX: panRef.current.x,
        initialPanY: panRef.current.y,
        nodeId: node.id,
        initialNodeX: node.x,
        initialNodeY: node.y,
        moveSubtree,
        subtreeIds,
        hasMoved: false,
        lastDxWorld: 0,
        lastDyWorld: 0,
      };
    },
    [spacePressed, startPinchGesture]
  );

  const handleImageStartDrag = useCallback(
    (id: string, e: React.PointerEvent) => {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointersRef.current.size >= 2) {
        startPinchGesture();
        return;
      }

      if (spacePressed) return;
      const img = projectRef.current.images?.find(i => i.id === id);
      if (!img || img.locked) return;

      dragStateRef.current = {
        mode: 'image',
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialPanX: panRef.current.x,
        initialPanY: panRef.current.y,
        imageId: id,
        initialImageX: img.x,
        initialImageY: img.y,
        hasMoved: false,
        lastDxWorld: 0,
        lastDyWorld: 0,
      };
    },
    [spacePressed, startPinchGesture]
  );

  const handleImageStartResize = useCallback(
    (id: string, e: React.PointerEvent) => {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointersRef.current.size >= 2) {
        startPinchGesture();
        return;
      }

      const img = projectRef.current.images?.find(i => i.id === id);
      if (!img || img.locked) return;

      dragStateRef.current = {
        mode: 'resize-image',
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialPanX: panRef.current.x,
        initialPanY: panRef.current.y,
        imageId: id,
        initialImageWidth: img.width,
        initialImageHeight: img.height,
        hasMoved: false,
        lastImageW: img.width,
        lastImageH: img.height,
      };
    },
    [startPinchGesture]
  );

  useEffect(() => {
    const flushObjectDragFrame = () => {
      objectDragRafRef.current = null;
      if (pendingNodeDragRef.current) {
        setLiveNodeDrag(pendingNodeDragRef.current);
      }
      if (pendingImageDragRef.current) {
        setLiveImageDrag(pendingImageDragRef.current);
      }
    };

    const scheduleObjectDragFlush = () => {
      if (objectDragRafRef.current === null) {
        objectDragRafRef.current = requestAnimationFrame(flushObjectDragFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Gesto multitáctil de 2 dedos: Pinch-to-Zoom + Pan directo por GPU a 120fps
      if (activePointersRef.current.size >= 2 && containerRef.current) {
        if (!pinchStateRef.current) {
          startPinchGesture();
        }
        const pinch = pinchStateRef.current;
        if (pinch) {
          const pts = Array.from(activePointersRef.current.values());
          const p1 = pts[0];
          const p2 = pts[1];
          const rect = containerRef.current.getBoundingClientRect();
          const midX = (p1.x + p2.x) / 2 - rect.left;
          const midY = (p1.y + p2.y) / 2 - rect.top;
          const dist = Math.max(16, Math.hypot(p2.x - p1.x, p2.y - p1.y));
          const nextZoom = Math.min(
            2.8,
            Math.max(0.18, pinch.initialZoom * (dist / pinch.initialDist))
          );

          zoomRef.current = nextZoom;
          panRef.current = {
            x: midX - pinch.worldMidX * nextZoom,
            y: midY - pinch.worldMidY * nextZoom,
          };
          scheduleViewportDomFlush();
        }
        return;
      }

      if (actionsRef.current.connectSourceId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const wx = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
        const wy = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;
        setMouseWorldPos({ x: wx, y: wy });
      }

      const st = dragStateRef.current;
      if (st.mode === 'none') return;
      if (st.pointerId !== undefined && e.pointerId !== st.pointerId) return;

      const moveThreshold = st.pointerType === 'touch' ? 5 : 2.5;

      if (st.mode === 'pan') {
        const dx = e.clientX - st.startClientX;
        const dy = e.clientY - st.startClientY;
        panRef.current = {
          x: st.initialPanX + dx,
          y: st.initialPanY + dy,
        };
        scheduleViewportDomFlush();
      } else if (st.mode === 'node' && st.nodeId && st.subtreeIds) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        if (!st.hasMoved && Math.hypot(dxScreen, dyScreen) > moveThreshold) {
          st.hasMoved = true;
          setIsDraggingObject(true);
          actionsRef.current.onBeginDragHistory();
        }
        if (st.hasMoved) {
          const dxWorld = dxScreen / zoomRef.current;
          const dyWorld = dyScreen / zoomRef.current;
          st.lastDxWorld = dxWorld;
          st.lastDyWorld = dyWorld;
          pendingNodeDragRef.current = {
            ids: st.subtreeIds,
            dx: dxWorld,
            dy: dyWorld,
          };
          scheduleObjectDragFlush();
        }
      } else if (st.mode === 'image' && st.imageId) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        if (!st.hasMoved && Math.hypot(dxScreen, dyScreen) > moveThreshold) {
          st.hasMoved = true;
          setIsDraggingObject(true);
        }
        if (st.hasMoved) {
          const dxWorld = dxScreen / zoomRef.current;
          const dyWorld = dyScreen / zoomRef.current;
          st.lastDxWorld = dxWorld;
          st.lastDyWorld = dyWorld;
          pendingImageDragRef.current = {
            id: st.imageId,
            x: Math.round((st.initialImageX || 0) + dxWorld),
            y: Math.round((st.initialImageY || 0) + dyWorld),
          };
          scheduleObjectDragFlush();
        }
      } else if (st.mode === 'resize-image' && st.imageId) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        if (!st.hasMoved) {
          st.hasMoved = true;
          setIsDraggingObject(true);
        }
        const newW = Math.round(
          Math.max(60, (st.initialImageWidth || 100) + dxScreen / zoomRef.current)
        );
        const newH = Math.round(
          Math.max(50, (st.initialImageHeight || 80) + dyScreen / zoomRef.current)
        );
        st.lastImageW = newW;
        st.lastImageH = newH;
        pendingImageDragRef.current = {
          id: st.imageId,
          width: newW,
          height: newH,
        };
        scheduleObjectDragFlush();
      }
    };

    const finalizeActiveDrag = () => {
      if (objectDragRafRef.current !== null) {
        cancelAnimationFrame(objectDragRafRef.current);
        objectDragRafRef.current = null;
      }
      const st = dragStateRef.current;
      const act = actionsRef.current;

      if (st.mode === 'pan') {
        setPan({ ...panRef.current });
      } else if (st.mode === 'node' && st.hasMoved && st.nodeId) {
        const finalX = (st.initialNodeX || 0) + (st.lastDxWorld || 0);
        const finalY = (st.initialNodeY || 0) + (st.lastDyWorld || 0);
        pendingNodeDragRef.current = null;
        setLiveNodeDrag(null);
        act.onMoveNode(st.nodeId, finalX, finalY, Boolean(st.moveSubtree));
      } else if (st.mode === 'image' && st.hasMoved && st.imageId) {
        const finalX = Math.round((st.initialImageX || 0) + (st.lastDxWorld || 0));
        const finalY = Math.round((st.initialImageY || 0) + (st.lastDyWorld || 0));
        pendingImageDragRef.current = null;
        setLiveImageDrag(null);
        act.onMoveImage?.(st.imageId, finalX, finalY);
      } else if (st.mode === 'resize-image' && st.hasMoved && st.imageId) {
        pendingImageDragRef.current = null;
        setLiveImageDrag(null);
        act.onResizeImage?.(
          st.imageId,
          st.lastImageW || st.initialImageWidth || 100,
          st.lastImageH || st.initialImageHeight || 80
        );
      } else {
        pendingNodeDragRef.current = null;
        pendingImageDragRef.current = null;
        setLiveNodeDrag(null);
        setLiveImageDrag(null);
      }

      dragStateRef.current.mode = 'none';
      setIsPanning(false);
      setIsDraggingObject(false);
    };

    const handlePointerEnd = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);

      if (pinchStateRef.current) {
        if (activePointersRef.current.size < 2) {
          pinchStateRef.current = null;
          setZoom(zoomRef.current);
          setPan({ ...panRef.current });
          if (activePointersRef.current.size === 1) {
            const [remId, remPos] = Array.from(activePointersRef.current.entries())[0];
            setIsPanning(true);
            dragStateRef.current = {
              mode: 'pan',
              pointerId: remId,
              pointerType: 'touch',
              startClientX: remPos.x,
              startClientY: remPos.y,
              initialPanX: panRef.current.x,
              initialPanY: panRef.current.y,
            };
          } else {
            dragStateRef.current.mode = 'none';
            setIsPanning(false);
          }
        }
        return;
      }

      if (
        dragStateRef.current.mode !== 'none' &&
        (dragStateRef.current.pointerId === undefined ||
          dragStateRef.current.pointerId === e.pointerId)
      ) {
        finalizeActiveDrag();
      }
    };

    const handleWindowBlur = () => {
      activePointersRef.current.clear();
      pinchStateRef.current = null;
      if (dragStateRef.current.mode !== 'none') {
        finalizeActiveDrag();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [scheduleViewportDomFlush, startPinchGesture]);

  // Soporte de pegado de imágenes desde portapapeles (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items || !onAddImageFile) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const el = containerRef.current;
            if (el) {
              const rect = el.getBoundingClientRect();
              const wx = (rect.width / 2 - panRef.current.x) / zoomRef.current;
              const wy = (rect.height / 2 - panRef.current.y) / zoomRef.current;
              onAddImageFile(file, wx, wy);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onAddImageFile]);

  const connectingFromNode = connectSourceId
    ? effectiveProject.nodes.find(n => n.id === connectSourceId) || null
    : null;

  const bgPatternClass =
    project.canvasBg === 'grid'
      ? 'canvas-bg-grid'
      : project.canvasBg === 'clean'
      ? 'canvas-bg-clean'
      : 'canvas-bg-dots';

  const gridPixelSize = Math.max(12, Math.round(24 * zoom));

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onDragOver={e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
          e.dataTransfer.dropEffect = 'copy';
          if (!isDraggingFileOver) setIsDraggingFileOver(true);
        }
      }}
      onDragLeave={e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingFileOver(false);
      }}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFileOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && onAddImageFile) {
          const el = containerRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const wx = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
          const wy = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
              onAddImageFile(file, wx + i * 24, wy + i * 24);
            }
          }
        }
      }}
      style={{
        backgroundColor: theme.canvasBg,
        backgroundSize:
          project.canvasBg === 'clean'
            ? undefined
            : `${gridPixelSize}px ${gridPixelSize}px`,
        backgroundPosition: `${Math.round(pan.x)}px ${Math.round(pan.y)}px`,
        contain: 'layout paint style',
      }}
      className={`canvas-touch-surface relative flex-1 h-full overflow-hidden select-none ${bgPatternClass} ${
        isPanning || spacePressed ? 'dragging-canvas' : 'cursor-grab'
      }`}
    >
      {/* Indicador visual al arrastrar archivos de imagen sobre el lienzo */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-orange-500/10 border-4 border-dashed border-orange-500/80 rounded-2xl flex items-center justify-center m-2">
          <div className="px-6 py-4 rounded-2xl bg-white shadow-2xl border border-orange-200 text-center space-y-1">
            <div className="text-sm font-bold text-orange-950">
              Soltar imagen aquí en el lienzo
            </div>
            <p className="text-xs text-stone-500">
              Se colocará exactamente en las coordenadas de tu cursor.
            </p>
          </div>
        </div>
      )}

      {/* Banner interactivo cuando el usuario está trazando una Relación Cruzada */}
      {connectingFromNode && (
        <div
          onPointerDown={e => e.stopPropagation()}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] flex items-center gap-2 px-3.5 py-2 rounded-full bg-orange-600 text-white text-xs font-semibold shadow-lg"
        >
          <span className="truncate">
            Conectando «{connectingFromNode.text}» — Toca el nodo destino
          </span>
          <button
            type="button"
            onClick={onCancelConnect}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors shrink-0"
            title="Cancelar (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Escenario del mundo escalable y trasladable a 120fps por GPU */}
      <div
        ref={worldLayerRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <EdgeRenderer
          scene={scene}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={handleEdgeSelectStable}
          onEditEdgeLabel={onEditEdgeLabel}
          onDeleteEdge={onDeleteEdge}
          connectingFrom={
            connectingFromNode
              ? { x: connectingFromNode.x, y: connectingFromNode.y }
              : null
          }
          mouseWorldPos={mouseWorldPos}
        />

        {/* Capa de imágenes libres colocadas en el lienzo */}
        {effectiveProject.images &&
          effectiveProject.images.map(img => (
            <CanvasImageItem
              key={img.id}
              image={img}
              isSelected={selectedImageId === img.id}
              onSelect={handleImageSelectStable}
              onStartDrag={handleImageStartDrag}
              onStartResize={handleImageStartResize}
              onDelete={handleImageDeleteStable}
              onToggleLock={handleImageToggleLockStable}
            />
          ))}

        {scene.visibleNodes.map(node => (
          <NodeItem
            key={node.id}
            node={node}
            organizerType={project.type}
            themeId={project.theme}
            isSelected={selectedNodeId === node.id}
            isEditingExternal={editingNodeId === node.id}
            isConnectSource={connectSourceId === node.id}
            isConnectMode={Boolean(connectSourceId)}
            descendantCount={scene.descendantCount.get(node.id) || 0}
            hasChildren={childrenExistSet.has(node.id)}
            onSelect={handleNodeSelectStable}
            onEditingChange={handleNodeEditingStable}
            onStartDrag={handleNodeStartDrag}
            onCommitText={onCommitNodeText}
            onToggleCollapse={onToggleCollapse}
            onCycleProgress={onCycleProgress}
            onAddChild={onAddChild}
            onOpenNotes={onOpenNotes}
          />
        ))}
      </div>

      {/* Barra flotante contextual posicionada por GPU translate3d (se oculta limpiamente al arrastrar) */}
      {selectedNode && !editingNodeId && !connectSourceId && !isPanning && !isDraggingObject && (
        <div
          ref={nodeToolbarRef}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{ left: 0, top: 0, willChange: 'transform' }}
          className="ios-glass-bar absolute z-30 max-w-[calc(100%-16px)] overflow-x-auto no-scrollbar flex items-center gap-0.5 px-1.5 py-1 rounded-2xl border border-stone-200/90 edraw-panel-shadow whitespace-nowrap select-none"
        >
          <button
            type="button"
            onClick={() => onAddChild(selectedNode.id)}
            title="Añadir subtema (Tab)"
            className="ios-btn flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold text-stone-700 hover:bg-orange-50 hover:text-orange-700 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-orange-600" />
            <span>Subtema</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (zoomRef.current < 0.65 && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const targetZ = 0.85;
                commitViewportState(
                  {
                    x: rect.width / 2 - selectedNode.x * targetZ,
                    y: Math.max(120, rect.height * 0.36) - selectedNode.y * targetZ,
                  },
                  targetZ
                );
              }
              setEditingNodeId(selectedNode.id);
            }}
            title="Editar texto del nodo (Doble clic / Doble toque)"
            className="ios-btn flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-800 shrink-0"
          >
            <Pencil className="w-3 h-3 text-amber-600" />
            <span>Editar</span>
          </button>

          <button
            type="button"
            onClick={() => onExpandAi(selectedNode)}
            title="Expandir ideas automáticamente con IA"
            className="ios-btn flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold text-stone-700 hover:bg-purple-50 hover:text-purple-700 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>IA</span>
          </button>

          {!(selectedNode.isRoot || (selectedNode.depth || 0) === 0) && (
            <button
              type="button"
              onClick={() => onAddSibling(selectedNode.id)}
              title="Añadir nodo hermano al mismo nivel (Enter)"
              className="ios-btn p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 shrink-0"
            >
              <GitBranchPlus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onStartCrossLink(selectedNode.id)}
            title="Trazar flecha de relación cruzada hacia otro nodo"
            className="ios-btn p-1.5 rounded-xl text-stone-600 hover:bg-amber-50 hover:text-amber-700 shrink-0"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onOpenNotes(selectedNode.id)}
            title="Subtítulo, notas y enlace del nodo"
            className="ios-btn p-1.5 rounded-xl text-stone-600 hover:bg-blue-50 hover:text-blue-700 shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          {onUpdateNode && (
            <button
              type="button"
              onClick={() => {
                const isJustified = selectedNode.textAlign === 'justify';
                onUpdateNode(selectedNode.id, {
                  textAlign: isJustified ? 'left' : 'justify',
                });
              }}
              title={
                selectedNode.textAlign === 'justify'
                  ? 'Texto justificado activo (clic para volver a alineación izquierda)'
                  : 'Justificar texto del cuadro (alineación simétrica a ambos lados)'
              }
              className={`ios-btn flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold shrink-0 transition-colors ${
                selectedNode.textAlign === 'justify'
                  ? 'bg-orange-100 text-orange-800 font-bold ring-1 ring-orange-300'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">
                {selectedNode.textAlign === 'justify' ? 'Justificado' : 'Justificar'}
              </span>
            </button>
          )}

          {!(selectedNode.isRoot || (selectedNode.depth || 0) === 0) && (
            <button
              type="button"
              onClick={() => onDeleteNode(selectedNode.id)}
              title="Eliminar rama (Supr)"
              className="ios-btn p-1.5 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-600 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Minimapa de Radar Interactivo (usa baseScene estabilizada para 0 costo durante el arrastre) */}
      {showMinimap && !showShortcuts && baseScene.visibleNodes.length > 0 && (
        <div
          onPointerDown={e => e.stopPropagation()}
          className="ios-popover-up ios-glass-bar absolute bottom-16 sm:bottom-15 right-3 sm:right-4 z-30 w-44 sm:w-48 h-28 sm:h-32 rounded-[20px] border border-stone-200/90 edraw-panel-shadow p-2 overflow-hidden pointer-events-auto"
        >
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
              Vista General
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full">
                {baseScene.visibleNodes.length}n
              </span>
              <button
                type="button"
                onClick={() => setShowMinimap(false)}
                title="Ocultar minimapa"
                className="p-0.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <svg
            viewBox={`${baseScene.bounds.minX - 60} ${baseScene.bounds.minY - 60} ${
              baseScene.bounds.width + 120
            } ${baseScene.bounds.height + 120}`}
            className="w-full h-[76px] sm:h-[84px] rounded-xl cursor-pointer"
            style={{ backgroundColor: theme.canvasBg }}
            onClick={e => {
              const svgRect = e.currentTarget.getBoundingClientRect();
              const rx = (e.clientX - svgRect.left) / svgRect.width;
              const ry = (e.clientY - svgRect.top) / svgRect.height;
              const targetWX =
                baseScene.bounds.minX - 60 + rx * (baseScene.bounds.width + 120);
              const targetWY =
                baseScene.bounds.minY - 60 + ry * (baseScene.bounds.height + 120);
              const hostRect = containerRef.current?.getBoundingClientRect();
              if (hostRect) {
                commitViewportState(
                  {
                    x: hostRect.width / 2 - targetWX * zoomRef.current,
                    y: hostRect.height / 2 - targetWY * zoomRef.current,
                  },
                  zoomRef.current
                );
              }
            }}
          >
            {baseScene.paths.map(p => (
              <path
                key={p.id}
                d={p.d}
                fill={p.kind === 'fill' ? p.color : 'none'}
                stroke={p.kind === 'fill' ? 'none' : p.color}
                strokeWidth={8}
                opacity={0.45}
              />
            ))}
            {baseScene.visibleNodes.map(n => (
              <rect
                key={n.id}
                x={n.x - n.width / 2}
                y={n.y - n.height / 2}
                width={n.width}
                height={n.height}
                rx={12}
                fill={n.color || theme.palette[0]}
                opacity={selectedNodeId === n.id ? 1 : 0.8}
              />
            ))}
            {project.images?.map(img => (
              <rect
                key={img.id}
                x={img.x - img.width / 2}
                y={img.y - img.height / 2}
                width={img.width}
                height={img.height}
                rx={6}
                fill="#EA580C"
                opacity={selectedImageId === img.id ? 0.9 : 0.55}
              />
            ))}
          </svg>
        </div>
      )}

      {/* Pestaña flotante desplegable de Atajos y Gestos */}
      {showShortcuts && (
        <div
          onPointerDown={e => e.stopPropagation()}
          className="ios-popover-up ios-glass-bar absolute bottom-16 sm:bottom-15 left-3 right-3 sm:left-auto sm:right-4 sm:w-72 z-30 rounded-[20px] border border-stone-200/90 edraw-panel-shadow p-3 pointer-events-auto"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/70">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-500">
              Atajos y Gestos Rápidos
            </span>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="p-0.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-[11px] text-stone-700">
            {[
              { k: 'Tab', v: 'Añadir nuevo subtema' },
              { k: 'Enter', v: 'Añadir cuadro hermano' },
              { k: '2× Clic', v: 'Editar texto en vivo' },
              { k: 'Supr', v: 'Eliminar rama seleccionada' },
              { k: 'F', v: 'Encuadrar todo el mapa' },
              { k: '2 Dedos / Rueda', v: 'Zoom y paneo fluido' },
            ].map(row => (
              <div key={row.k} className="flex items-center justify-between gap-2">
                <span className="text-stone-600">{row.v}</span>
                <kbd className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/80 font-bold text-[10px] text-stone-800 shrink-0">
                  {row.k}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dock Flotante Único Unificado */}
      <div
        onPointerDown={e => e.stopPropagation()}
        className="ios-glass-bar absolute bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-30 max-w-[calc(100%-16px)] overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-2xl border border-stone-200/90 edraw-panel-shadow whitespace-nowrap"
      >
        <button
          type="button"
          onClick={() => {
            setShowShortcuts(false);
            setShowMinimap(v => !v);
          }}
          title={showMinimap ? 'Ocultar minimapa' : 'Mostrar minimapa de vista general'}
          className={`ios-btn p-1.5 rounded-xl transition-colors shrink-0 ${
            showMinimap && !showShortcuts
              ? 'bg-amber-100/90 text-amber-800'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            const next = !showShortcuts;
            setShowShortcuts(next);
            if (next) setShowMinimap(false);
          }}
          title="Ver atajos de teclado y gestos táctiles"
          className={`ios-btn hidden min-[380px]:flex p-1.5 rounded-xl transition-colors shrink-0 ${
            showShortcuts
              ? 'bg-orange-100 text-orange-800'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-stone-200 shrink-0" />

        <button
          type="button"
          onClick={() => applyZoomAtPoint(0.85)}
          title="Alejar lienzo (Ctrl -)"
          className="ios-btn p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 shrink-0"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          ref={zoomLabelRef}
          type="button"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            commitViewportState({ x: rect.width / 2, y: rect.height / 2 }, 1);
          }}
          title="Restablecer escala al 100%"
          className="ios-btn min-w-[40px] sm:min-w-[46px] text-center text-[11px] sm:text-xs font-bold text-stone-700 hover:text-orange-600 shrink-0"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => applyZoomAtPoint(1.18)}
          title="Acercar lienzo (Ctrl +)"
          className="ios-btn p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-stone-200 shrink-0" />

        <button
          type="button"
          onClick={fitToScreen}
          title="Encuadrar todo el organizador en pantalla (Tecla F)"
          className="ios-btn flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 shrink-0"
        >
          <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
          <span className="hidden lg:inline">Encuadrar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onAutoAlign();
            requestAnimationFrame(() => fitToScreen());
          }}
          title="Reordenar y alinear matemáticamente todas las ramas y conexiones"
          className="ios-btn flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[11px] sm:text-xs font-bold shrink-0"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden md:inline">Auto-Alinear</span>
          <span className="md:hidden">Alinear</span>
        </button>
      </div>
    </div>
  );
};

export const Canvas = memo(CanvasInner);
Canvas.displayName = 'Canvas';
