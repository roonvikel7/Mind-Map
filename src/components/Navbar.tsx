import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FilePlus2,
  FolderOpen,
  GitCompareArrows,
  Image as ImageIcon,
  LayoutTemplate,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Play,
  Plus,
  Presentation,
  Redo2,
  RotateCcw,
  RotateCw,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { OrganizerProject, OrganizerType } from '../types/organizer';
import {
  ORGANIZER_CATEGORY_LABELS,
  ORGANIZER_TYPES_META,
  OrganizerCategory,
} from '../utils/themes';

interface NavbarProps {
  project: OrganizerProject;
  projects: OrganizerProject[];
  leftOpen: boolean;
  rightOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isConnectMode: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onSelectProject: (id: string) => void;
  onCreateNewProject: (type?: OrganizerType) => void;
  onDeleteProject: (id: string) => void;
  onImportJsonFile: (file: File) => void;
  onUpdateTitle: (title: string) => void;
  onChangeType: (type: OrganizerType) => void;
  onToggleConnectMode: () => void;
  onOpenAiModal: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenPresentation: () => void;
  onOpenCanva?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onChangeCartographicDirection?: (dir: 'clockwise' | 'counterclockwise') => void;
  onAddImageFile?: (file: File) => void;
  onOpenCreateChooser?: () => void;
  onOpenShare?: () => void;
  isSharedRoomActive?: boolean;
  activeCollaboratorsCount?: number;
}

const CATEGORY_ORDER: OrganizerCategory[] = [
  'mental',
  'academic',
  'process',
  'strategy',
];

const NavbarComponent: React.FC<NavbarProps> = ({
  project,
  projects,
  leftOpen,
  rightOpen,
  canUndo,
  canRedo,
  isConnectMode,
  onToggleLeft,
  onToggleRight,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onImportJsonFile,
  onUpdateTitle,
  onChangeType,
  onToggleConnectMode,
  onOpenAiModal,
  onOpenTemplates,
  onOpenExport,
  onOpenSettings,
  onOpenPresentation,
  onOpenCanva,
  onUndo,
  onRedo,
  onChangeCartographicDirection,
  onAddImageFile,
  onOpenCreateChooser,
  onOpenShare,
  isSharedRoomActive = false,
  activeCollaboratorsCount = 1,
}) => {
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const projectsMenuRef = useRef<HTMLDivElement | null>(null);
  const projectsBtnRef = useRef<HTMLButtonElement | null>(null);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const typeBtnRef = useRef<HTMLButtonElement | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const toolsBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!typeMenuOpen && !projectsMenuOpen && !toolsMenuOpen) return;

    const handleGlobalPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node;
      if (
        typeMenuOpen &&
        typeMenuRef.current &&
        !typeMenuRef.current.contains(target) &&
        typeBtnRef.current &&
        !typeBtnRef.current.contains(target)
      ) {
        setTypeMenuOpen(false);
      }
      if (
        projectsMenuOpen &&
        projectsMenuRef.current &&
        !projectsMenuRef.current.contains(target) &&
        projectsBtnRef.current &&
        !projectsBtnRef.current.contains(target)
      ) {
        setProjectsMenuOpen(false);
      }
      if (
        toolsMenuOpen &&
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(target) &&
        toolsBtnRef.current &&
        !toolsBtnRef.current.contains(target)
      ) {
        setToolsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTypeMenuOpen(false);
        setProjectsMenuOpen(false);
        setToolsMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [typeMenuOpen, projectsMenuOpen, toolsMenuOpen]);

  const currentTypeMeta =
    ORGANIZER_TYPES_META.find(m => m.type === project.type) || ORGANIZER_TYPES_META[0];

  const closeAllMenus = () => {
    setProjectsMenuOpen(false);
    setTypeMenuOpen(false);
    setToolsMenuOpen(false);
  };

  return (
    <header className="ios-glass-bar h-14 shrink-0 border-b border-stone-200/80 px-1.5 sm:px-3 flex items-center justify-between gap-1 sm:gap-2 z-50 select-none">
      {/* Inputs ocultos de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onImportJsonFile(f);
          e.currentTarget.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && onAddImageFile) {
            onAddImageFile(file);
          }
          if (e.target) e.target.value = '';
        }}
      />

      {/* ZONA IZQUIERDA: Panel Izquierdo, Archivo/Proyectos y Título con protección anticolisión */}
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink">
        <button
          type="button"
          onClick={onToggleLeft}
          title={leftOpen ? 'Ocultar biblioteca izquierda' : 'Abrir formas, símbolos y esquema'}
          className={`ios-btn p-1.5 sm:p-2 rounded-xl border shrink-0 ${
            leftOpen
              ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-xs'
              : 'bg-white/90 border-stone-200/90 text-stone-600 hover:bg-stone-100/80'
          }`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Marca compacta */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
            S
          </div>
        </div>

        {/* Desplegable Archivo / Mis Mapas */}
        <div className="relative shrink-0">
          <button
            ref={projectsBtnRef}
            type="button"
            onClick={() => {
              const next = !projectsMenuOpen;
              closeAllMenus();
              setProjectsMenuOpen(next);
            }}
            title="Mis mapas guardados, renombrar título, crear nuevo o importar JSON"
            className={`ios-btn flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              projectsMenuOpen
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'bg-stone-100/90 hover:bg-stone-200/75 border-stone-200/80 text-stone-700'
            }`}
          >
            <FolderOpen
              className={`w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 ${
                projectsMenuOpen ? 'text-amber-300' : 'text-amber-600'
              }`}
            />
            <span className="hidden md:inline max-w-[105px] truncate">
              Mapas ({projects.length})
            </span>
            <ChevronDown
              className={`hidden sm:block w-3 h-3 shrink-0 transition-transform duration-200 ${
                projectsMenuOpen ? 'rotate-180 text-stone-300' : 'text-stone-400'
              }`}
            />
          </button>

          {projectsMenuOpen && (
            <div
              ref={projectsMenuRef}
              className="ios-popover fixed left-2.5 right-2.5 top-[60px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-80 rounded-[22px] bg-white/95 backdrop-blur-xl border border-stone-200/90 edraw-panel-shadow p-3 z-50 max-h-[80dvh] flex flex-col"
            >
              {/* Edición rápida del título accesible en cualquier pantalla */}
              <div className="pb-2.5 mb-2.5 border-b border-stone-200/70 shrink-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Título del Proyecto Activo
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={e => onUpdateTitle(e.target.value)}
                  placeholder="Título del organizador..."
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-400 text-base sm:text-xs font-bold text-stone-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-between px-1 pb-2 border-b border-stone-100 mb-1.5 shrink-0">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Mis Proyectos ({projects.length})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setProjectsMenuOpen(false);
                    }}
                    className="ios-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-stone-600 hover:bg-stone-100"
                    title="Abrir respaldo .json"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Importar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectsMenuOpen(false);
                      if (onOpenCreateChooser) {
                        onOpenCreateChooser();
                      } else {
                        onCreateNewProject('mindmap');
                      }
                    }}
                    className="ios-btn flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto space-y-1 pr-0.5 flex-1">
                {projects.map(p => {
                  const meta = ORGANIZER_TYPES_META.find(m => m.type === p.type);
                  const active = p.id === project.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        setProjectsMenuOpen(false);
                      }}
                      className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                        active
                          ? 'bg-orange-50 border border-orange-200/80 text-orange-950'
                          : 'hover:bg-stone-100/70 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                          {meta?.emoji || '📌'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {p.title}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            {meta?.shortLabel} • {p.nodes.length} nodos
                          </div>
                        </div>
                      </div>

                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteProject(p.id);
                          }}
                          title="Eliminar proyecto"
                          className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Título editable en línea solo en pantallas amplias, con min-w-0 y shrink para 0% desborde */}
        <div className="hidden xl:flex min-w-0 shrink overflow-hidden">
          <input
            type="text"
            value={project.title}
            onChange={e => onUpdateTitle(e.target.value)}
            placeholder="Título del mapa..."
            className="min-w-0 w-36 2xl:w-52 px-2.5 py-1 rounded-xl bg-stone-100/60 hover:bg-stone-100 focus:bg-white focus:ring-2 focus:ring-orange-400/35 focus:border-orange-300 border border-transparent text-xs font-bold text-stone-800 outline-none transition-all truncate"
          />
        </div>
      </div>

      {/* ZONA CENTRAL: Botones Primordiales Visibles (Estructura 12 Motores + Plantillas + IA) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* 1. Desplegable de Estructura (12 Motores categorizados EdrawMax) */}
        <div className="relative shrink-0">
          <button
            ref={typeBtnRef}
            type="button"
            onClick={() => {
              const next = !typeMenuOpen;
              closeAllMenus();
              setTypeMenuOpen(next);
            }}
            title="Cambiar estructura del organizador (12 motores EdrawMax)"
            className={`ios-btn flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              typeMenuOpen
                ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-amber-50/95 hover:bg-amber-100/80 border-amber-200/90 text-amber-950'
            }`}
          >
            <span className="text-sm leading-none shrink-0">{currentTypeMeta.emoji}</span>
            <span className="hidden md:inline max-w-[132px] lg:max-w-[164px] truncate">
              {currentTypeMeta.shortLabel}
            </span>
            <ChevronDown
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700 shrink-0 transition-transform duration-200 ${
                typeMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {typeMenuOpen && (
            <div
              ref={typeMenuRef}
              className="ios-popover fixed left-2.5 right-2.5 top-[60px] sm:absolute sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-full sm:mt-2 sm:w-[360px] rounded-[22px] bg-white/95 backdrop-blur-xl border border-stone-200/90 edraw-panel-shadow p-2.5 z-50 max-h-[80dvh] flex flex-col"
            >
              <div className="px-2 py-1 flex items-center justify-between border-b border-stone-100 mb-1.5 shrink-0">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  12 Motores Estructurales EdrawMax
                </span>
              </div>

              {project.type === 'cartographic' && onChangeCartographicDirection && (
                <div className="mx-1 mb-2 p-2 rounded-xl bg-orange-50/90 border border-orange-200/80 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-orange-950">
                    Sentido de los 8 Ejes:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeCartographicDirection(
                        project.cartographicDirection === 'counterclockwise'
                          ? 'clockwise'
                          : 'counterclockwise'
                      )
                    }
                    className="ios-btn flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-[11px] font-bold text-orange-800 shadow-xs"
                  >
                    {project.cartographicDirection === 'counterclockwise' ? (
                      <>
                        <RotateCcw className="w-3 h-3 text-orange-600" />
                        <span>Antihorario</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3 h-3 text-orange-600" />
                        <span>Horario</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="overflow-y-auto space-y-2.5 pr-0.5 flex-1">
                {CATEGORY_ORDER.map(cat => {
                  const items = ORGANIZER_TYPES_META.filter(m => m.category === cat);
                  return (
                    <div key={cat}>
                      <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                        {ORGANIZER_CATEGORY_LABELS[cat]}
                      </div>
                      <div className="space-y-0.5">
                        {items.map(item => {
                          const active = item.type === project.type;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => {
                                onChangeType(item.type);
                                setTypeMenuOpen(false);
                              }}
                              className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                                active
                                  ? 'bg-orange-50 border border-orange-200/90 text-orange-950'
                                  : 'hover:bg-stone-100/70 text-stone-700'
                              }`}
                            >
                              <span className="text-base leading-none mt-0.5 shrink-0">
                                {item.emoji}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold leading-tight">
                                  {item.label}
                                </div>
                                <div className="text-[10.5px] text-stone-500 leading-snug line-clamp-1 mt-0.5">
                                  {item.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Botón PLANTILLAS Siempre Visible en todas las pantallas */}
        <button
          type="button"
          onClick={() => {
            closeAllMenus();
            onOpenTemplates();
          }}
          title="Abrir Centro de Plantillas Profesionales EdrawMax"
          className="ios-btn flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50/60 border border-stone-200/90 hover:border-orange-300 text-xs font-bold text-stone-800 shadow-2xs shrink-0"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="text-[11px] sm:text-xs">Plantillas</span>
        </button>

        {/* 3. Botón GENERAR CON IA Siempre Visible */}
        <button
          type="button"
          onClick={() => {
            closeAllMenus();
            onOpenAiModal();
          }}
          title="Generar organizador inteligente con IA"
          className="ios-btn flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-sm shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Generar IA</span>
          <span className="sm:hidden text-[11px]">IA</span>
        </button>
      </div>

      {/* ZONA DERECHA: Historial, Desplegable de Herramientas, Exportar y Panel Derecho */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Deshacer / Rehacer en pantallas >= sm (en móvil va dentro del desplegable Herramientas) */}
        <div className="hidden sm:flex items-center bg-stone-100/90 rounded-xl p-0.5 border border-stone-200/70">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Deshacer (Ctrl+Z)"
            className="ios-btn p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rehacer (Ctrl+Y)"
            className="ios-btn p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desplegable organizado "Herramientas" con animación suave iOS */}
        <div className="relative shrink-0">
          <button
            ref={toolsBtnRef}
            type="button"
            onClick={() => {
              const next = !toolsMenuOpen;
              closeAllMenus();
              setToolsMenuOpen(next);
            }}
            title="Herramientas adicionales (Presentar, Imagen, Relación Cruzada, Giro, Ajustes IA)"
            className={`ios-btn relative flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              toolsMenuOpen || isConnectMode
                ? 'bg-orange-50 border-orange-300 text-orange-800'
                : 'bg-white/90 border-stone-200/90 text-stone-700 hover:bg-stone-100/80'
            }`}
          >
            <MoreHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden 2xl:inline">Herramientas</span>
            {isConnectMode && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-600 ring-2 ring-white" />
            )}
          </button>

          {toolsMenuOpen && (
            <div
              ref={toolsMenuRef}
              className="ios-popover fixed left-2.5 right-2.5 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-[22px] bg-white/95 backdrop-blur-xl border border-stone-200/90 edraw-panel-shadow p-2.5 z-50 max-h-[82dvh] overflow-y-auto space-y-1.5"
            >
              {/* Fila rápida de Deshacer / Rehacer para celulares */}
              <div className="sm:hidden grid grid-cols-2 gap-1.5 pb-2 border-b border-stone-100">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={() => {
                    onUndo();
                    setToolsMenuOpen(false);
                  }}
                  className="ios-btn flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-100 text-xs font-bold text-stone-700 disabled:opacity-40"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={() => {
                    onRedo();
                    setToolsMenuOpen(false);
                  }}
                  className="ios-btn flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-100 text-xs font-bold text-stone-700 disabled:opacity-40"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Rehacer</span>
                </button>
              </div>

              {/* Sección 1: Creación y Exposición */}
              <div>
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  Estudio y Exposición
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    if (onOpenCreateChooser) onOpenCreateChooser();
                    else onCreateNewProject('mindmap');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-100/75 text-left text-xs transition-colors"
                >
                  <FilePlus2 className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Dibujo en Blanco</div>
                    <div className="text-[10.5px] text-stone-400">Elegir título y estructura</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenPresentation();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-50/70 text-left text-xs transition-colors"
                >
                  <Play className="w-4 h-4 text-emerald-600 fill-current shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Modo Presentación</div>
                    <div className="text-[10.5px] text-stone-400">Exponer diapositivas en vivo</div>
                  </div>
                </button>

                {onOpenCanva && (
                  <button
                    type="button"
                    onClick={() => {
                      setToolsMenuOpen(false);
                      onOpenCanva();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-cyan-50/80 text-left text-xs transition-colors"
                  >
                    <Presentation className="w-4 h-4 text-cyan-600 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-800 flex items-center gap-1.5">
                        <span>Abrir en Canva</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800">
                          Editable
                        </span>
                      </div>
                      <div className="text-[10.5px] text-stone-400">
                        Exportar presentación .PPTX editable
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <div className="border-t border-stone-100" />

              {/* Sección 2: Elementos del Lienzo */}
              <div>
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  Lienzo y Conexiones
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    imageInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-100/75 text-left text-xs transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Insertar Imagen Libre</div>
                    <div className="text-[10.5px] text-stone-400">Subir PNG, JPG, WebP o SVG</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onToggleConnectMode();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                    isConnectMode
                      ? 'bg-orange-50 text-orange-900 border border-orange-200'
                      : 'hover:bg-stone-100/75 text-stone-700'
                  }`}
                >
                  <GitCompareArrows className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">
                      {isConnectMode ? 'Cancelar Relación Cruzada' : 'Conectar Relación Cruzada'}
                    </div>
                    <div className="text-[10.5px] text-stone-400">
                      Unir dos cuadros cualesquiera
                    </div>
                  </div>
                </button>

                {project.type === 'cartographic' && onChangeCartographicDirection && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeCartographicDirection(
                        project.cartographicDirection === 'counterclockwise'
                          ? 'clockwise'
                          : 'counterclockwise'
                      );
                      setToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-orange-50/60 text-left text-xs transition-colors"
                  >
                    {project.cartographicDirection === 'counterclockwise' ? (
                      <RotateCcw className="w-4 h-4 text-orange-600 shrink-0" />
                    ) : (
                      <RotateCw className="w-4 h-4 text-orange-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-stone-800">
                        Giro 8 Ejes ({project.cartographicDirection === 'counterclockwise' ? 'Antihorario' : 'Horario'})
                      </div>
                      <div className="text-[10.5px] text-stone-400">
                        Toca para invertir el orden de giro
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <div className="border-t border-stone-100" />

              {/* Sección 3: Motor IA */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-100/75 text-left text-xs transition-colors"
                >
                  <Settings className="w-4 h-4 text-stone-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Configuración Motor IA</div>
                    <div className="text-[10.5px] text-stone-400">Clave API de Google Gemini</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botón Primordial: Compartir y Colaborar Multidispositivo */}
        {onOpenShare && (
          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              onOpenShare();
            }}
            title="Compartir enlace único para editar en varios dispositivos en tiempo real"
            className={`ios-btn flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs shrink-0 transition-all ${
              isSharedRoomActive
                ? 'bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 ring-2 ring-emerald-400/20'
                : 'bg-white hover:bg-orange-50 border border-stone-200/90 hover:border-orange-300 text-stone-800'
            }`}
          >
            <Share2
              className={`w-3.5 h-3.5 shrink-0 ${
                isSharedRoomActive ? 'text-emerald-600 animate-pulse' : 'text-orange-600'
              }`}
            />
            <span className="hidden sm:inline">Compartir</span>
            {isSharedRoomActive && (
              <span className="flex items-center gap-1 text-[10.5px] font-extrabold text-emerald-700 bg-emerald-200/60 px-1.5 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{activeCollaboratorsCount > 1 ? `${activeCollaboratorsCount}` : 'En vivo'}</span>
              </span>
            )}
          </button>
        )}

        {/* Botón Primordial: Exportar 8K */}
        <button
          type="button"
          onClick={() => {
            closeAllMenus();
            onOpenExport();
          }}
          title="Exportar en PNG 8K UHD, SVG, PDF, HTML o JSON"
          className="ios-btn flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="hidden md:inline">Exportar</span>
        </button>

        {/* Botón Panel Derecho */}
        <button
          type="button"
          onClick={onToggleRight}
          title={rightOpen ? 'Ocultar inspector de diseño' : 'Abrir temas, conectores y formato'}
          className={`ios-btn p-1.5 sm:p-2 rounded-xl border shrink-0 ${
            rightOpen
              ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-xs'
              : 'bg-white/90 border-stone-200/90 text-stone-600 hover:bg-stone-100/80'
          }`}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export const Navbar = React.memo(NavbarComponent);
