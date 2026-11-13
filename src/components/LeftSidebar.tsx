import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  ChevronDown,
  ChevronRight,
  GitBranchPlus,
  GitCompareArrows,
  Image as ImageIcon,
  LayoutTemplate,
  ListTree,
  Plus,
  Search,
  Shapes,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { NodeShape, OrganizerNode, OrganizerProject } from '../types/organizer';
import { ICON_CATEGORIES, PRIORITY_BADGES } from '../utils/themes';

interface LeftSidebarProps {
  isOpen: boolean;
  project: OrganizerProject;
  selectedNode: OrganizerNode | null;
  onSelectNode: (id: string) => void;
  onAddChild: (parentId: string, preset?: Partial<OrganizerNode>) => void;
  onAddSibling: (nodeId: string) => void;
  onExpandAi: (node: OrganizerNode) => void;
  onStartCrossLink: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<OrganizerNode>) => void;
  onClearAllIcons?: () => void;
  onToggleCollapse: (nodeId: string) => void;
  onAddImageFile?: (file: File) => void;
  onOpenTemplates?: () => void;
  onClose?: () => void;
}

const SHAPE_OPTIONS: { shape: NodeShape; label: string; preview: string }[] = [
  { shape: 'rounded', label: 'Redondeada', preview: '▢' },
  { shape: 'pill', label: 'Cápsula', preview: '⬭' },
  { shape: 'rectangle', label: 'Rectángulo', preview: '▭' },
  { shape: 'underline', label: 'Subrayada', preview: '▁' },
  { shape: 'diamond', label: 'Decisión', preview: '◇' },
  { shape: 'parallelogram', label: 'Datos E/S', preview: '▱' },
  { shape: 'hexagon', label: 'Hexágono', preview: '⬡' },
  { shape: 'cloud', label: 'Nube', preview: '☁' },
  { shape: 'circle', label: 'Circular', preview: '◯' },
];

const PROGRESS_STEPS: (0 | 25 | 50 | 75 | 100)[] = [0, 25, 50, 75, 100];

const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({
  isOpen,
  project,
  selectedNode,
  onSelectNode,
  onAddChild,
  onAddSibling,
  onExpandAi,
  onStartCrossLink,
  onUpdateNode,
  onClearAllIcons,
  onToggleCollapse,
  onAddImageFile,
  onOpenTemplates,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'insert' | 'marks' | 'outline'>('insert');
  const [shapesExpanded, setShapesExpanded] = useState(true);
  const [flowBlocksExpanded, setFlowBlocksExpanded] = useState(false);
  const [openIconCat, setOpenIconCat] = useState<string>(ICON_CATEGORIES[0]?.id || 'study');
  const [outlineQuery, setOutlineQuery] = useState('');

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const rootNode = useMemo(
    () =>
      project.nodes.find(n => n.isRoot) ||
      project.nodes.find(n => !n.parentId) ||
      project.nodes[0],
    [project.nodes]
  );

  const iconsCount = useMemo(
    () => project.nodes.filter(n => Boolean(n.icon)).length,
    [project.nodes]
  );

  const filteredFlatNodes = useMemo(() => {
    if (!isOpen || activeTab !== 'outline') return [];
    const q = outlineQuery.trim().toLowerCase();
    if (!q) return [];
    return project.nodes.filter(n => n.text.toLowerCase().includes(q));
  }, [isOpen, activeTab, outlineQuery, project.nodes]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, OrganizerNode[]>();
    if (!isOpen || activeTab !== 'outline') return map;
    for (let i = 0; i < project.nodes.length; i++) {
      const n = project.nodes[i];
      if (!n.isRoot && n.parentId) {
        const list = map.get(n.parentId);
        if (list) list.push(n);
        else map.set(n.parentId, [n]);
      }
    }
    return map;
  }, [isOpen, activeTab, project.nodes]);

  if (!isOpen) return null;

  const closeIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const targetNode = selectedNode || rootNode;

  const renderOutlineBranch = (node: OrganizerNode, level: number) => {
    const kids = childrenByParent.get(node.id) || [];
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => onSelectNode(node.id)}
          style={{ paddingLeft: `${Math.min(level * 13 + 8, 88)}px` }}
          className={`group flex items-center justify-between gap-1 py-1.5 pr-2 rounded-xl cursor-pointer text-xs transition-colors ${
            isSelected
              ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200/60'
              : 'text-stone-700 hover:bg-stone-100/80 font-medium'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {kids.length > 0 ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onToggleCollapse(node.id);
                }}
                className="p-0.5 rounded-md hover:bg-stone-200/70 text-stone-400"
              >
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-200 ${
                    node.collapsed ? '' : 'rotate-90'
                  }`}
                />
              </button>
            ) : (
              <span
                style={{ backgroundColor: node.color || '#EA580C' }}
                className="w-2 h-2 rounded-full shrink-0 ml-1"
              />
            )}
            {node.icon && <span className="text-xs shrink-0">{node.icon}</span>}
            <span className="truncate">{node.text}</span>
          </div>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            title="Añadir subtema aquí"
            className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-lg hover:bg-orange-100 text-orange-600 transition-opacity shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {!node.collapsed &&
          kids.map(child => renderOutlineBranch(child, level + 1))}
      </div>
    );
  };

  return (
    <aside className="ios-drawer-left ios-glass-bar fixed lg:static top-14 lg:top-0 bottom-0 left-0 z-40 w-[282px] max-w-[86vw] lg:w-[264px] shrink-0 border-r border-stone-200/80 flex flex-col lg:h-full shadow-2xl lg:shadow-none select-none">
      {/* Control segmentado estilo iOS + botón cerrar móvil */}
      <div className="flex items-center gap-1.5 p-2.5 border-b border-stone-200/70 bg-stone-50/60 shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-stone-200/65 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('insert')}
            className={`ios-btn flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'insert'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shapes className="w-3.5 h-3.5 text-orange-600" />
            <span>Insertar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('marks')}
            className={`ios-btn flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'marks'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Símbolos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            className={`ios-btn flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'outline'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5 text-emerald-600" />
            <span>Esquema</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Cerrar panel"
            className="ios-btn lg:hidden p-1.5 rounded-full bg-stone-200/70 text-stone-600 hover:text-stone-900 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cuerpo del panel con secciones primordiales + desplegables ordenados */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'insert' && (
          <>
            {/* PRIMORDIALES VISIBLES: Acciones de Inserción Directa */}
            <div className="p-2.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs space-y-2">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400 truncate px-0.5">
                Acciones en «{targetNode?.text.slice(0, 20)}»
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (targetNode) onAddChild(targetNode.id);
                    closeIfMobile();
                  }}
                  className="ios-btn flex flex-col items-center gap-1 p-2.5 rounded-xl bg-orange-50/90 hover:bg-orange-100/80 border border-orange-200/80 text-orange-950 text-xs font-bold"
                >
                  <Plus className="w-4 h-4 text-orange-600" />
                  <span>Subtema</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (targetNode) onAddSibling(targetNode.id);
                    closeIfMobile();
                  }}
                  className="ios-btn flex flex-col items-center gap-1 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold"
                >
                  <GitBranchPlus className="w-4 h-4 text-stone-600" />
                  <span>Hermano</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStartCrossLink();
                    closeIfMobile();
                  }}
                  className="ios-btn flex flex-col items-center gap-1 p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-950 text-xs font-bold"
                >
                  <GitCompareArrows className="w-4 h-4 text-amber-600" />
                  <span>Relación</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (targetNode) onExpandAi(targetNode);
                    closeIfMobile();
                  }}
                  className="ios-btn flex flex-col items-center gap-1 p-2.5 rounded-xl bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200 text-purple-950 text-xs font-bold"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Ramas IA</span>
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && onAddImageFile) {
                    onAddImageFile(file);
                    closeIfMobile();
                  }
                  if (e.target) e.target.value = '';
                }}
              />
              <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="ios-btn w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-2xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Insertar Imagen en Lienzo</span>
                </button>

                {onOpenTemplates && (
                  <button
                    type="button"
                    onClick={() => {
                      closeIfMobile();
                      onOpenTemplates();
                    }}
                    className="ios-btn w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-950 text-xs font-bold"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5 text-orange-600" />
                    <span>Explorar Plantillas EdrawMax</span>
                  </button>
                )}
              </div>
            </div>

            {/* DESPLEGABLE 1: Formas Geométricas del Nodo */}
            <div className="rounded-2xl bg-white/90 border border-stone-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShapesExpanded(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50/80 transition-colors"
              >
                <span className="text-[11px] font-extrabold text-stone-700">
                  Geometría del Cuadro (9 Formas)
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    shapesExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {shapesExpanded && (
                <div className="px-2.5 pb-2.5 pt-0.5 border-t border-stone-100">
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {SHAPE_OPTIONS.map(opt => {
                      const isCurrent = (selectedNode?.shape || 'rounded') === opt.shape;
                      return (
                        <button
                          key={opt.shape}
                          type="button"
                          disabled={!selectedNode}
                          onClick={() =>
                            selectedNode &&
                            onUpdateNode(selectedNode.id, { shape: opt.shape })
                          }
                          className={`ios-btn flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all disabled:opacity-45 ${
                            isCurrent && selectedNode
                              ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-2xs'
                              : 'bg-white border-stone-200/90 hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <span className="text-base leading-none mb-1">{opt.preview}</span>
                          <span className="text-[10px] font-semibold leading-tight">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!selectedNode && (
                    <p className="mt-2 text-[10.5px] text-stone-400 text-center">
                      Selecciona un cuadro en el mapa para cambiar su forma.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* DESPLEGABLE 2: Símbolos Rápidos de Flujo EdrawMax */}
            <div className="rounded-2xl bg-white/90 border border-stone-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setFlowBlocksExpanded(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50/80 transition-colors"
              >
                <span className="text-[11px] font-extrabold text-stone-700">
                  Bloques de Flujo ISO (Edraw)
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    flowBlocksExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {flowBlocksExpanded && (
                <div className="px-2.5 pb-2.5 pt-1.5 border-t border-stone-100 grid grid-cols-2 gap-1.5">
                  {[
                    {
                      label: 'Proceso',
                      desc: 'Acción o etapa',
                      shape: 'rectangle' as NodeShape,
                      flowType: 'process' as const,
                      text: 'Ejecutar proceso operativo',
                      icon: '⚙️',
                    },
                    {
                      label: 'Decisión',
                      desc: 'Condición Sí / No',
                      shape: 'diamond' as NodeShape,
                      flowType: 'decision' as const,
                      text: '¿Cumple la condición?',
                      icon: '⚖️',
                    },
                    {
                      label: 'Datos E/S',
                      desc: 'Entrada o salida',
                      shape: 'parallelogram' as NodeShape,
                      flowType: 'data' as const,
                      text: 'Registrar datos de entrada',
                      icon: '📥',
                    },
                    {
                      label: 'Terminal',
                      desc: 'Inicio o cierre',
                      shape: 'pill' as NodeShape,
                      flowType: 'end' as const,
                      text: 'Cierre verificado del flujo',
                      icon: '🏁',
                    },
                  ].map(blk => (
                    <button
                      key={blk.label}
                      type="button"
                      onClick={() => {
                        if (targetNode) {
                          onAddChild(targetNode.id, {
                            text: blk.text,
                            shape: blk.shape,
                            flowType: blk.flowType,
                            icon: blk.icon,
                          });
                          closeIfMobile();
                        }
                      }}
                      className="ios-btn p-2 rounded-xl border border-stone-200/90 bg-stone-50/60 hover:bg-orange-50/60 hover:border-orange-200 text-left"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                        <span>{blk.icon}</span>
                        <span>{blk.label}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{blk.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'marks' && (
          <>
            {!selectedNode ? (
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
                Toca cualquier cuadro del mapa para asignarle prioridad, avance o iconos visuales.
              </div>
            ) : (
              <div className="px-1 text-[11px] font-semibold text-stone-500 truncate">
                Editando:{' '}
                <span className="font-bold text-stone-800">{selectedNode.text}</span>
              </div>
            )}

            {/* PRIMORDIALES: Prioridad y Progreso */}
            <div className="p-2.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400">
                    Prioridad (P1 – P5)
                  </span>
                  {selectedNode?.priority && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode(selectedNode.id, { priority: undefined })
                      }
                      className="text-[10.5px] font-semibold text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map(p => {
                    const badge = PRIORITY_BADGES[p];
                    const active = selectedNode?.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={!selectedNode}
                        onClick={() =>
                          selectedNode &&
                          onUpdateNode(selectedNode.id, {
                            priority: active ? undefined : p,
                          })
                        }
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.text,
                        }}
                        className={`ios-btn py-1.5 rounded-lg text-xs font-extrabold shadow-2xs disabled:opacity-40 ${
                          active ? 'ring-2 ring-offset-1 ring-stone-800' : ''
                        }`}
                      >
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400">
                    Progreso de Avance
                  </span>
                  {selectedNode?.progress !== undefined && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode(selectedNode.id, { progress: undefined })
                      }
                      className="text-[10.5px] font-semibold text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {PROGRESS_STEPS.map(step => {
                    const active = selectedNode?.progress === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        disabled={!selectedNode}
                        onClick={() =>
                          selectedNode &&
                          onUpdateNode(selectedNode.id, {
                            progress: active ? undefined : step,
                          })
                        }
                        className={`ios-btn py-1.5 rounded-lg border text-[10.5px] font-bold disabled:opacity-40 ${
                          active
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {step}%
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DESPLEGABLES POR CATEGORÍA DE SÍMBOLOS EDRAWMAX */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400">
                  Paquetes de Iconos
                </span>
                {selectedNode?.icon && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateNode(selectedNode.id, { icon: undefined })
                    }
                    className="text-[10.5px] font-semibold text-red-600 hover:underline"
                  >
                    Sin icono
                  </button>
                )}
              </div>

              {onClearAllIcons && (
                <button
                  type="button"
                  disabled={iconsCount === 0}
                  onClick={onClearAllIcons}
                  className="ios-btn w-full flex items-center justify-between px-3 py-2 rounded-xl border border-red-200/80 bg-red-50/70 hover:bg-red-50 text-red-700 text-xs font-bold transition-all disabled:opacity-45 disabled:bg-stone-50 disabled:border-stone-200 disabled:text-stone-400"
                >
                  <span className="flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar todos los iconos</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/90 border border-current/15 font-extrabold">
                    {iconsCount}
                  </span>
                </button>
              )}

              {ICON_CATEGORIES.map(cat => {
                const isOpenCat = openIconCat === cat.id;
                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl bg-white/90 border border-stone-200/80 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenIconCat(prev => (prev === cat.id ? '' : cat.id))
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50/80 transition-colors"
                    >
                      <span className="text-xs font-bold text-stone-700">
                        {cat.label}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                          isOpenCat ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpenCat && (
                      <div className="px-2.5 pb-2.5 pt-1 border-t border-stone-100 grid grid-cols-6 gap-1">
                        {cat.icons.map(ic => {
                          const active = selectedNode?.icon === ic;
                          return (
                            <button
                              key={ic}
                              type="button"
                              disabled={!selectedNode}
                              onClick={() =>
                                selectedNode &&
                                onUpdateNode(selectedNode.id, {
                                  icon: active ? undefined : ic,
                                })
                              }
                              className={`ios-btn h-8 rounded-lg flex items-center justify-center text-base disabled:opacity-40 ${
                                active
                                  ? 'bg-orange-100 border border-orange-400'
                                  : 'hover:bg-stone-100 border border-transparent'
                              }`}
                            >
                              {ic}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'outline' && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={outlineQuery}
                onChange={e => setOutlineQuery(e.target.value)}
                placeholder="Filtrar nodos del esquema..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs font-medium text-stone-800"
              />
              {outlineQuery && (
                <button
                  type="button"
                  onClick={() => setOutlineQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {outlineQuery.trim() ? (
              <div className="space-y-1">
                {filteredFlatNodes.length > 0 ? (
                  filteredFlatNodes.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        onSelectNode(n.id);
                        closeIfMobile();
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs ${
                        selectedNode?.id === n.id
                          ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: n.color || '#EA580C' }}
                        className="w-2 h-2 rounded-full shrink-0"
                      />
                      <span className="truncate">{n.text}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    Sin coincidencias en el mapa.
                  </p>
                )}
              </div>
            ) : rootNode ? (
              <div className="space-y-0.5">{renderOutlineBranch(rootNode, 0)}</div>
            ) : (
              <p className="text-xs text-stone-400">Sin nodos en el proyecto.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export const LeftSidebar = React.memo(LeftSidebarComponent);
