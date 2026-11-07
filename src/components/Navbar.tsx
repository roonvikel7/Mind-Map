import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FolderOpen,
  GitCompareArrows,
  Image as ImageIcon,
  LayoutTemplate,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const projectsMenuRef = useRef<HTMLDivElement | null>(null);
  const projectsBtnRef = useRef<HTMLButtonElement | null>(null);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const typeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Cerrar menús desplegables inmediatamente cuando el usuario hace clic afuera o pulsa Escape
  useEffect(() => {
    if (!typeMenuOpen && !projectsMenuOpen) return;

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
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTypeMenuOpen(false);
        setProjectsMenuOpen(false);
      }
    };

    // Usar capture = true para interceptar antes de que otros contenedores llamen a stopPropagation
    window.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [typeMenuOpen, projectsMenuOpen]);

  const currentTypeMeta =
    ORGANIZER_TYPES_META.find(m => m.type === project.type) || ORGANIZER_TYPES_META[0];

  return (
    <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-3 flex items-center justify-between gap-2 z-40 select-none">
      {/* Izquierda: Panel izquierdo, Marca, Selector de Proyectos y Título */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleLeft}
          title={leftOpen ? 'Ocultar panel izquierdo' : 'Mostrar panel de símbolos y esquema'}
          className={`p-2 rounded-xl border transition-colors ${
            leftOpen
              ? 'bg-orange-50 border-orange-200 text-orange-700'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Marca Synapse Studio */}
        <div className="flex items-center gap-2 pr-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            S
          </div>
          <div className="hidden xl:flex flex-col leading-none">
            <span className="text-[13.5px] font-extrabold tracking-tight text-stone-800">
              Synapse
            </span>
            <span className="text-[10px] font-semibold text-orange-600">
              Studio Pro
            </span>
          </div>
        </div>

        {/* Menú de Proyectos */}
        <div className="relative">
          <button
            ref={projectsBtnRef}
            type="button"
            onClick={() => {
              setProjectsMenuOpen(v => !v);
              setTypeMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100/90 hover:bg-stone-200/70 border border-stone-200/80 text-xs font-semibold text-stone-700 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="max-w-[130px] truncate hidden sm:inline">
              Mis Mapas ({projects.length})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {projectsMenuOpen && (
            <div
              ref={projectsMenuRef}
              className="absolute left-0 mt-2 w-80 rounded-2xl bg-white border border-stone-200 edraw-panel-shadow p-2 z-50 animate-in fade-in duration-100"
            >
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-stone-100 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Proyectos Guardados
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
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>

                <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
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
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all"
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

        {/* Título Editable en Vivo */}
        <input
          type="text"
          value={project.title}
          onChange={e => onUpdateTitle(e.target.value)}
          placeholder="Título del proyecto..."
          className="w-36 md:w-52 px-2.5 py-1 rounded-lg bg-transparent hover:bg-stone-100 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 border border-transparent text-xs font-bold text-stone-800 outline-none transition-all truncate"
        />
      </div>

      {/* Centro: Selector Estructural de 8 Diagramas + Historial + Relación Cruzada */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            ref={typeBtnRef}
            type="button"
            onClick={() => {
              setTypeMenuOpen(v => !v);
              setProjectsMenuOpen(false);
            }}
            title="Cambiar estructura geométrica del organizador"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/90 text-xs font-bold text-amber-950 transition-colors"
          >
            <span>{currentTypeMeta.emoji}</span>
            <span className="hidden lg:inline">{currentTypeMeta.shortLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
          </button>

          {typeMenuOpen && (
            <div
              ref={typeMenuRef}
              className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 rounded-2xl bg-white border border-stone-200 edraw-panel-shadow p-2 z-50 animate-in fade-in duration-100"
            >
              <div className="px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                Transformar Estructura (9 Motores)
              </div>
              <div className="grid grid-cols-1 gap-1 mt-1">
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
                      <span className="text-lg leading-none mt-0.5">
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

        {/* Conmutador Rápido Horario / Antihorario para Cartografía Conceptual */}
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
                ? 'Giro de los 8 Ejes: Antihorario (haz clic para cambiar a Horario)'
                : 'Giro de los 8 Ejes: Horario (haz clic para cambiar a Antihorario)'
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200/90 text-xs font-bold text-orange-900 transition-colors shadow-sm"
          >
            {project.cartographicDirection === 'counterclockwise' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">Antihorario</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">Horario</span>
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
            className="p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rehacer (Ctrl+Y)"
            className="p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conector de Relación Cruzada */}
        <button
          type="button"
          onClick={onToggleConnectMode}
          title="Conectar dos nodos cualesquiera mediante una flecha de relación cruzada"
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
            isConnectMode
              ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <GitCompareArrows className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Relación</span>
        </button>

        {/* Insertar Imagen libre en el lienzo */}
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
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          title="Insertar imagen libremente en el mapa (PNG, JPG, SVG, WebP) o arrastra y suelta en el lienzo"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors shadow-sm"
        >
          <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden lg:inline">Imagen</span>
        </button>
      </div>

      {/* Derecha: IA, Plantillas, Presentación, Descargar/Exportar, Ajustes e Inspector */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Generar IA</span>
        </button>

        <button
          type="button"
          onClick={onOpenTemplates}
          title="Galería de plantillas listas"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-stone-600" />
          <span className="hidden xl:inline">Plantillas</span>
        </button>

        <button
          type="button"
          onClick={onOpenPresentation}
          title="Modo presentación paso a paso"
          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          title="Descargar en PNG HD, SVG, PDF, HTML, Markdown o JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Descargar</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Configuración de API de IA"
          className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleRight}
          title={rightOpen ? 'Ocultar inspector de formato' : 'Mostrar inspector de formato y temas'}
          className={`p-2 rounded-xl border transition-colors ${
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
