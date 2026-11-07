import React, { useRef, useState } from 'react';
import {
  Award,
  ChevronRight,
  GitBranchPlus,
  GitCompareArrows,
  Image as ImageIcon,
  ListTree,
  Plus,
  Shapes,
  Sparkles,
} from 'lucide-react';
import { NodeShape, OrganizerNode, OrganizerProject } from '../types/organizer';
import { CURATED_ICONS, PRIORITY_BADGES } from '../utils/themes';

interface LeftSidebarProps {
  isOpen: boolean;
  project: OrganizerProject;
  selectedNode: OrganizerNode | null;
  onSelectNode: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (nodeId: string) => void;
  onExpandAi: (node: OrganizerNode) => void;
  onStartCrossLink: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<OrganizerNode>) => void;
  onToggleCollapse: (nodeId: string) => void;
  onAddImageFile?: (file: File) => void;
}

const SHAPE_OPTIONS: { shape: NodeShape; label: string; preview: string }[] = [
  { shape: 'rounded', label: 'Redondeada', preview: '▢' },
  { shape: 'pill', label: 'Cápsula', preview: '⬭' },
  { shape: 'rectangle', label: 'Rectángulo', preview: '▭' },
  { shape: 'underline', label: 'Subrayada Edraw', preview: '▁' },
  { shape: 'diamond', label: 'Rombo Decisión', preview: '◇' },
  { shape: 'parallelogram', label: 'Datos / E-S', preview: '▱' },
  { shape: 'hexagon', label: 'Hexágono', preview: '⬡' },
  { shape: 'cloud', label: 'Nube Énfasis', preview: '☁' },
  { shape: 'circle', label: 'Circular', preview: '◯' },
];

const PROGRESS_STEPS: (0 | 25 | 50 | 75 | 100)[] = [0, 25, 50, 75, 100];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  project,
  selectedNode,
  onSelectNode,
  onAddChild,
  onAddSibling,
  onExpandAi,
  onStartCrossLink,
  onUpdateNode,
  onToggleCollapse,
  onAddImageFile,
}) => {
  const [activeTab, setActiveTab] = useState<'insert' | 'marks' | 'outline'>('insert');
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const rootNode =
    project.nodes.find(n => n.isRoot) ||
    project.nodes.find(n => !n.parentId) ||
    project.nodes[0];

  const targetNode = selectedNode || rootNode;

  const renderOutlineBranch = (node: OrganizerNode, level: number) => {
    const kids = project.nodes.filter(n => n.parentId === node.id && !n.isRoot);
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => onSelectNode(node.id)}
          style={{ paddingLeft: `${Math.min(level * 14 + 8, 92)}px` }}
          className={`group flex items-center justify-between gap-1 py-1.5 pr-2 rounded-lg cursor-pointer text-xs transition-colors ${
            isSelected
              ? 'bg-orange-50 text-orange-900 font-bold'
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
                className="p-0.5 rounded hover:bg-stone-200/70 text-stone-400"
              >
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${
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
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-orange-100 text-orange-600 transition-opacity shrink-0"
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
    <aside className="w-[268px] shrink-0 bg-white/95 backdrop-blur-md border-r border-stone-200/90 flex flex-col h-full z-30 select-none">
      {/* Pestañas superiores estilo EdrawMax */}
      <div className="grid grid-cols-3 gap-1 p-2 border-b border-stone-100 bg-stone-50/70">
        <button
          type="button"
          onClick={() => setActiveTab('insert')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'insert'
              ? 'bg-white text-orange-700 shadow-sm border border-stone-200/80'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Shapes className="w-3.5 h-3.5" />
          <span>Formas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marks')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'marks'
              ? 'bg-white text-orange-700 shadow-sm border border-stone-200/80'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Marcas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outline')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'outline'
              ? 'bg-white text-orange-700 shadow-sm border border-stone-200/80'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>Esquema</span>
        </button>
      </div>

      {/* Contenido de cada pestaña */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'insert' && (
          <>
            {/* Acciones rápidas de inserción */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Insertar en «{targetNode?.text.slice(0, 20)}»
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => targetNode && onAddChild(targetNode.id)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200/80 text-orange-900 text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4 text-orange-600" />
                  <span>Subtema</span>
                </button>
                <button
                  type="button"
                  onClick={() => targetNode && onAddSibling(targetNode.id)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  <GitBranchPlus className="w-4 h-4 text-stone-600" />
                  <span>Hermano</span>
                </button>
                <button
                  type="button"
                  onClick={onStartCrossLink}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold transition-colors"
                >
                  <GitCompareArrows className="w-4 h-4 text-amber-600" />
                  <span>Relación</span>
                </button>
                <button
                  type="button"
                  onClick={() => targetNode && onExpandAi(targetNode)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Ramas IA</span>
                </button>
              </div>

              {/* Botón para insertar imagen libre */}
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
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-950 text-xs font-bold transition-colors shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <span>Insertar Imagen Libre</span>
              </button>
            </div>

            {/* Biblioteca de Formas Geométricas EdrawMax */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Forma del Nodo Seleccionado
              </div>
              <div className="grid grid-cols-3 gap-1.5">
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
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all disabled:opacity-45 ${
                        isCurrent && selectedNode
                          ? 'bg-orange-50 border-orange-400 text-orange-900 shadow-sm'
                          : 'bg-white border-stone-200/90 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="text-lg leading-none mb-1">{opt.preview}</span>
                      <span className="text-[10px] font-semibold leading-tight">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!selectedNode && (
                <p className="mt-2 text-[11px] text-stone-400">
                  Haz clic en cualquier nodo del lienzo para cambiar su geometría.
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === 'marks' && (
          <>
            {!selectedNode ? (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                Selecciona un nodo en el mapa para añadirle marcas de prioridad, progreso o símbolos visuales.
              </div>
            ) : (
              <div className="text-[11px] font-semibold text-stone-500">
                Editando marcas de:{' '}
                <span className="font-bold text-stone-800">{selectedNode.text}</span>
              </div>
            )}

            {/* Prioridades P1 - P5 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Prioridad (Edraw Marks)
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
                      className={`py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-transform disabled:opacity-40 ${
                        active ? 'ring-2 ring-offset-2 ring-stone-800 scale-105' : 'hover:scale-105'
                      }`}
                    >
                      {badge.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progreso de Tarea 0% - 100% */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Progreso de Tarea
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
              <div className="grid grid-cols-5 gap-1.5">
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
                      className={`py-1.5 rounded-lg border text-[11px] font-bold transition-all disabled:opacity-40 ${
                        active
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {step}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Símbolos e Iconos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Símbolos e Iconos
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
              <div className="grid grid-cols-6 gap-1">
                {CURATED_ICONS.map(ic => {
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
                      className={`h-8 rounded-lg flex items-center justify-center text-base transition-all disabled:opacity-40 ${
                        active
                          ? 'bg-orange-100 border border-orange-400 scale-105'
                          : 'hover:bg-stone-100 border border-transparent'
                      }`}
                    >
                      {ic}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'outline' && (
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Índice Jerárquico en Vivo
            </div>
            {rootNode ? (
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
