import { useCallback, useEffect, useState } from 'react';
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
  buildCartographicProjectNodes,
  isCartographicStructure,
  TemplateCard,
} from './utils/templates';
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightInspector } from './components/RightInspector';
import { Canvas } from './components/Canvas';
import { AiModal } from './components/AiModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { NodeNotesModal } from './components/NodeNotesModal';
import { EdgeLabelModal } from './components/EdgeLabelModal';
import { SettingsModal } from './components/SettingsModal';
import { PresentationView } from './components/PresentationView';
import { CreateChooserModal } from './components/CreateChooserModal';

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

  const pushHistory = useCallback(
    (nodes: OrganizerNode[], edges: OrganizerEdge[]) => {
      setHistoryPast(past => [...past.slice(-30), { nodes, edges }]);
      setHistoryFuture([]);
    },
    []
  );

  const commitProjectPatch = useCallback(
    (patch: Partial<OrganizerProject>) => {
      if (!activeProject) return;
      setProjects(prev => {
        const updated = prev.map(p =>
          p.id === activeProject.id
            ? { ...p, ...patch, updatedAt: Date.now() }
            : p
        );
        saveProjects(updated);
        return updated;
      });
    },
    [activeProject]
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

      // Al seleccionar Cartografía Conceptual, generar automáticamente los 8 ejes con sus cuadros listos para escribir si aún no los tiene
      if (newType === 'cartographic' && !isCartographicStructure(targetNodes)) {
        const root =
          targetNodes.find(n => n.isRoot || (n.depth || 0) === 0) ||
          targetNodes[0];
        const title =
          root?.text || activeProject.title || 'Cartografía Conceptual';
        const generated = buildCartographicProjectNodes(title, root?.id, root);
        targetNodes = generated.nodes;
        targetEdges = generated.edges;
        showToast('Cartografía lista: 8 ejes con cuadros para escribir directamente.');
      } else if (newType === 'matrix' && targetNodes.length <= 1) {
        const root = targetNodes[0];
        const stamp = Date.now();
        const quadrants = [
          { text: 'Fortalezas Internas', icon: '💪' },
          { text: 'Oportunidades del Entorno', icon: '🚀' },
          { text: 'Debilidades Operativas', icon: '🛠️' },
          { text: 'Amenazas Externas', icon: '⚠️' },
        ];
        targetNodes = [
          { ...root, isRoot: true, icon: '⊞' },
          ...quadrants.map((q, idx) => ({
            id: `quad-${stamp}-${idx + 1}`,
            parentId: root.id,
            text: q.text,
            x: 0,
            y: 0,
            width: 180,
            height: 50,
            icon: q.icon,
          })),
        ];
        targetEdges = quadrants.map((_, idx) => ({
          id: `edge-${stamp}-q-${idx + 1}`,
          from: root.id,
          to: `quad-${stamp}-${idx + 1}`,
        }));
      } else if (newType === 'cycle' && targetNodes.length <= 1) {
        const root = targetNodes[0];
        const stamp = Date.now();
        const stages = [
          { text: '1. Planificación Inicial', icon: '📋' },
          { text: '2. Ejecución Controlada', icon: '⚡' },
          { text: '3. Evaluación de Resultados', icon: '📊' },
          { text: '4. Mejora Continua', icon: '🔄' },
        ];
        targetNodes = [
          { ...root, isRoot: true, icon: '🔄' },
          ...stages.map((st, idx) => ({
            id: `stage-${stamp}-${idx + 1}`,
            parentId: root.id,
            text: st.text,
            x: 0,
            y: 0,
            width: 175,
            height: 48,
            icon: st.icon,
          })),
        ];
        targetEdges = stages.map((_, idx) => ({
          id: `edge-${stamp}-s-${idx + 1}`,
          from: root.id,
          to: `stage-${stamp}-${idx + 1}`,
        }));
      }

      const relaid = applyLayout(
        targetNodes,
        targetEdges,
        newType,
        activeProject.theme,
        newType === 'cartographic',
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

  // Crear mapa con la estructura limpia o con los 8 ejes en Cartografía
  const handleCreateNewProject = (
    type: OrganizerType = 'mindmap',
    title: string = 'Idea Central'
  ) => {
    const stamp = Date.now();
    const rootId = `root-${stamp}`;
    const themeToUse: ThemeId = activeProject?.theme || 'vitality-warm';

    let initialNodes: OrganizerNode[];
    let initialEdges: OrganizerEdge[];

    if (type === 'cartographic') {
      const built = buildCartographicProjectNodes(title, rootId);
      initialNodes = built.nodes;
      initialEdges = built.edges;
    } else if (type === 'matrix') {
      const quadrants = [
        { text: 'Fortalezas Internas', icon: '💪' },
        { text: 'Oportunidades del Entorno', icon: '🚀' },
        { text: 'Debilidades Operativas', icon: '🛠️' },
        { text: 'Amenazas Externas', icon: '⚠️' },
      ];
      initialNodes = [
        {
          id: rootId,
          text: title,
          x: 0,
          y: 0,
          width: 190,
          height: 54,
          isRoot: true,
          icon: '⊞',
        },
        ...quadrants.map((q, idx) => ({
          id: `quad-${stamp}-${idx + 1}`,
          parentId: rootId,
          text: q.text,
          x: 0,
          y: 0,
          width: 180,
          height: 50,
          icon: q.icon,
        })),
      ];
      initialEdges = quadrants.map((_, idx) => ({
        id: `edge-${stamp}-q-${idx + 1}`,
        from: rootId,
        to: `quad-${stamp}-${idx + 1}`,
      }));
    } else if (type === 'cycle') {
      const stages = [
        { text: '1. Planificación Inicial', icon: '📋' },
        { text: '2. Ejecución Controlada', icon: '⚡' },
        { text: '3. Evaluación de Resultados', icon: '📊' },
        { text: '4. Mejora Continua', icon: '🔄' },
      ];
      initialNodes = [
        {
          id: rootId,
          text: title,
          x: 0,
          y: 0,
          width: 180,
          height: 54,
          isRoot: true,
          icon: '🔄',
        },
        ...stages.map((st, idx) => ({
          id: `stage-${stamp}-${idx + 1}`,
          parentId: rootId,
          text: st.text,
          x: 0,
          y: 0,
          width: 175,
          height: 48,
          icon: st.icon,
        })),
      ];
      initialEdges = stages.map((_, idx) => ({
        id: `edge-${stamp}-s-${idx + 1}`,
        from: rootId,
        to: `stage-${stamp}-${idx + 1}`,
      }));
    } else {
      initialNodes = [
        {
          id: rootId,
          text: title,
          subtitle: 'Toca para editar o añadir subtemas',
          x: 0,
          y: 0,
          width: 180,
          height: 56,
          isRoot: true,
          icon: '💡',
        },
      ];
      initialEdges = [];
    }

    const relaid = applyLayout(
      initialNodes,
      initialEdges,
      type,
      themeToUse,
      true,
      'clockwise'
    );

    const newProj: OrganizerProject = {
      id: `proj-${stamp}`,
      title,
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
  const handleSaveEdgeLabel = (edgeId: string, label: string) => {
    if (!activeProject) return;
    pushHistory(activeProject.nodes, activeProject.edges);
    const updatedEdges = activeProject.edges.map(e =>
      e.id === edgeId ? { ...e, label: label || undefined } : e
    );
    commitProjectPatch({ edges: updatedEdges });
  };

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
        onSelectProject={id => {
          setActiveProjectId(id);
          saveActiveProjectId(id);
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setSelectedImageId(null);
          setConnectSourceId(null);
          setHistoryPast([]);
          setHistoryFuture([]);
        }}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={handleDeleteProject}
        onImportJsonFile={handleImportJsonFile}
        onUpdateTitle={title => commitProjectPatch({ title })}
        onChangeType={handleChangeType}
        onToggleConnectMode={() => {
          if (connectSourceId) {
            setConnectSourceId(null);
          } else {
            const startId =
              selectedNodeId ||
              activeProject.nodes.find(n => n.isRoot)?.id ||
              activeProject.nodes[0]?.id;
            if (startId) {
              setConnectSourceId(startId);
            }
          }
        }}
        onOpenAiModal={() => setAiModalOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPresentation={() => setPresentationOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onChangeCartographicDirection={handleChangeCartographicDirection}
        onAddImageFile={handleAddImageFile}
        onOpenCreateChooser={() => setCreateChooserOpen(true)}
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
            className="lg:hidden fixed inset-0 top-14 bg-stone-900/25 backdrop-blur-[1px] z-30"
          />
        )}

        <LeftSidebar
          isOpen={leftOpen}
          project={activeProject}
          selectedNode={selectedNode}
          onSelectNode={id => {
            setSelectedEdgeId(null);
            setSelectedImageId(null);
            setSelectedNodeId(id);
          }}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onExpandAi={handleExpandAi}
          onStartCrossLink={() => {
            const fromId =
              selectedNodeId ||
              activeProject.nodes.find(n => n.isRoot)?.id ||
              activeProject.nodes[0]?.id;
            if (fromId) setConnectSourceId(fromId);
          }}
          onUpdateNode={handleUpdateNode}
          onToggleCollapse={handleToggleCollapse}
          onAddImageFile={handleAddImageFile}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onClose={() => setLeftOpen(false)}
        />

        <Canvas
          project={activeProject}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          selectedImageId={selectedImageId}
          connectSourceId={connectSourceId}
          onSelectNode={id => {
            setSelectedNodeId(id);
            if (id) setSelectedImageId(null);
          }}
          onSelectEdge={id => {
            setSelectedEdgeId(id);
            if (id) setSelectedImageId(null);
          }}
          onSelectImage={id => {
            setSelectedImageId(id);
            if (id) {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }
          }}
          onCancelConnect={() => setConnectSourceId(null)}
          onStartCrossLink={fromId => setConnectSourceId(fromId)}
          onCompleteCrossLink={handleCompleteCrossLink}
          onMoveNode={handleMoveNode}
          onMoveImage={handleMoveImage}
          onResizeImage={handleResizeImage}
          onDeleteImage={handleDeleteImage}
          onToggleLockImage={handleToggleLockImage}
          onAddImageFile={handleAddImageFile}
          onBeginDragHistory={handleBeginDragHistory}
          onCommitNodeText={(id, text) => handleUpdateNode(id, { text })}
          onToggleCollapse={handleToggleCollapse}
          onCycleProgress={handleCycleProgress}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onExpandAi={handleExpandAi}
          onOpenNotes={id => setNotesNodeId(id)}
          onEditEdgeLabel={(id, label) => setEditingEdge({ id, label })}
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
          onClose={() => setRightOpen(false)}
        />

        {/* Notificación flotante cálida */}
        {toast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] text-center px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold shadow-lg pointer-events-none">
            {toast}
          </div>
        )}
      </div>

      {/* Modales del Estudio */}
      <CreateChooserModal
        isOpen={createChooserOpen}
        onClose={() => setCreateChooserOpen(false)}
        currentType={activeProject?.type || 'mindmap'}
        currentTitle={activeProject?.title || 'Idea Central'}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onConfirm={(title, type) => {
          if (type === 'cartographic' || type === 'matrix' || type === 'cycle') {
            handleCreateNewProject(type, title);
            showToast(`Estructura lista: «${title}»`);
          } else if (activeProject && activeProject.nodes.length <= 1) {
            const baseNode: OrganizerNode = {
              ...(activeProject.nodes[0] || {
                id: `root-${Date.now()}`,
                x: 0,
                y: 0,
                width: 200,
                height: 60,
                isRoot: true,
                depth: 0,
              }),
              text: title,
              subtitle: 'Toca para editar o añadir subtemas',
              icon: '💡',
            };
            const relaid = applyLayout(
              [baseNode],
              [],
              type,
              activeProject.theme || 'vitality-warm',
              true,
              activeProject.cartographicDirection || 'clockwise'
            );
            commitProjectPatch({
              title,
              type,
              nodes: relaid.nodes,
              edges: [],
            });
            showToast(`Listo: «${title}»`);
          } else {
            handleCreateNewProject(type, title);
            showToast(`Creado: «${title}»`);
          }
        }}
      />

      <AiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={handleGenerateAi}
      />

      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateBlank={() => setCreateChooserOpen(true)}
        onOpenAiGenerator={() => setAiModalOpen(true)}
      />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        project={activeProject}
      />

      <NodeNotesModal
        isOpen={Boolean(notesNodeId)}
        onClose={() => setNotesNodeId(null)}
        node={notesNode}
        onSave={handleUpdateNode}
      />

      <EdgeLabelModal
        isOpen={Boolean(editingEdge)}
        onClose={() => setEditingEdge(null)}
        edgeId={editingEdge?.id || null}
        currentLabel={editingEdge?.label || ''}
        onSave={handleSaveEdgeLabel}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <PresentationView
        isOpen={presentationOpen}
        onClose={() => setPresentationOpen(false)}
        project={activeProject}
      />
    </div>
  );
}

export default App;
