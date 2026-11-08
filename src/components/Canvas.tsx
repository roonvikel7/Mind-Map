import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
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
  onEditEdgeLabel: (edgeId: string, currentLabel: string) => void;
  onAutoAlign: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
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
  onEditEdgeLabel,
  onAutoAlign,
  onUndo,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 520, y: 340 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const nodeToolbarRef = useRef<HTMLDivElement | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

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
    hasMoved?: boolean;
    imageId?: string;
    initialImageX?: number;
    initialImageY?: number;
    initialImageWidth?: number;
    initialImageHeight?: number;
  }>({
    mode: 'none',
    startClientX: 0,
    startClientY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const theme = getThemeConfig(project.theme);
  const scene = useMemo(() => buildProjectSceneGeometry(project), [project]);

  const selectedNode = useMemo(
    () =>
      selectedNodeId
        ? scene.visibleNodes.find(n => n.id === selectedNodeId) || null
        : null,
    [selectedNodeId, scene.visibleNodes]
  );

  useEffect(() => {
    if (editingNodeId && editingNodeId !== selectedNodeId) {
      setEditingNodeId(null);
    }
  }, [selectedNodeId, editingNodeId]);

  // Posicionar la barra flotante contextual 1:1 en pantalla garantizando que jamás se corte en bordes
  useLayoutEffect(() => {
    const tb = nodeToolbarRef.current;
    const host = containerRef.current;
    if (!tb || !host || !selectedNode) return;

    const hostW = host.clientWidth;
    const hostH = host.clientHeight;
    const tbW = tb.offsetWidth;
    const tbH = tb.offsetHeight || 38;

    const cx = pan.x + selectedNode.x * zoom;
    const halfH = ((selectedNode.height || 48) * zoom) / 2;
    const topEdge = pan.y + selectedNode.y * zoom - halfH;
    const bottomEdge = pan.y + selectedNode.y * zoom + halfH;

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

    tb.style.left = `${Math.round(clampedLeft)}px`;
    tb.style.top = `${Math.round(clampedTop)}px`;
  }, [selectedNode, pan.x, pan.y, zoom, editingNodeId, connectSourceId, isPanning]);

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
    const rect = el.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return;

    const { minX, maxX, minY, maxY, width, height } = scene.bounds;
    const isMobile = rect.width < 640;
    const padW = isMobile ? 48 : 130;
    const padH = isMobile ? 96 : 130;

    const scaleX = (rect.width - padW) / Math.max(width, 200);
    const scaleY = (rect.height - padH) / Math.max(height, 140);
    const idealZoom = Math.min(1.08, Math.max(0.22, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(idealZoom);
    setPan({
      x: rect.width / 2 - centerX * idealZoom,
      y: (rect.height - (isMobile ? 20 : 0)) / 2 - centerY * idealZoom,
    });
  }, [scene.bounds]);

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

  // Al seleccionar o crear un nodo, asegurar que él y su barra flotante superior queden dentro del área visible
  useEffect(() => {
    if (!selectedNodeId || !containerRef.current) return;
    if (dragStateRef.current.mode !== 'none') return;

    const target = scene.visibleNodes.find(n => n.id === selectedNodeId);
    if (!target) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return;

    const z = zoomRef.current;
    const px = panRef.current.x;
    const py = panRef.current.y;

    const halfW = ((target.width || 150) * z) / 2;
    const halfH = ((target.height || 50) * z) / 2;
    const cx = px + target.x * z;
    const cy = py + target.y * z;

    const marginX = 24;
    const marginTop = 64; // espacio para la barra contextual flotante del nodo
    const marginBottom = 72; // espacio para la barra de controles inferior

    let shiftX = 0;
    let shiftY = 0;

    if (cx - halfW < marginX) {
      shiftX = marginX - (cx - halfW);
    } else if (cx + halfW > rect.width - marginX) {
      shiftX = rect.width - marginX - (cx + halfW);
    }

    if (cy - halfH < marginTop) {
      shiftY = marginTop - (cy - halfH);
    } else if (cy + halfH > rect.height - marginBottom) {
      shiftY = rect.height - marginBottom - (cy + halfH);
    }

    if (Math.abs(shiftX) > 2 || Math.abs(shiftY) > 2) {
      setPan(prev => ({
        x: prev.x + shiftX,
        y: prev.y + shiftY,
      }));
    }
  }, [selectedNodeId, scene.visibleNodes]);

  // Mantener el centro visual cuando se abren/cierran los paneles laterales en escritorio o cambia el tamaño
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width < 80 || height < 80) return;
      const prev = lastContainerSizeRef.current;
      lastContainerSizeRef.current = { w: width, h: height };
      if (prev && (Math.abs(width - prev.w) > 4 || Math.abs(height - prev.h) > 4)) {
        setPan(p => ({
          x: p.x + (width - prev.w) / 2,
          y: p.y + (height - prev.h) / 2,
        }));
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reencuadrar suavemente si rota la pantalla en móvil/tablet
  useEffect(() => {
    const handleOrientation = () => {
      setTimeout(() => fitToScreen(), 120);
    };
    window.addEventListener('orientationchange', handleOrientation);
    return () => window.removeEventListener('orientationchange', handleOrientation);
  }, [fitToScreen]);

  /** Zoom centrado exactamente sobre un punto de la pantalla */
  const applyZoomAtPoint = useCallback((factor: number, clientX?: number, clientY?: number) => {
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

    setZoom(nextZoom);
    setPan({
      x: cx - worldX * nextZoom,
      y: cy - worldY * nextZoom,
    });
  }, []);

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
  }, []);

  // Bloqueo total del zoom nativo del navegador en rueda/trackpad y zoom fluido interno 60fps
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.8 && Math.abs(e.deltaX) > 2) {
        setPan(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
        return;
      }

      if (e.shiftKey && !e.ctrlKey) {
        setPan(prev => ({
          x: prev.x - (e.deltaY || e.deltaX),
          y: prev.y,
        }));
        return;
      }

      const sensitivity = e.ctrlKey ? 0.009 : 0.0016;
      const factor = Math.exp(-e.deltaY * sensitivity);
      applyZoomAtPoint(factor, e.clientX, e.clientY);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [applyZoomAtPoint]);

  // Atajos de teclado globales estilo EdrawMax + bloqueo de Ctrl +/-/0 del navegador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
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
          const node = project.nodes.find(n => n.id === selectedNodeId);
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
    project.nodes,
    selectedEdgeId,
    selectedImageId,
    selectedNodeId,
  ]);

  // Manejo de arrastre de lienzo (Pan) y gestos táctiles en el fondo
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Si hay 2 dedos apoyados, activar Pinch-to-Zoom + Pan simultáneo
    if (activePointersRef.current.size >= 2) {
      startPinchGesture();
      return;
    }

    if (connectSourceId) {
      onCancelConnect();
    }
    onSelectNode(null);
    onSelectEdge(null);
    onSelectImage?.(null);
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
        moveSubtree: !e.altKey,
        hasMoved: false,
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
      const img = project.images?.find(i => i.id === id);
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
      };
    },
    [project.images, spacePressed, startPinchGesture]
  );

  const handleImageStartResize = useCallback(
    (id: string, e: React.PointerEvent) => {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointersRef.current.size >= 2) {
        startPinchGesture();
        return;
      }

      const img = project.images?.find(i => i.id === id);
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
      };
    },
    [project.images, startPinchGesture]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Gesto multitáctil de 2 dedos: Pinch-to-Zoom + Pan simultáneo a 60fps
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

          setZoom(nextZoom);
          setPan({
            x: midX - pinch.worldMidX * nextZoom,
            y: midY - pinch.worldMidY * nextZoom,
          });
        }
        return;
      }

      if (connectSourceId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const wx = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
        const wy = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;
        setMouseWorldPos({ x: wx, y: wy });
      }

      const st = dragStateRef.current;
      if (st.mode === 'none') return;
      if (st.pointerId !== undefined && e.pointerId !== st.pointerId) return;

      const moveThreshold = st.pointerType === 'touch' ? 6 : 3;

      if (st.mode === 'pan') {
        const dx = e.clientX - st.startClientX;
        const dy = e.clientY - st.startClientY;
        setPan({
          x: st.initialPanX + dx,
          y: st.initialPanY + dy,
        });
      } else if (st.mode === 'node' && st.nodeId) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        if (!st.hasMoved && Math.hypot(dxScreen, dyScreen) > moveThreshold) {
          st.hasMoved = true;
          onBeginDragHistory();
        }
        if (st.hasMoved) {
          const newX = (st.initialNodeX || 0) + dxScreen / zoomRef.current;
          const newY = (st.initialNodeY || 0) + dyScreen / zoomRef.current;
          onMoveNode(st.nodeId, newX, newY, Boolean(st.moveSubtree));
        }
      } else if (st.mode === 'image' && st.imageId) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        if (!st.hasMoved && Math.hypot(dxScreen, dyScreen) > moveThreshold) {
          st.hasMoved = true;
        }
        if (st.hasMoved) {
          const newX = (st.initialImageX || 0) + dxScreen / zoomRef.current;
          const newY = (st.initialImageY || 0) + dyScreen / zoomRef.current;
          onMoveImage?.(st.imageId, newX, newY);
        }
      } else if (st.mode === 'resize-image' && st.imageId) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        const newW = Math.max(60, (st.initialImageWidth || 100) + dxScreen / zoomRef.current);
        const newH = Math.max(50, (st.initialImageHeight || 80) + dyScreen / zoomRef.current);
        onResizeImage?.(st.imageId, Math.round(newW), Math.round(newH));
      }
    };

    const handlePointerEnd = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);

      // Si veníamos de un pellizco de 2 dedos y queda 1 dedo apoyado, pasar suavemente a pan
      if (pinchStateRef.current) {
        if (activePointersRef.current.size < 2) {
          pinchStateRef.current = null;
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
        dragStateRef.current.mode = 'none';
        setIsPanning(false);
      }
    };

    const handleWindowBlur = () => {
      activePointersRef.current.clear();
      pinchStateRef.current = null;
      dragStateRef.current.mode = 'none';
      setIsPanning(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [connectSourceId, onBeginDragHistory, onMoveImage, onMoveNode, onResizeImage, startPinchGesture]);

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
    ? project.nodes.find(n => n.id === connectSourceId) || null
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
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      className={`canvas-touch-surface relative flex-1 h-full overflow-hidden select-none ${bgPatternClass} ${
        isPanning || spacePressed ? 'dragging-canvas' : 'cursor-grab'
      }`}
    >
      {/* Indicador visual al arrastrar archivos de imagen sobre el lienzo */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-orange-500/10 backdrop-blur-[2px] border-4 border-dashed border-orange-500/80 rounded-2xl flex items-center justify-center animate-fade-in m-2">
          <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-2xl border border-orange-200 text-center space-y-1">
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

      {/* Escenario del mundo escalable y trasladable a 60fps */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <EdgeRenderer
          scene={scene}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={id => {
            onSelectNode(null);
            onSelectEdge(id);
          }}
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
        {project.images &&
          project.images.map(img => (
            <CanvasImageItem
              key={img.id}
              image={img}
              isSelected={selectedImageId === img.id}
              onSelect={id => {
                onSelectNode(null);
                onSelectEdge(null);
                onSelectImage?.(id);
              }}
              onStartDrag={handleImageStartDrag}
              onStartResize={handleImageStartResize}
              onDelete={id => onDeleteImage?.(id)}
              onToggleLock={id => onToggleLockImage?.(id)}
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
            onSelect={id => {
              if (connectSourceId) {
                if (connectSourceId !== id) {
                  onCompleteCrossLink(connectSourceId, id);
                } else {
                  onCancelConnect();
                }
                return;
              }
              onSelectEdge(null);
              onSelectNode(id);
            }}
            onEditingChange={(id, editing) => setEditingNodeId(editing ? id : null)}
            onStartDrag={handleNodeStartDrag}
            onCommitText={onCommitNodeText}
            onToggleCollapse={onToggleCollapse}
            onCycleProgress={onCycleProgress}
            onAddChild={onAddChild}
            onOpenNotes={onOpenNotes}
          />
        ))}
      </div>

      {/* Barra flotante contextual 1:1 en espacio de pantalla (fluidez iOS + 0% recorte en bordes) */}
      {selectedNode && !editingNodeId && !connectSourceId && !isPanning && (
        <div
          ref={nodeToolbarRef}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{ left: 8, top: 8 }}
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
                setZoom(targetZ);
                setPan({
                  x: rect.width / 2 - selectedNode.x * targetZ,
                  y: Math.max(120, rect.height * 0.36) - selectedNode.y * targetZ,
                });
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

      {/* Minimapa de Radar Interactivo (fluidez iOS anclado sobre el dock unificado) */}
      {showMinimap && !showShortcuts && scene.visibleNodes.length > 0 && (
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
                {scene.visibleNodes.length}n
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
            viewBox={`${scene.bounds.minX - 60} ${scene.bounds.minY - 60} ${
              scene.bounds.width + 120
            } ${scene.bounds.height + 120}`}
            className="w-full h-[76px] sm:h-[84px] rounded-xl cursor-pointer"
            style={{ backgroundColor: theme.canvasBg }}
            onClick={e => {
              const svgRect = e.currentTarget.getBoundingClientRect();
              const rx = (e.clientX - svgRect.left) / svgRect.width;
              const ry = (e.clientY - svgRect.top) / svgRect.height;
              const targetWX =
                scene.bounds.minX - 60 + rx * (scene.bounds.width + 120);
              const targetWY =
                scene.bounds.minY - 60 + ry * (scene.bounds.height + 120);
              const hostRect = containerRef.current?.getBoundingClientRect();
              if (hostRect) {
                setPan({
                  x: hostRect.width / 2 - targetWX * zoom,
                  y: hostRect.height / 2 - targetWY * zoom,
                });
              }
            }}
          >
            {scene.paths.map(p => (
              <path
                key={p.id}
                d={p.d}
                fill={p.kind === 'fill' ? p.color : 'none'}
                stroke={p.kind === 'fill' ? 'none' : p.color}
                strokeWidth={8}
                opacity={0.45}
              />
            ))}
            {scene.visibleNodes.map(n => (
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

      {/* Pestaña flotante desplegable de Atajos y Gestos (estilo iOS, cero sobreposición) */}
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

      {/* Dock Flotante Único Unificado (Cero colisión garantizada en PC con paneles abiertos y en Celular) */}
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
          type="button"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setZoom(1);
            setPan({ x: rect.width / 2, y: rect.height / 2 });
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
