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
import { TemplateCard } from './utils/templates';
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

export function App() {
  const [projects, setProjects] = useState<OrganizerProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Historial Deshacer / Rehacer
  const [historyPast, setHistoryPast] = useState<
    { nodes: OrganizerNode[]; edges: OrganizerEdge[] }[]
  >([]);
  const [historyFuture, setHistoryFuture] = useState<
    { nodes: OrganizerNode[]; edges: OrganizerEdge[] }[]
  >([]);

  // Modales
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
    // En pantallas pequeñas iniciar con paneles colapsados para dar máximo espacio al lienzo
    if (window.innerWidth < 1100) {
      setLeftOpen(false);
      setRightOpen(false);
    }
    loadInitialProjects().then(({ projects: loaded, activeId }) => {
      setProjects(loaded);
      setActiveProjectId(activeId);
    });
  }, []);

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

  // Añadir hijo con auto-layout determinista inmediato
  const handleAddChild = useCallback(
    (parentNodeId: string) => {
      if (!activeProject) return;
      pushHistory(activeProject.nodes, activeProject.edges);

      const parent = activeProject.nodes.find(n => n.id === parentNodeId);
      if (!parent) return;

      const theme = getThemeConfig(activeProject.theme);
      const siblingCount = activeProject.nodes.filter(
        n => n.parentId === parentNodeId
      ).length;
      const newId = `node-${Date.now()}`;
      const branchColor = parent.isRoot
        ? theme.palette[siblingCount % theme.palette.length]
        : parent.color || theme.palette[0];

      const newNode: OrganizerNode = {
        id: newId,
        text: 'Nuevo Subtema',
        parentId: parentNodeId,
        x: parent.x + 160,
        y: parent.y,
        width: 136,
        height: 42,
        color: branchColor,
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
          activeProject.title
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
      const relaid = applyLayout(
        activeProject.nodes,
        activeProject.edges,
        newType,
        activeProject.theme,
        false,
        activeProject.cartographicDirection || 'clockwise'
      );
      commitProjectPatch({
        type: newType,
        nodes: relaid.nodes,
        edges: relaid.edges,
      });
    },
    [activeProject, commitProjectPatch, pushHistory]
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

  // Crear mapa en blanco limpio pero con 3 ramas iniciales listas para editar
  const handleCreateNewProject = (type: OrganizerType = 'mindmap') => {
    const stamp = Date.now();
    const rootId = `root-${stamp}`;
    const seedNodes: OrganizerNode[] = [
      {
        id: rootId,
        text: 'Idea Central',
        x: 0,
        y: 0,
        width: 150,
        height: 52,
        isRoot: true,
        icon: '💡',
      },
      {
        id: `n1-${stamp}`,
        text: 'Rama Principal 1',
        parentId: rootId,
        x: 0,
        y: 0,
        width: 140,
        height: 44,
        icon: '🚀',
      },
      {
        id: `n2-${stamp}`,
        text: 'Rama Principal 2',
        parentId: rootId,
        x: 0,
        y: 0,
        width: 140,
        height: 44,
        icon: '🎯',
      },
      {
        id: `n3-${stamp}`,
        text: 'Rama Principal 3',
        parentId: rootId,
        x: 0,
        y: 0,
        width: 140,
        height: 44,
        icon: '✨',
      },
    ];
    const seedEdges: OrganizerEdge[] = [
      { id: `e1-${stamp}`, from: rootId, to: `n1-${stamp}` },
      { id: `e2-${stamp}`, from: rootId, to: `n2-${stamp}` },
      { id: `e3-${stamp}`, from: rootId, to: `n3-${stamp}` },
    ];

    const relaid = applyLayout(
      seedNodes,
      seedEdges,
      type,
      'vitality-warm',
      true
    );

    const newProj: OrganizerProject = {
      id: `proj-${stamp}`,
      title: 'Nuevo Organizador Visual',
      type,
      theme: 'vitality-warm',
      canvasBg: 'dots',
      rainbowBranches: true,
      nodes: relaid.nodes,
      edges: relaid.edges,
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-stone-700 gap-3">
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
    <div className="h-screen w-screen flex flex-col bg-[#FAF7F2] text-stone-800 overflow-hidden font-sans">
      {/* Barra Superior Estudio EdrawMax */}
      <Navbar
        project={activeProject}
        projects={projects}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        isConnectMode={Boolean(connectSourceId)}
        onToggleLeft={() => setLeftOpen(v => !v)}
        onToggleRight={() => setRightOpen(v => !v)}
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
      />

      {/* Área Central de 3 Columnas: Biblioteca Izquierda + Lienzo Infinito + Inspector Derecho */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
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
          onExpandOrCollapseAll={handleExpandOrCollapseAll}
          onChangeCartographicDirection={handleChangeCartographicDirection}
        />

        {/* Notificación flotante cálida */}
        {toast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold shadow-lg pointer-events-none">
            {toast}
          </div>
        )}
      </div>

      {/* Modales del Estudio */}
      <AiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={handleGenerateAi}
      />

      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
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
