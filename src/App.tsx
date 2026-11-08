import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  CanvasBgStyle,
  CanvasImage,
  EdgeStyle,
  OrganizerEdge,
  OrganizerNode,
  OrganizerProject,
  OrganizerType,
  ThemeId,
} from './types/organizer';
import { readImageFileAsDataUrl } from './utils/imageHelper';
import {
  loadApiSettings,
  loadInitialProjects,
  saveActiveProjectId,
  saveProjects,
} from './utils/storage';
import { applyLayout } from './utils/layouts';
import { expandNodeWithAi, generateOrganizer } from './utils/aiService';
import { getThemeConfig } from './utils/themes';
import { parseImportedProjectJson } from './utils/exporter';
import {
  buildStarterProjectNodes,
  getDefaultTitleForType,
  isCartographicStructure,
  TemplateCard,
} from './utils/templates';
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightInspector } from './components/RightInspector';
import { Canvas } from './components/Canvas';
import { CreateChooserModal } from './components/CreateChooserModal';

// Carga diferida inteligente de modales secundarios para aligerar el bundle inicial
const loadAiModal = () =>
  import('./components/AiModal').then(m => ({ default: m.AiModal }));
const loadTemplatesModal = () =>
  import('./components/TemplatesModal').then(m => ({ default: m.TemplatesModal }));
const loadExportModal = () =>
  import('./components/ExportModal').then(m => ({ default: m.ExportModal }));
const loadNodeNotesModal = () =>
  import('./components/NodeNotesModal').then(m => ({ default: m.NodeNotesModal }));
const loadEdgeLabelModal = () =>
  import('./components/EdgeLabelModal').then(m => ({ default: m.EdgeLabelModal }));
const loadSettingsModal = () =>
  import('./components/SettingsModal').then(m => ({ default: m.SettingsModal }));
const loadPresentationView = () =>
  import('./components/PresentationView').then(m => ({ default: m.PresentationView }));

const AiModal = lazy(loadAiModal);
const TemplatesModal = lazy(loadTemplatesModal);
const ExportModal = lazy(loadExportModal);
const NodeNotesModal = lazy(loadNodeNotesModal);
const EdgeLabelModal = lazy(loadEdgeLabelModal);
const SettingsModal = lazy(loadSettingsModal);
const PresentationView = lazy(loadPresentationView);

export function App() {
  const [projects, setProjects] = useState<OrganizerProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [rightOpen, setRightOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [toast, setToast] = useState<string | null>(null);

  // Historial Deshacer / Rehacer
  const [historyPast, setHistoryPast] = useState<
    { nodes: OrganizerNode[]; edges: OrganizerEdge[] }[]
  >([]);
  const [historyFuture, setHistoryFuture] = useState<
    { nodes: OrganizerNode[]; edges: OrganizerEdge[] }[]
  >([]);

  // Modales
  const [createChooserOpen, setCreateChooserOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [notesNodeId, setNotesNodeId] = useState<string | null>(null);
  const [editingEdge, setEditingEdge] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(prev => (prev === msg ? null : prev)), 2800);
  }, []);

  useEffect(() => {
    let wasDesktop = window.innerWidth >= 1024;
    const handleViewportChange = () => {
      const isNowDesktop = window.innerWidth >= 1024;
      if (wasDesktop && !isNowDesktop) {
        setLeftOpen(false);
        setRightOpen(false);
      }
      wasDesktop = isNowDesktop;
    };
    window.addEventListener('resize', handleViewportChange);

    loadInitialProjects().then(({ projects: loaded, activeId }) => {
      setProjects(loaded);
      setActiveProjectId(activeId);
      // Al inicio o cuando el usuario abra la web, mostrar el selector para escoger qué crear
      setCreateChooserOpen(true);

      // Precarga en tiempo ocioso para que abrir cualquier pestaña o modal sea en 0ms
      const preloadChunks = () => {
        void loadTemplatesModal();
        void loadAiModal();
        void loadExportModal();
        void loadNodeNotesModal();
        void loadEdgeLabelModal();
        void loadSettingsModal();
        void loadPresentationView();
      };
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(preloadChunks, { timeout: 2500 });
      } else {
        setTimeout(preloadChunks, 1200);
      }
    });

    return () => window.removeEventListener('resize', handleViewportChange);
  }, []);

  const handleToggleLeft = useCallback(() => {
    setLeftOpen(prev => {
      const next = !prev;
      if (next && window.innerWidth < 1024) {
        setRightOpen(false);
      }
      return next;
    });
  }, []);

  const handleToggleRight = useCallback(() => {
    setRightOpen(prev => {
      const next = !prev;
      if (next && window.innerWidth < 1024) {
        setLeftOpen(false);
      }
      return next;
    });
  }, []);

  // Cerrar cualquier ventana, modal o drawer móvil al presionar la tecla Escape
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (createChooserOpen) setCreateChooserOpen(false);
        if (aiModalOpen) setAiModalOpen(false);
        if (templatesOpen) setTemplatesOpen(false);
        if (exportOpen) setExportOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (notesNodeId) setNotesNodeId(null);
        if (editingEdge) setEditingEdge(null);
        if (window.innerWidth < 1024) {
          setLeftOpen(false);
          setRightOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [createChooserOpen, aiModalOpen, templatesOpen, exportOpen, settingsOpen, notesNodeId, editingEdge]);

  const activeProject =
    projects.find(p => p.id === activeProjectId) || projects[0];

  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;
  const connectSourceIdRef = useRef(connectSourceId);
  connectSourceIdRef.current = connectSourceId;

  const pushHistory = useCallback(
    (nodes: OrganizerNode[], edges: OrganizerEdge[]) => {
      setHistoryPast(past => [...past.slice(-30), { nodes, edges }]);
      setHistoryFuture([]);
    },
    []
  );

  const commitProjectPatch = useCallback(
    (patch: Partial<OrganizerProject>) => {
      const currentProj = activeProjectRef.current;
      if (!currentProj) return;
      const targetId = currentProj.id;
      setProjects(prev => {
        const updated = prev.map(p =>
          p.id === targetId
            ? { ...p, ...patch, updatedAt: Date.now() }
            : p
        );
        saveProjects(updated);
        return updated;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0 || !activeProject) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryFuture(f => [
      { nodes: activeProject.nodes, edges: activeProject.edges },
      ...f,
    ]);
    setHistoryPast(p => p.slice(0, -1));
    commitProjectPatch({ nodes: previous.nodes, edges: previous.edges });
  }, [activeProject, commitProjectPatch, historyPast]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0 || !activeProject) return;
    const next = historyFuture[0];
    setHistoryPast(p => [
      ...p,
      { nodes: activeProject.nodes, edges: activeProject.edges },
    ]);
    setHistoryFuture(f => f.slice(1));
    commitProjectPatch({ nodes: next.nodes, edges: next.edges });
  }, [activeProject, commitProjectPatch, historyFuture]);

  // Añadir hijo con auto-layout determinista inmediato (soporta presets de formas de flujo EdrawMax)
  const handleAddChild = useCallback(
    (parentNodeId: string, preset?: Partial<OrganizerNode>) => {
      if (!activeProject) return;
      pushHistory(activeProject.nodes, activeProject.edges);

      const parent = activeProject.nodes.find(n => n.id === parentNodeId);
      if (!parent) return;

      const theme = getThemeConfig(activeProject.theme);
      const siblingCount = activeProject.nodes.filter(
        n => n.parentId === parentNodeId
      ).length;
      const newId = `node-${Date.now()}`;
      const branchColor =
        activeProject.rainbowBranches === false
          ? theme.palette[0]
          : parent.isRoot
          ? theme.palette[siblingCount % theme.palette.length]
          : parent.color || theme.palette[0];

      const newNode: OrganizerNode = {
        id: newId,
        text: preset?.text || 'Nuevo Subtema',
        parentId: parentNodeId,
        x: parent.x + 160,
        y: parent.y,
        width: 136,
        height: 42,
        color: branchColor,
        shape: preset?.shape,
        flowType: preset?.flowType,
        icon: preset?.icon,
      };

      const newEdge: OrganizerEdge = {
        id: `edge-${Date.now()}`,
        from: parentNodeId,
        to: newId,
        color: branchColor,
        label: activeProject.type === 'concept' ? 'comprende' : undefined,
      };

      const uncollapsedNodes = activeProject.nodes.map(n =>
        n.id === parentNodeId ? { ...n, collapsed: false } : n
      );

      const relaid = applyLayout(
        [...uncollapsedNodes, newNode],
        [...activeProject.edges, newEdge],
        activeProject.type,
        activeProject.theme,
        false,
        activeProject.cartographicDirection || 'clockwise'
      );

      commitProjectPatch({ nodes: relaid.nodes, edges: relaid.edges });
      setSelectedNodeId(newId);
      setSelectedEdgeId(null);
    },
    [activeProject, commitProjectPatch, pushHistory]
  );

  // Añadir nodo hermano
  const handleAddSibling = useCallback(
    (nodeId: string) => {
      if (!activeProject) return;
      const node = activeProject.nodes.find(n => n.id === nodeId);
      if (!node) return;
      if (node.isRoot || !node.parentId) {
        handleAddChild(node.id);
      } else {
        handleAddChild(node.parentId);
      }
    },
    [activeProject, handleAddChild]
  );

  // Eliminar nodo y toda su subrama
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!activeProject) return;
      const target = activeProject.nodes.find(n => n.id === nodeId);
      if (!target || target.isRoot) return;

      pushHistory(activeProject.nodes, activeProject.edges);

      const toDelete = new Set<string>([nodeId]);
      const queue = [nodeId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        activeProject.nodes.forEach(n => {
          if (n.parentId === curr && !toDelete.has(n.id)) {
            toDelete.add(n.id);
            queue.push(n.id);
          }
        });
      }

      const remainingNodes = activeProject.nodes.filter(
        n => !toDelete.has(n.id)
      );
      const remainingEdges = activeProject.edges.filter(
        e => !toDelete.has(e.from) && !toDelete.has(e.to)
      );

      const relaid = applyLayout(
        remainingNodes,
        remainingEdges,
        activeProject.type,
        activeProject.theme,
        false,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({ nodes: relaid.nodes, edges: relaid.edges });
      setSelectedNodeId(null);
    },
    [activeProject, commitProjectPatch, pushHistory]
  );

  // Eliminar una relación cruzada
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      if (!activeProject) return;
      const edge = activeProject.edges.find(e => e.id === edgeId);
      if (!edge) return;

      if (!edge.isCrossLink) {
        showToast('Para quitar una rama jerárquica, elimina su nodo destino.');
        return;
      }

      pushHistory(activeProject.nodes, activeProject.edges);
      commitProjectPatch({
        edges: activeProject.edges.filter(e => e.id !== edgeId),
      });
      setSelectedEdgeId(null);
    },
    [activeProject, commitProjectPatch, pushHistory, showToast]
  );

  // Insertar archivo de imagen en el mapa
  const handleAddImageFile = useCallback(
    async (file: File, worldX?: number, worldY?: number) => {
      if (!activeProject) return;
      try {
        const processed = await readImageFileAsDataUrl(file);
        const rootNode =
          activeProject.nodes.find(n => n.isRoot) || activeProject.nodes[0];
        const defaultX = (rootNode?.x || 0) + 220;
        const defaultY = (rootNode?.y || 0) + 120;

        const newImage: CanvasImage = {
          id: `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          url: processed.url,
          title: processed.title,
          width: processed.width,
          height: processed.height,
          x: Math.round(worldX ?? defaultX),
          y: Math.round(worldY ?? defaultY),
          borderRadius: 12,
          opacity: 1,
          locked: false,
        };

        const currentImages = activeProject.images || [];
        commitProjectPatch({ images: [...currentImages, newImage] });
        setSelectedImageId(newImage.id);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        showToast(`Imagen «${processed.title}» agregada al lienzo.`);
      } catch (err: any) {
        showToast(err?.message || 'Error al procesar la imagen.');
      }
    },
    [activeProject, commitProjectPatch, showToast]
  );

  // Mover imagen libremente
  const handleMoveImage = useCallback(
    (id: string, newX: number, newY: number) => {
      if (!activeProject) return;
      const currentImages = activeProject.images || [];
      const updated = currentImages.map(img =>
        img.id === id ? { ...img, x: Math.round(newX), y: Math.round(newY) } : img
      );
      commitProjectPatch({ images: updated });
    },
    [activeProject, commitProjectPatch]
  );

  // Redimensionar imagen
  const handleResizeImage = useCallback(
    (id: string, newWidth: number, newHeight: number) => {
      if (!activeProject) return;
      const currentImages = activeProject.images || [];
      const updated = currentImages.map(img =>
        img.id === id
          ? {
              ...img,
              width: Math.round(newWidth),
              height: Math.round(newHeight),
            }
          : img
      );
      commitProjectPatch({ images: updated });
    },
    [activeProject, commitProjectPatch]
  );

  // Eliminar imagen
  const handleDeleteImage = useCallback(
    (id: string) => {
      if (!activeProject) return;
      const currentImages = activeProject.images || [];
      commitProjectPatch({ images: currentImages.filter(img => img.id !== id) });
      if (selectedImageId === id) setSelectedImageId(null);
      showToast('Imagen eliminada del mapa.');
    },
    [activeProject, commitProjectPatch, selectedImageId, showToast]
  );

  // Bloquear o desbloquear posición de imagen
  const handleToggleLockImage = useCallback(
    (id: string) => {
      if (!activeProject) return;
      const currentImages = activeProject.images || [];
      let nextLocked = false;
      const updated = currentImages.map(img => {
        if (img.id === id) {
          nextLocked = !img.locked;
          return { ...img, locked: nextLocked };
        }
        return img;
      });
      commitProjectPatch({ images: updated });
      showToast(nextLocked ? 'Posición de imagen bloqueada.' : 'Imagen desbloqueada.');
    },
    [activeProject, commitProjectPatch, showToast]
  );

  // Actualizar propiedades de imagen
  const handleUpdateImage = useCallback(
    (id: string, updates: Partial<CanvasImage>) => {
      if (!activeProject) return;
      const currentImages = activeProject.images || [];
      const updated = currentImages.map(img =>
        img.id === id ? { ...img, ...updates } : img
      );
      commitProjectPatch({ images: updated });
    },
    [activeProject, commitProjectPatch]
  );

  // Actualizar propiedades de un nodo con re-medición y re-layout automático
  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<OrganizerNode>) => {
      if (!activeProject) return;
      pushHistory(activeProject.nodes, activeProject.edges);

      // Si cambia el color de una rama principal, propagarlo a sus descendientes directos del mismo color
      const targetPrev = activeProject.nodes.find(n => n.id === nodeId);
      let updatedNodes = activeProject.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      );

      if (updates.color && targetPrev && !targetPrev.isRoot) {
        const subIds = new Set<string>();
        const q = [nodeId];
        while (q.length > 0) {
          const cur = q.shift()!;
          updatedNodes.forEach(n => {
            if (n.parentId === cur && !subIds.has(n.id)) {
              subIds.add(n.id);
              q.push(n.id);
            }
          });
        }
        updatedNodes = updatedNodes.map(n =>
          subIds.has(n.id) ? { ...n, color: updates.color } : n
        );
      }

      const relaid = applyLayout(
        updatedNodes,
        activeProject.edges,
        activeProject.type,
        activeProject.theme,
        false,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({ nodes: relaid.nodes, edges: relaid.edges });
    },
    [activeProject, commitProjectPatch, pushHistory]
  );

  // Contraer / Expandir subrama
  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      if (!activeProject) return;
      const updatedNodes = activeProject.nodes.map(n =>
        n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n
      );
      const relaid = applyLayout(
        updatedNodes,
        activeProject.edges,
        activeProject.type,
        activeProject.theme,
        false,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({ nodes: relaid.nodes, edges: relaid.edges });
    },
    [activeProject, commitProjectPatch]
  );

  // Avanzar progreso circular al hacer clic (0 -> 25 -> 50 -> 75 -> 100 -> 0)
  const handleCycleProgress = useCallback(
    (nodeId: string) => {
      if (!activeProject) return;
      const node = activeProject.nodes.find(n => n.id === nodeId);
      if (!node) return;
      const steps: (0 | 25 | 50 | 75 | 100)[] = [0, 25, 50, 75, 100];
      const idx = steps.indexOf(node.progress ?? 0);
      const next = steps[(idx + 1) % steps.length];
      handleUpdateNode(nodeId, { progress: next });
    },
    [activeProject, handleUpdateNode]
  );

  // Movimiento manual fluido en el lienzo (mueve el nodo y opcionalmente su subrama)
  const handleBeginDragHistory = useCallback(() => {
    if (!activeProject) return;
    pushHistory(activeProject.nodes, activeProject.edges);
  }, [activeProject, pushHistory]);

  const handleMoveNode = useCallback(
    (nodeId: string, newX: number, newY: number, moveSubtree: boolean) => {
      if (!activeProject) return;
      const target = activeProject.nodes.find(n => n.id === nodeId);
      if (!target) return;

      const dx = newX - target.x;
      const dy = newY - target.y;

      const idsToShift = new Set<string>([nodeId]);
      if (moveSubtree && !target.isRoot) {
        const q = [nodeId];
        while (q.length > 0) {
          const c = q.shift()!;
          activeProject.nodes.forEach(n => {
            if (n.parentId === c && !idsToShift.has(n.id)) {
              idsToShift.add(n.id);
              q.push(n.id);
            }
          });
        }
      }

      const movedNodes = activeProject.nodes.map(n =>
        idsToShift.has(n.id)
          ? {
              ...n,
              x: n.x + dx,
              y: n.y + dy,
              ribTipX: n.ribTipX !== undefined ? n.ribTipX + dx : undefined,
              ribTipY: n.ribTipY !== undefined ? n.ribTipY + dy : undefined,
              ribAnchorX:
                n.ribAnchorX !== undefined ? n.ribAnchorX + dx : undefined,
            }
          : n
      );

      commitProjectPatch({ nodes: movedNodes });
    },
    [activeProject, commitProjectPatch]
  );

  // Auto-Alinear todo el proyecto
  const handleAutoAlign = useCallback(() => {
    if (!activeProject) return;
    pushHistory(activeProject.nodes, activeProject.edges);
    const relaid = applyLayout(
      activeProject.nodes,
      activeProject.edges,
      activeProject.type,
      activeProject.theme,
      false,
      activeProject.cartographicDirection || 'clockwise'
    );
    commitProjectPatch({ nodes: relaid.nodes, edges: relaid.edges });
    showToast('Estructura alineada con precisión geométrica.');
  }, [activeProject, commitProjectPatch, pushHistory, showToast]);

  // Relaciones cruzadas
  const handleCompleteCrossLink = useCallback(
    (fromId: string, toId: string) => {
      if (!activeProject || fromId === toId) {
        setConnectSourceId(null);
        return;
      }
      pushHistory(activeProject.nodes, activeProject.edges);
      const newEdge: OrganizerEdge = {
        id: `cross-${Date.now()}`,
        from: fromId,
        to: toId,
        label: 'se relaciona con',
        isCrossLink: true,
        color: '#EA580C',
      };
      commitProjectPatch({ edges: [...activeProject.edges, newEdge] });
      setConnectSourceId(null);
      setSelectedEdgeId(newEdge.id);
      setEditingEdge({ id: newEdge.id, label: newEdge.label || '' });
    },
    [activeProject, commitProjectPatch, pushHistory]
  );

  // Expandir nodo con IA (Google Gemini o semántico local)
  const handleExpandAi = useCallback(
    async (node: OrganizerNode) => {
      if (!activeProject) return;
      const apiSettings = loadApiSettings();
      const hasGemini = Boolean(apiSettings.geminiApiKey?.trim());
      showToast(
        hasGemini
          ? `Consultando a Google Gemini para ramificar «${node.text}»...`
          : `Generando ramificaciones para «${node.text}»...`
      );

      try {
        pushHistory(activeProject.nodes, activeProject.edges);
        const { nodes, edges, count } = await expandNodeWithAi(
          node,
          activeProject.nodes,
          activeProject.edges,
          activeProject.type,
          activeProject.theme,
          apiSettings,
          activeProject.title,
          activeProject.cartographicDirection || 'clockwise'
        );
        commitProjectPatch({ nodes, edges });
        showToast(
          hasGemini
            ? `¡${count} sub-ramas creadas con Google Gemini para «${node.text}»!`
            : `¡${count} sub-ramas estructuradas para «${node.text}»!`
        );
      } catch (err: any) {
        showToast(err?.message || 'Error al generar ramificaciones.');
      }
    },
    [activeProject, commitProjectPatch, pushHistory, showToast]
  );

  // Cambiar tipo de estructura (9 motores)
  const handleChangeType = useCallback(
    (newType: OrganizerType) => {
      if (!activeProject) return;
      pushHistory(activeProject.nodes, activeProject.edges);

      let targetNodes = activeProject.nodes;
      let targetEdges = activeProject.edges;

      // Si el proyecto actual solo tiene el nodo raíz (o es Cartografía sin los 8 ejes), generamos la estructura completa lista
      if (newType === 'cartographic' && !isCartographicStructure(targetNodes)) {
        const root =
          targetNodes.find(n => n.isRoot || (n.depth || 0) === 0) ||
          targetNodes[0];
        const title =
          root?.text || activeProject.title || getDefaultTitleForType(newType);
        const generated = buildStarterProjectNodes('cartographic', title, root?.id, root);
        targetNodes = generated.nodes;
        targetEdges = generated.edges;
        showToast('Cartografía lista: 8 ejes con cuadros para escribir directamente.');
      } else if (targetNodes.length <= 1) {
        const root = targetNodes[0];
        const title =
          root?.text || activeProject.title || getDefaultTitleForType(newType);
        const generated = buildStarterProjectNodes(newType, title, root?.id, root);
        targetNodes = generated.nodes;
        targetEdges = generated.edges;
        showToast(`Estructura lista: «${title}»`);
      }

      const relaid = applyLayout(
        targetNodes,
        targetEdges,
        newType,
        activeProject.theme,
        true,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({
        type: newType,
        nodes: relaid.nodes,
        edges: relaid.edges,
      });
    },
    [activeProject, commitProjectPatch, pushHistory, showToast]
  );

  // Cambiar tema global EdrawMax
  const handleChangeTheme = useCallback(
    (newTheme: ThemeId) => {
      if (!activeProject) return;
      pushHistory(activeProject.nodes, activeProject.edges);
      const relaid = applyLayout(
        activeProject.nodes,
        activeProject.edges,
        activeProject.type,
        newTheme,
        true,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({
        theme: newTheme,
        nodes: relaid.nodes,
        edges: relaid.edges,
      });
    },
    [activeProject, commitProjectPatch, pushHistory]
  );

  const handleChangeConnectorStyle = useCallback(
    (style: EdgeStyle) => {
      commitProjectPatch({ connectorStyle: style });
    },
    [commitProjectPatch]
  );

  const handleChangeCanvasBg = useCallback(
    (bg: CanvasBgStyle) => {
      commitProjectPatch({ canvasBg: bg });
    },
    [commitProjectPatch]
  );

  const handleToggleRainbowBranches = useCallback(() => {
    if (!activeProject) return;
    const nextRainbow = activeProject.rainbowBranches === false;
    const themeCfg = getThemeConfig(activeProject.theme);

    if (!nextRainbow) {
      const uniform = themeCfg.palette[0];
      const updatedNodes = activeProject.nodes.map(n =>
        n.isRoot ? n : { ...n, color: uniform }
      );
      const updatedEdges = activeProject.edges.map(e =>
        e.isCrossLink ? e : { ...e, color: uniform }
      );
      commitProjectPatch({
        rainbowBranches: false,
        nodes: updatedNodes,
        edges: updatedEdges,
      });
    } else {
      const relaid = applyLayout(
        activeProject.nodes,
        activeProject.edges,
        activeProject.type,
        activeProject.theme,
        true,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({
        rainbowBranches: true,
        nodes: relaid.nodes,
        edges: relaid.edges,
      });
    }
  }, [activeProject, commitProjectPatch]);

  const handleExpandOrCollapseAll = useCallback(
    (collapse: boolean) => {
      if (!activeProject) return;
      const updatedNodes = activeProject.nodes.map(n =>
        n.isRoot ? { ...n, collapsed: false } : { ...n, collapsed: collapse }
      );
      const relaid = applyLayout(
        updatedNodes,
        activeProject.edges,
        activeProject.type,
        activeProject.theme,
        false,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({ nodes: relaid.nodes, edges: relaid.edges });
    },
    [activeProject, commitProjectPatch]
  );

  // Conmutar dirección Horaria vs Antihoraria en Cartografía Conceptual
  const handleChangeCartographicDirection = useCallback(
    (newDirection: 'clockwise' | 'counterclockwise') => {
      if (!activeProject) return;
      pushHistory(activeProject.nodes, activeProject.edges);
      const relaid = applyLayout(
        activeProject.nodes,
        activeProject.edges,
        activeProject.type,
        activeProject.theme,
        false,
        newDirection
      );
      commitProjectPatch({
        cartographicDirection: newDirection,
        nodes: relaid.nodes,
        edges: relaid.edges,
      });
      showToast(
        newDirection === 'clockwise'
          ? 'Cartografía reconfigurada en Sentido Horario.'
          : 'Cartografía reconfigurada en Sentido Antihorario.'
      );
    },
    [activeProject, commitProjectPatch, pushHistory, showToast]
  );

  // Generar nuevo organizador desde el modal IA (con Google Gemini si hay clave o motor local)
  const handleGenerateAi = async (
    topic: string,
    type: OrganizerType,
    details?: string,
    depth: 'standard' | 'deep' = 'deep'
  ) => {
    const apiSettings = loadApiSettings();
    const effectiveProvider = apiSettings.geminiApiKey?.trim()
      ? 'gemini'
      : apiSettings.openaiApiKey?.trim()
      ? 'openai'
      : apiSettings.defaultProvider;

    const apiKey =
      effectiveProvider === 'gemini'
        ? apiSettings.geminiApiKey
        : effectiveProvider === 'openai'
        ? apiSettings.openaiApiKey
        : undefined;

    if (effectiveProvider === 'gemini' && apiKey) {
      showToast(`Generando organizador sobre «${topic}» con Google Gemini API...`);
    }

    const themeToUse: ThemeId = activeProject?.theme || 'vitality-warm';
    const result = await generateOrganizer(
      {
        topic,
        type,
        details,
        depth,
        apiKey,
        provider: effectiveProvider,
      },
      themeToUse
    );

    const newProj: OrganizerProject = {
      id: `proj-${Date.now()}`,
      title: result.title,
      type: result.type,
      theme: themeToUse,
      canvasBg: 'dots',
      rainbowBranches: true,
      nodes: result.nodes,
      edges: result.edges,
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects(prev => {
      const updated = [newProj, ...prev];
      saveProjects(updated);
      return updated;
    });
    setActiveProjectId(newProj.id);
    saveActiveProjectId(newProj.id);
    setSelectedNodeId(null);
    setSelectedImageId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    showToast(
      effectiveProvider === 'gemini' && apiKey
        ? `¡Organizador «${newProj.title}» creado con Google Gemini!`
        : `Organizador «${newProj.title}» creado con éxito.`
    );
  };

  // Crear a partir de plantilla
  const handleSelectTemplate = async (card: TemplateCard) => {
    const result = await generateOrganizer(
      { topic: card.queryKey, type: card.type },
      card.theme
    );
    const newProj: OrganizerProject = {
      id: `proj-${Date.now()}`,
      title: result.title,
      type: card.type,
      theme: card.theme,
      canvasBg: 'dots',
      rainbowBranches: true,
      nodes: result.nodes,
      edges: result.edges,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => {
      const updated = [newProj, ...prev];
      saveProjects(updated);
      return updated;
    });
    setActiveProjectId(newProj.id);
    saveActiveProjectId(newProj.id);
    setSelectedNodeId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
  };

  // Crear mapa con la estructura limpia y completa para cualquiera de los 12 tipos
  const handleCreateNewProject = (
    type: OrganizerType = 'mindmap',
    title?: string
  ) => {
    const stamp = Date.now();
    const rootId = `root-${stamp}`;
    const themeToUse: ThemeId = activeProject?.theme || 'vitality-warm';
    const actualTitle = (title && title.trim()) || getDefaultTitleForType(type);

    const generated = buildStarterProjectNodes(type, actualTitle, rootId);

    const relaid = applyLayout(
      generated.nodes,
      generated.edges,
      type,
      themeToUse,
      true,
      'clockwise'
    );

    const newProj: OrganizerProject = {
      id: `proj-${stamp}`,
      title: actualTitle,
      type,
      theme: themeToUse,
      canvasBg: 'dots',
      rainbowBranches: true,
      cartographicDirection: 'clockwise',
      nodes: relaid.nodes,
      edges: relaid.edges,
      images: [],
      createdAt: stamp,
      updatedAt: stamp,
    };

    setProjects(prev => {
      const updated = [newProj, ...prev];
      saveProjects(updated);
      return updated;
    });
    setActiveProjectId(newProj.id);
    saveActiveProjectId(newProj.id);
    setSelectedNodeId(rootId);
    setSelectedEdgeId(null);
    setSelectedImageId(null);
    setConnectSourceId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    showToast(`Plantilla lista: «${actualTitle}»`);
  };

  // Eliminar proyecto guardado
  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    setProjects(prev => {
      const remaining = prev.filter(p => p.id !== id);
      saveProjects(remaining);
      if (activeProject?.id === id && remaining[0]) {
        setActiveProjectId(remaining[0].id);
        saveActiveProjectId(remaining[0].id);
      }
      return remaining;
    });
    showToast('Proyecto eliminado.');
  };

  // Importar archivo JSON de proyecto
  const handleImportJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseImportedProjectJson(text);
      setProjects(prev => {
        const updated = [imported, ...prev];
        saveProjects(updated);
        return updated;
      });
      setActiveProjectId(imported.id);
      saveActiveProjectId(imported.id);
      showToast(`Proyecto «${imported.title}» importado con éxito.`);
    } catch (err) {
      console.error(err);
      showToast('No se pudo importar el archivo JSON seleccionado.');
    }
  };

  // Guardar etiqueta de conector
  const handleSaveEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      const currentProj = activeProjectRef.current;
      if (!currentProj) return;
      pushHistory(currentProj.nodes, currentProj.edges);
      const updatedEdges = currentProj.edges.map(e =>
        e.id === edgeId ? { ...e, label: label || undefined } : e
      );
      commitProjectPatch({ edges: updatedEdges });
    },
    [commitProjectPatch, pushHistory]
  );

  // Callbacks memorizados para evitar re-renders innecesarios en barras e inspectores
  const handleSelectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    saveActiveProjectId(id);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedImageId(null);
    setConnectSourceId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
  }, []);

  const handleUpdateTitle = useCallback(
    (title: string) => {
      commitProjectPatch({ title });
    },
    [commitProjectPatch]
  );

  const handleToggleConnectMode = useCallback(() => {
    if (connectSourceIdRef.current) {
      setConnectSourceId(null);
    } else {
      const currentProj = activeProjectRef.current;
      const startId =
        selectedNodeIdRef.current ||
        currentProj?.nodes.find(n => n.isRoot)?.id ||
        currentProj?.nodes[0]?.id;
      if (startId) {
        setConnectSourceId(startId);
      }
    }
  }, []);

  const handleOpenAiModal = useCallback(() => setAiModalOpen(true), []);
  const handleOpenTemplates = useCallback(() => setTemplatesOpen(true), []);
  const handleOpenExport = useCallback(() => setExportOpen(true), []);
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleOpenPresentation = useCallback(() => setPresentationOpen(true), []);
  const handleOpenCreateChooser = useCallback(() => setCreateChooserOpen(true), []);

  const handleSidebarSelectNode = useCallback((id: string) => {
    setSelectedEdgeId(null);
    setSelectedImageId(null);
    setSelectedNodeId(id);
  }, []);

  const handleSidebarStartCrossLink = useCallback(() => {
    const currentProj = activeProjectRef.current;
    const fromId =
      selectedNodeIdRef.current ||
      currentProj?.nodes.find(n => n.isRoot)?.id ||
      currentProj?.nodes[0]?.id;
    if (fromId) setConnectSourceId(fromId);
  }, []);

  const handleCloseLeft = useCallback(() => setLeftOpen(false), []);
  const handleCloseRight = useCallback(() => setRightOpen(false), []);

  const handleCanvasSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) setSelectedImageId(null);
  }, []);

  const handleCanvasSelectEdge = useCallback((id: string | null) => {
    setSelectedEdgeId(id);
    if (id) setSelectedImageId(null);
  }, []);

  const handleCanvasSelectImage = useCallback((id: string | null) => {
    setSelectedImageId(id);
    if (id) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, []);

  const handleCancelConnect = useCallback(() => setConnectSourceId(null), []);
  const handleStartCrossLinkFromNode = useCallback(
    (fromId: string) => setConnectSourceId(fromId),
    []
  );
  const handleCommitNodeText = useCallback(
    (id: string, text: string) => handleUpdateNode(id, { text }),
    [handleUpdateNode]
  );
  const handleOpenNotes = useCallback((id: string) => setNotesNodeId(id), []);
  const handleEditEdgeLabel = useCallback(
    (id: string, label: string) => setEditingEdge({ id, label }),
    []
  );

  if (!activeProject) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-stone-700 gap-3">
        <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-wide text-stone-500">
          Preparando estudio visual...
        </span>
      </div>
    );
  }

  const selectedNode =
    activeProject.nodes.find(n => n.id === selectedNodeId) || null;
  const selectedImage =
    activeProject.images?.find(img => img.id === selectedImageId) || null;
  const notesNode =
    activeProject.nodes.find(n => n.id === notesNodeId) || null;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-[#FAF7F2] text-stone-800 overflow-hidden font-sans">
      {/* Barra Superior Estudio EdrawMax */}
      <Navbar
        project={activeProject}
        projects={projects}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        isConnectMode={Boolean(connectSourceId)}
        onToggleLeft={handleToggleLeft}
        onToggleRight={handleToggleRight}
        onSelectProject={handleSelectProject}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={handleDeleteProject}
        onImportJsonFile={handleImportJsonFile}
        onUpdateTitle={handleUpdateTitle}
        onChangeType={handleChangeType}
        onToggleConnectMode={handleToggleConnectMode}
        onOpenAiModal={handleOpenAiModal}
        onOpenTemplates={handleOpenTemplates}
        onOpenExport={handleOpenExport}
        onOpenSettings={handleOpenSettings}
        onOpenPresentation={handleOpenPresentation}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onChangeCartographicDirection={handleChangeCartographicDirection}
        onAddImageFile={handleAddImageFile}
        onOpenCreateChooser={handleOpenCreateChooser}
      />

      {/* Área Central: Biblioteca Izquierda + Lienzo Infinito + Inspector Derecho */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Fondo oscuro táctil en pantallas pequeñas/medianas para cerrar paneles al tocar afuera */}
        {(leftOpen || rightOpen) && (
          <div
            onClick={() => {
              setLeftOpen(false);
              setRightOpen(false);
            }}
            className="lg:hidden fixed inset-0 top-14 bg-stone-900/25 z-30"
          />
        )}

        <LeftSidebar
          isOpen={leftOpen}
          project={activeProject}
          selectedNode={selectedNode}
          onSelectNode={handleSidebarSelectNode}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onExpandAi={handleExpandAi}
          onStartCrossLink={handleSidebarStartCrossLink}
          onUpdateNode={handleUpdateNode}
          onToggleCollapse={handleToggleCollapse}
          onAddImageFile={handleAddImageFile}
          onOpenTemplates={handleOpenTemplates}
          onClose={handleCloseLeft}
        />

        <Canvas
          project={activeProject}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          selectedImageId={selectedImageId}
          connectSourceId={connectSourceId}
          onSelectNode={handleCanvasSelectNode}
          onSelectEdge={handleCanvasSelectEdge}
          onSelectImage={handleCanvasSelectImage}
          onCancelConnect={handleCancelConnect}
          onStartCrossLink={handleStartCrossLinkFromNode}
          onCompleteCrossLink={handleCompleteCrossLink}
          onMoveNode={handleMoveNode}
          onMoveImage={handleMoveImage}
          onResizeImage={handleResizeImage}
          onDeleteImage={handleDeleteImage}
          onToggleLockImage={handleToggleLockImage}
          onAddImageFile={handleAddImageFile}
          onBeginDragHistory={handleBeginDragHistory}
          onCommitNodeText={handleCommitNodeText}
          onToggleCollapse={handleToggleCollapse}
          onCycleProgress={handleCycleProgress}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onExpandAi={handleExpandAi}
          onOpenNotes={handleOpenNotes}
          onEditEdgeLabel={handleEditEdgeLabel}
          onAutoAlign={handleAutoAlign}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        <RightInspector
          isOpen={rightOpen}
          project={activeProject}
          selectedNode={selectedNode}
          selectedImage={selectedImage}
          onUpdateNode={handleUpdateNode}
          onUpdateImage={handleUpdateImage}
          onDeleteImage={handleDeleteImage}
          onToggleLockImage={handleToggleLockImage}
          onChangeTheme={handleChangeTheme}
          onChangeConnectorStyle={handleChangeConnectorStyle}
          onChangeCanvasBg={handleChangeCanvasBg}
          onToggleRainbowBranches={handleToggleRainbowBranches}
          onExpandOrCollapseAll={handleExpandOrCollapseAll}
          onChangeCartographicDirection={handleChangeCartographicDirection}
          onClose={handleCloseRight}
        />

        {/* Notificación flotante cálida */}
        {toast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] text-center px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold shadow-lg pointer-events-none">
            {toast}
          </div>
        )}
      </div>

      {/* Modal inicial rápido (cargado en el núcleo principal) */}
      <CreateChooserModal
        isOpen={createChooserOpen}
        onClose={() => setCreateChooserOpen(false)}
        currentType={activeProject?.type || 'mindmap'}
        currentTitle={activeProject?.title || 'Idea Central'}
        onOpenTemplates={handleOpenTemplates}
        onConfirm={(title, type) => {
          const actualTitle = (title && title.trim()) || getDefaultTitleForType(type);
          if (activeProject && activeProject.nodes.length <= 1) {
            const root = activeProject.nodes[0];
            const themeToUse = activeProject.theme || 'vitality-warm';
            const generated = buildStarterProjectNodes(type, actualTitle, root?.id, root);
            const relaid = applyLayout(
              generated.nodes,
              generated.edges,
              type,
              themeToUse,
              true,
              activeProject.cartographicDirection || 'clockwise'
            );
            commitProjectPatch({
              title: actualTitle,
              type,
              nodes: relaid.nodes,
              edges: relaid.edges,
            });
            showToast(`Plantilla lista: «${actualTitle}»`);
          } else {
            handleCreateNewProject(type, actualTitle);
          }
        }}
      />

      {/* Modales secundarios divididos por code-splitting y montados solo al abrirse */}
      <Suspense fallback={null}>
        {aiModalOpen && (
          <AiModal
            isOpen={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            onGenerate={handleGenerateAi}
          />
        )}

        {templatesOpen && (
          <TemplatesModal
            isOpen={templatesOpen}
            onClose={() => setTemplatesOpen(false)}
            onSelectTemplate={handleSelectTemplate}
            onCreateBlank={handleOpenCreateChooser}
            onOpenAiGenerator={handleOpenAiModal}
          />
        )}

        {exportOpen && (
          <ExportModal
            isOpen={exportOpen}
            onClose={() => setExportOpen(false)}
            project={activeProject}
          />
        )}

        {Boolean(notesNodeId) && (
          <NodeNotesModal
            isOpen={Boolean(notesNodeId)}
            onClose={() => setNotesNodeId(null)}
            node={notesNode}
            onSave={handleUpdateNode}
          />
        )}

        {Boolean(editingEdge) && (
          <EdgeLabelModal
            isOpen={Boolean(editingEdge)}
            onClose={() => setEditingEdge(null)}
            edgeId={editingEdge?.id || null}
            currentLabel={editingEdge?.label || ''}
            onSave={handleSaveEdgeLabel}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {presentationOpen && (
          <PresentationView
            isOpen={presentationOpen}
            onClose={() => setPresentationOpen(false)}
            project={activeProject}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
