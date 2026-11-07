import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Minus,
  Plus,
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
  const [showMinimap, setShowMinimap] = useState(true);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const dragStateRef = useRef<{
    mode: 'none' | 'pan' | 'node' | 'image' | 'resize-image';
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

  const childrenExistSet = useMemo(() => {
    const s = new Set<string>();
    project.nodes.forEach(n => {
      if (n.parentId) s.add(n.parentId);
    });
    return s;
  }, [project.nodes]);

  /** Ajusta automáticamente el zoom y el centrado para encuadrar todo el diagrama con aire */
  const fitToScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return;

    const { minX, maxX, minY, maxY, width, height } = scene.bounds;
    const padW = 140;
    const padH = 140;

    const scaleX = (rect.width - padW) / Math.max(width, 220);
    const scaleY = (rect.height - padH) / Math.max(height, 150);
    const idealZoom = Math.min(1.08, Math.max(0.28, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(idealZoom);
    setPan({
      x: rect.width / 2 - centerX * idealZoom,
      y: rect.height / 2 - centerY * idealZoom,
    });
  }, [scene.bounds]);

  // Encuadrar suavemente al cambiar de proyecto o de tipo de estructura
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      fitToScreen();
    });
    return () => cancelAnimationFrame(raf);
  }, [project.id, project.type]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Bloqueo total del zoom nativo del navegador en rueda/trackpad y zoom fluido interno 60fps
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Si hay desplazamiento horizontal explícito de touchpad (dos dedos a los lados sin Ctrl)
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

      // Rueda del ratón o pellizco de touchpad -> Zoom centrado en el cursor
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

  // Manejo de arrastre de lienzo (Pan) y arrastre de nodos
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      if (connectSourceId) {
        onCancelConnect();
      }
      onSelectNode(null);
      onSelectEdge(null);
      onSelectImage?.(null);
      setIsPanning(true);
      dragStateRef.current = {
        mode: 'pan',
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialPanX: panRef.current.x,
        initialPanY: panRef.current.y,
      };
    }
  };

  const handleNodeStartDrag = useCallback(
    (e: React.MouseEvent, node: OrganizerNode) => {
      if (spacePressed) {
        setIsPanning(true);
        dragStateRef.current = {
          mode: 'pan',
          startClientX: e.clientX,
          startClientY: e.clientY,
          initialPanX: panRef.current.x,
          initialPanY: panRef.current.y,
        };
        return;
      }

      dragStateRef.current = {
        mode: 'node',
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
    [spacePressed]
  );

  const handleImageStartDrag = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (spacePressed) return;
      const img = project.images?.find(i => i.id === id);
      if (!img || img.locked) return;

      dragStateRef.current = {
        mode: 'image',
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
    [project.images, spacePressed]
  );

  const handleImageStartResize = useCallback(
    (id: string, e: React.MouseEvent) => {
      const img = project.images?.find(i => i.id === id);
      if (!img || img.locked) return;

      dragStateRef.current = {
        mode: 'resize-image',
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
    [project.images]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectSourceId && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const wx = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
        const wy = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;
        setMouseWorldPos({ x: wx, y: wy });
      }

      const st = dragStateRef.current;
      if (st.mode === 'none') return;

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
        if (!st.hasMoved && Math.hypot(dxScreen, dyScreen) > 3) {
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
        const newX = (st.initialImageX || 0) + dxScreen / zoomRef.current;
        const newY = (st.initialImageY || 0) + dyScreen / zoomRef.current;
        onMoveImage?.(st.imageId, newX, newY);
      } else if (st.mode === 'resize-image' && st.imageId) {
        const dxScreen = e.clientX - st.startClientX;
        const dyScreen = e.clientY - st.startClientY;
        const newW = Math.max(60, (st.initialImageWidth || 100) + dxScreen / zoomRef.current);
        const newH = Math.max(50, (st.initialImageHeight || 80) + dyScreen / zoomRef.current);
        onResizeImage?.(st.imageId, Math.round(newW), Math.round(newH));
      }
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.mode !== 'none') {
        dragStateRef.current.mode = 'none';
        setIsPanning(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectSourceId, onBeginDragHistory, onMoveImage, onMoveNode, onResizeImage]);

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
      onMouseDown={handleCanvasMouseDown}
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
      className={`relative flex-1 h-full overflow-hidden select-none ${bgPatternClass} ${
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
          onMouseDown={e => e.stopPropagation()}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-full bg-orange-600 text-white text-xs font-semibold shadow-lg animate-fade-in"
        >
          <span>
            Conectando desde «{connectingFromNode.text}» — Haz clic en el nodo destino
          </span>
          <button
            type="button"
            onClick={onCancelConnect}
            className="p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
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
            onStartDrag={handleNodeStartDrag}
            onCommitText={onCommitNodeText}
            onToggleCollapse={onToggleCollapse}
            onCycleProgress={onCycleProgress}
            onAddChild={onAddChild}
            onAddSibling={onAddSibling}
            onExpandAi={onExpandAi}
            onOpenNotes={onOpenNotes}
            onStartCrossLink={onStartCrossLink}
            onDelete={onDeleteNode}
          />
        ))}
      </div>

      {/* Minimapa de Radar Interactivo (Esquina Inferior Izquierda) */}
      {showMinimap && scene.visibleNodes.length > 0 && (
        <div
          onMouseDown={e => e.stopPropagation()}
          className="absolute bottom-14 left-4 z-30 w-44 h-28 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200/90 edraw-panel-shadow p-1.5 overflow-hidden pointer-events-auto"
        >
          <div className="flex items-center justify-between px-1 mb-0.5">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">
              Vista General
            </span>
            <span className="text-[9.5px] font-semibold text-stone-400">
              {scene.visibleNodes.length} nodos
            </span>
          </div>
          <svg
            viewBox={`${scene.bounds.minX - 60} ${scene.bounds.minY - 60} ${
              scene.bounds.width + 120
            } ${scene.bounds.height + 120}`}
            className="w-full h-[84px] rounded-lg"
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

      {/* Guía inferior izquierda de atajos rápidos */}
      <div
        onMouseDown={e => e.stopPropagation()}
        className="hidden md:flex absolute bottom-3 left-4 z-30 items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200/80 text-[11px] text-stone-600 shadow-sm"
      >
        <span className="px-1.5 py-0.5 rounded bg-stone-100 font-semibold text-stone-700">
          Tab
        </span>
        <span>Subtema</span>
        <span className="text-stone-300">•</span>
        <span className="px-1.5 py-0.5 rounded bg-stone-100 font-semibold text-stone-700">
          Enter
        </span>
        <span>Hermano</span>
        <span className="text-stone-300">•</span>
        <span className="px-1.5 py-0.5 rounded bg-stone-100 font-semibold text-stone-700">
          Doble Clic
        </span>
        <span>Editar</span>
        <span className="text-stone-300">•</span>
        <span className="px-1.5 py-0.5 rounded bg-stone-100 font-semibold text-stone-700">
          Rueda / Arrastrar
        </span>
        <span>Zoom y Lienzo</span>
      </div>

      {/* Controles flotantes de navegación, encuadre y auto-alineación (Esquina Inferior Derecha) */}
      <div
        onMouseDown={e => e.stopPropagation()}
        className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 edraw-panel-shadow"
      >
        <button
          type="button"
          onClick={() => setShowMinimap(v => !v)}
          title={showMinimap ? 'Ocultar minimapa' : 'Mostrar minimapa'}
          className={`p-1.5 rounded-lg transition-colors ${
            showMinimap
              ? 'bg-amber-50 text-amber-700'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-stone-200" />

        <button
          type="button"
          onClick={() => applyZoomAtPoint(0.85)}
          title="Alejar lienzo (Ctrl -)"
          className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
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
          className="min-w-[48px] text-center text-xs font-bold text-stone-700 hover:text-orange-600 transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => applyZoomAtPoint(1.18)}
          title="Acercar lienzo (Ctrl +)"
          className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-stone-200" />

        <button
          type="button"
          onClick={fitToScreen}
          title="Encuadrar todo el organizador en pantalla (Tecla F)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
          <span className="hidden sm:inline">Encuadrar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onAutoAlign();
            requestAnimationFrame(() => fitToScreen());
          }}
          title="Reordenar y alinear matemáticamente todas las ramas y conexiones"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
          <span>Auto-Alinear</span>
        </button>
      </div>
    </div>
  );
};
