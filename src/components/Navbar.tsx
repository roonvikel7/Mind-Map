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
  Redo2,
  RotateCcw,
  RotateCw,
  Settings,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { OrganizerProject, OrganizerType } from '../types/organizer';
import { ORGANIZER_TYPES_META } from '../utils/themes';

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
  onUndo: () => void;
  onRedo: () => void;
  onChangeCartographicDirection?: (dir: 'clockwise' | 'counterclockwise') => void;
  onAddImageFile?: (file: File) => void;
  onOpenCreateChooser?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
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
  onUndo,
  onRedo,
  onChangeCartographicDirection,
  onAddImageFile,
  onOpenCreateChooser,
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

  // Cerrar cualquier menú desplegable inmediatamente al tocar/clicar afuera o presionar Escape
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
    <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-1.5 sm:px-3.5 flex items-center justify-between gap-1 sm:gap-2 z-50 select-none">
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

      {/* BLOQUE IZQUIERDO: Panel Izquierdo, Marca, Proyectos y Título */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 md:shrink md:min-w-0">
        <button
          type="button"
          onClick={onToggleLeft}
          title={leftOpen ? 'Ocultar panel de formas y esquema' : 'Abrir panel de formas, marcas y esquema'}
          className={`p-1.5 sm:p-2 rounded-xl border transition-colors shrink-0 ${
            leftOpen
              ? 'bg-orange-50 border-orange-200 text-orange-700'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Marca Synapse Studio (visible desde sm para armonía en móvil) */}
        <div className="hidden sm:flex items-center gap-2 pr-0.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            S
          </div>
          <div className="hidden 2xl:flex flex-col leading-none">
            <span className="text-[13px] font-extrabold tracking-tight text-stone-800">
              Synapse
            </span>
            <span className="text-[10px] font-semibold text-orange-600">
              Studio Pro
            </span>
          </div>
        </div>

        {/* Selector de Proyectos Guardados */}
        <div className="relative shrink-0">
          <button
            ref={projectsBtnRef}
            type="button"
            onClick={() => {
              const next = !projectsMenuOpen;
              closeAllMenus();
              setProjectsMenuOpen(next);
            }}
            title="Mis mapas, renombrar proyecto, crear nuevo o importar"
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-100/90 hover:bg-stone-200/70 border border-stone-200/80 text-xs font-semibold text-stone-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline max-w-[120px] truncate">
              Mis Mapas ({projects.length})
            </span>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-stone-400 shrink-0" />
          </button>

          {projectsMenuOpen && (
            <div
              ref={projectsMenuRef}
              className="fixed left-3 right-3 top-[60px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-80 rounded-2xl bg-white border border-stone-200 edraw-panel-shadow p-2.5 z-50 max-h-[78dvh] flex flex-col"
            >
              {/* Campo de título accesible dentro del menú en pantallas móviles */}
              <div className="md:hidden pb-2.5 mb-2 border-b border-stone-100">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Título del Mapa Actual
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={e => onUpdateTitle(e.target.value)}
                  placeholder="Título del proyecto..."
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-400 text-base font-bold text-stone-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-between px-1.5 py-1 border-b border-stone-100 mb-1.5 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Mis Proyectos ({projects.length})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setProjectsMenuOpen(false);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-stone-600 hover:bg-stone-100"
                    title="Abrir archivo .json de proyecto"
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold"
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
                          ? 'bg-orange-50 border border-orange-200/80 text-orange-900'
                          : 'hover:bg-stone-50 text-stone-700'
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
                          <div className="text-[10px] text-stone-400">
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

        {/* Título Editable en Vivo (visible en tablet y escritorio) */}
        <input
          type="text"
          value={project.title}
          onChange={e => onUpdateTitle(e.target.value)}
          placeholder="Título del proyecto..."
          className="hidden md:block w-36 lg:w-48 xl:w-56 px-2.5 py-1 rounded-lg bg-transparent hover:bg-stone-100 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 border border-transparent text-xs font-bold text-stone-800 outline-none transition-all truncate"
        />
      </div>

      {/* BLOQUE CENTRAL: Selector de los 9 Motores Estructurales + Deshacer/Rehacer */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <div className="relative">
          <button
            ref={typeBtnRef}
            type="button"
            onClick={() => {
              const next = !typeMenuOpen;
              closeAllMenus();
              setTypeMenuOpen(next);
            }}
            title="Cambiar tipo de organizador visual (9 motores)"
            className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-xl bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/90 text-xs font-bold text-amber-950 transition-colors"
          >
            <span className="text-sm leading-none">{currentTypeMeta.emoji}</span>
            <span className="hidden md:inline">{currentTypeMeta.shortLabel}</span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700 shrink-0" />
          </button>

          {typeMenuOpen && (
            <div
              ref={typeMenuRef}
              className="fixed left-3 right-3 top-[60px] sm:absolute sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-full sm:mt-2 sm:w-80 rounded-2xl bg-white border border-stone-200 edraw-panel-shadow p-2 z-50 max-h-[78dvh] flex flex-col"
            >
              <div className="px-2 py-1 flex items-center justify-between border-b border-stone-100 mb-1 shrink-0">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Transformar Estructura (9 Motores)
                </span>
              </div>

              {project.type === 'cartographic' && onChangeCartographicDirection && (
                <div className="mx-1 mb-1.5 p-2 rounded-xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-between gap-2 shrink-0">
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-[11px] font-bold text-orange-800 shadow-sm"
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

              <div className="overflow-y-auto grid grid-cols-1 gap-1 pr-0.5">
                {ORGANIZER_TYPES_META.map(item => {
                  const active = item.type === project.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        onChangeType(item.type);
                        setTypeMenuOpen(false);
                      }}
                      className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                        active
                          ? 'bg-orange-50 border border-orange-200 text-orange-950'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5 shrink-0">
                        {item.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10.5px] text-stone-500 leading-snug">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Conmutador Rápido Horario / Antihorario en escritorio cuando es Cartografía */}
        {project.type === 'cartographic' && onChangeCartographicDirection && (
          <button
            type="button"
            onClick={() =>
              onChangeCartographicDirection(
                project.cartographicDirection === 'counterclockwise'
                  ? 'clockwise'
                  : 'counterclockwise'
              )
            }
            title={
              project.cartographicDirection === 'counterclockwise'
                ? 'Giro Antihorario (clic para Horario)'
                : 'Giro Horario (clic para Antihorario)'
            }
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200/90 text-xs font-bold text-orange-900 transition-colors"
          >
            {project.cartographicDirection === 'counterclockwise' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                <span>Antihorario</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 text-orange-600" />
                <span>Horario</span>
              </>
            )}
          </button>
        )}

        {/* Deshacer / Rehacer */}
        <div className="flex items-center bg-stone-100/90 rounded-xl p-0.5 border border-stone-200/70">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-1 sm:p-1.5 rounded-lg text-stone-600 hover:bg-white active:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rehacer (Ctrl+Y)"
            className="p-1 sm:p-1.5 rounded-lg text-stone-600 hover:bg-white active:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BLOQUE DERECHO: IA, Descargar, Menú Organizado de Estudio y Panel de Diseño */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Acción Principal: Generar con IA */}
        <button
          type="button"
          onClick={onOpenAiModal}
          title="Generar organizador inteligente con Google Gemini IA"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Generar IA</span>
          <span className="hidden min-[360px]:inline sm:hidden">IA</span>
        </button>

        {/* Accesos limpios en escritorio amplio (sin saturar pantallas pequeñas/medianas) */}
        <button
          type="button"
          onClick={onOpenTemplates}
          title="Galería de plantillas con previsualización"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-stone-600" />
          <span>Plantillas</span>
        </button>

        <button
          type="button"
          onClick={onOpenPresentation}
          title="Modo presentación en diapositivas"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Presentar</span>
        </button>

        {/* Descargar / Exportar en 8K */}
        <button
          type="button"
          onClick={onOpenExport}
          title="Descargar en PNG 8K UHD, SVG, PDF, HTML, Markdown o JSON"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="hidden sm:inline">Descargar</span>
        </button>

        {/* Menú Organizado "Más Herramientas" (evita sobrepoblación manteniendo 100% de funciones) */}
        <div className="relative">
          <button
            ref={toolsBtnRef}
            type="button"
            onClick={() => {
              const next = !toolsMenuOpen;
              closeAllMenus();
              setToolsMenuOpen(next);
            }}
            title="Más herramientas del estudio (Plantillas, Imagen, Relación, Presentación, Ajustes IA)"
            className={`relative p-1.5 sm:p-2 rounded-xl border transition-colors ${
              toolsMenuOpen || isConnectMode
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            {isConnectMode && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-600 ring-2 ring-white" />
            )}
          </button>

          {toolsMenuOpen && (
            <div
              ref={toolsMenuRef}
              className="fixed left-3 right-3 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-2xl bg-white border border-stone-200 edraw-panel-shadow p-2 z-50 max-h-[80dvh] overflow-y-auto space-y-1.5"
            >
              {/* Sección 1: Crear y Explorar */}
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Crear y Explorar
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    if (onOpenCreateChooser) onOpenCreateChooser();
                    else onCreateNewProject('mindmap');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-50 text-left text-xs font-semibold text-stone-700 transition-colors"
                >
                  <FilePlus2 className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Nuevo Mapa Limpio</div>
                    <div className="text-[10.5px] text-stone-400">Escoger título y estructura</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenTemplates();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-50 text-left text-xs font-semibold text-stone-700 transition-colors"
                >
                  <LayoutTemplate className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Galería de Plantillas</div>
                    <div className="text-[10.5px] text-stone-400">Diseños listos con vista previa</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenPresentation();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-50/60 text-left text-xs font-semibold text-stone-700 transition-colors"
                >
                  <Play className="w-4 h-4 text-emerald-600 fill-current shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">Modo Presentación</div>
                    <div className="text-[10.5px] text-stone-400">Exponer rama por rama</div>
                  </div>
                </button>
              </div>

              <div className="border-t border-stone-100" />

              {/* Sección 2: Elementos del Lienzo */}
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Lienzo y Conexiones
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    imageInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-50 text-left text-xs font-semibold text-stone-700 transition-colors"
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
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                    isConnectMode
                      ? 'bg-orange-50 text-orange-900 border border-orange-200'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <GitCompareArrows className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-800">
                      {isConnectMode ? 'Cancelar Relación Cruzada' : 'Conectar Relación Cruzada'}
                    </div>
                    <div className="text-[10.5px] text-stone-400">
                      Unir dos nodos cualesquiera
                    </div>
                  </div>
                </button>
              </div>

              <div className="border-t border-stone-100" />

              {/* Sección 3: Ajustes IA */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-stone-50 text-left text-xs font-semibold text-stone-700 transition-colors"
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

        {/* Botón Panel Derecho: Temas y Formato */}
        <button
          type="button"
          onClick={onToggleRight}
          title={rightOpen ? 'Ocultar panel de diseño' : 'Abrir temas de color y formato'}
          className={`p-1.5 sm:p-2 rounded-xl border transition-colors shrink-0 ${
            rightOpen
              ? 'bg-orange-50 border-orange-200 text-orange-700'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
