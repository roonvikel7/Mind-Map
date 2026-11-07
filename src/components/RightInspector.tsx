import React, { useState } from 'react';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Compass,
  Image as ImageIcon,
  Lock,
  Palette,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Trash2,
  Unlock,
} from 'lucide-react';
import {
  CanvasBgStyle,
  CanvasImage,
  EdgeStyle,
  OrganizerNode,
  OrganizerProject,
  ThemeId,
} from '../types/organizer';
import { EDRAW_THEMES, getThemeConfig } from '../utils/themes';

interface RightInspectorProps {
  isOpen: boolean;
  project: OrganizerProject;
  selectedNode: OrganizerNode | null;
  selectedImage?: CanvasImage | null;
  onUpdateNode: (nodeId: string, updates: Partial<OrganizerNode>) => void;
  onUpdateImage?: (id: string, updates: Partial<CanvasImage>) => void;
  onDeleteImage?: (id: string) => void;
  onToggleLockImage?: (id: string) => void;
  onChangeTheme: (themeId: ThemeId) => void;
  onChangeConnectorStyle: (style: EdgeStyle) => void;
  onChangeCanvasBg: (bg: CanvasBgStyle) => void;
  onExpandOrCollapseAll: (collapse: boolean) => void;
  onChangeCartographicDirection?: (direction: 'clockwise' | 'counterclockwise') => void;
}

const CONNECTOR_STYLES: { id: EdgeStyle; label: string; desc: string }[] = [
  { id: 'bezier', label: 'Curva Bézier', desc: 'Suave y equilibrada' },
  { id: 'tapered', label: 'Orgánica Buzan', desc: 'Rama cónica viva' },
  { id: 'elbow', label: 'Ortogonal', desc: 'Ángulos redondeados' },
  { id: 'straight', label: 'Recta Directa', desc: 'Técnica minimalista' },
];

const CANVAS_BG_OPTIONS: { id: CanvasBgStyle; label: string }[] = [
  { id: 'dots', label: 'Puntos' },
  { id: 'grid', label: 'Cuadrícula' },
  { id: 'clean', label: 'Liso' },
];

export const RightInspector: React.FC<RightInspectorProps> = ({
  isOpen,
  project,
  selectedNode,
  selectedImage,
  onUpdateNode,
  onUpdateImage,
  onDeleteImage,
  onToggleLockImage,
  onChangeTheme,
  onChangeConnectorStyle,
  onChangeCanvasBg,
  onExpandOrCollapseAll,
  onChangeCartographicDirection,
}) => {
  const [tab, setTab] = useState<'theme' | 'format'>('theme');
  const activeTheme = getThemeConfig(project.theme);

  if (!isOpen) return null;

  const hasSelection = Boolean(selectedNode || selectedImage);
  const effectiveTab = hasSelection ? 'format' : tab;

  return (
    <aside className="w-72 shrink-0 bg-white/95 backdrop-blur-md border-l border-stone-200/90 flex flex-col h-full z-30 select-none">
      {/* Selector de pestaña */}
      <div className="grid grid-cols-2 gap-1 p-2 border-b border-stone-100 bg-stone-50/70">
        <button
          type="button"
          onClick={() => setTab('theme')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            effectiveTab === 'theme'
              ? 'bg-white text-orange-700 shadow-sm border border-stone-200/80'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Tema y Lienzo</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('format')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            effectiveTab === 'format'
              ? 'bg-white text-orange-700 shadow-sm border border-stone-200/80'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {selectedImage ? (
            <>
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Imagen</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Formato Nodo</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
        {effectiveTab === 'theme' ? (
          <>
            {/* Control especial de Cartografía Conceptual: Horario vs Antihorario */}
            {project.type === 'cartographic' && onChangeCartographicDirection && (
              <div className="p-3 rounded-2xl bg-orange-50/80 border border-orange-200/90 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-extrabold text-orange-950">
                    Giro de los 8 Ejes de Tobón
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => onChangeCartographicDirection('clockwise')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      (project.cartographicDirection || 'clockwise') === 'clockwise'
                        ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                        : 'bg-white border-orange-200 text-orange-900 hover:bg-orange-100/60'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Horario</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeCartographicDirection('counterclockwise')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      project.cartographicDirection === 'counterclockwise'
                        ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                        : 'bg-white border-orange-200 text-orange-900 hover:bg-orange-100/60'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Antihorario</span>
                  </button>
                </div>
                <p className="text-[10.5px] text-orange-800/80 leading-tight">
                  {(project.cartographicDirection || 'clockwise') === 'clockwise'
                    ? '1. Ejemplificación (Norte) → 2-5 (Este) → 6 (Sur) → 7-8 (Oeste)'
                    : '1. Ejemplificación (Norte) → 2-5 (Oeste) → 6 (Sur) → 7-8 (Este)'}
                </p>
              </div>
            )}
            {/* Galería de Temas Cálidos EdrawMax */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Temas de Diseño Cálidos
              </div>
              <div className="space-y-2">
                {(Object.keys(EDRAW_THEMES) as ThemeId[]).map(tid => {
                  const t = EDRAW_THEMES[tid];
                  const active = project.theme === tid;
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => onChangeTheme(tid)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-orange-50/70 border-orange-400 shadow-sm'
                          : 'bg-white border-stone-200/90 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-stone-800">
                          {t.name}
                        </span>
                        <span
                          style={{ backgroundColor: t.canvasBg }}
                          className="w-4 h-4 rounded-full border border-stone-300"
                          title="Color del lienzo"
                        />
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <span
                          style={{ backgroundColor: t.rootBg }}
                          className="h-2.5 w-6 rounded-full"
                        />
                        {t.palette.slice(0, 6).map((c, idx) => (
                          <span
                            key={idx}
                            style={{ backgroundColor: c }}
                            className="h-2.5 flex-1 rounded-full"
                          />
                        ))}
                      </div>
                      <p className="text-[10.5px] text-stone-500 leading-tight">
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estilo de Conectores */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Estilo de Líneas Conectoras
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CONNECTOR_STYLES.map(cs => {
                  const current =
                    (project.connectorStyle || activeTheme.defaultConnector) === cs.id;
                  return (
                    <button
                      key={cs.id}
                      type="button"
                      onClick={() => onChangeConnectorStyle(cs.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        current
                          ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{cs.label}</div>
                      <div className="text-[10px] text-stone-500">{cs.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fondo del Lienzo */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Superficie del Lienzo
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {CANVAS_BG_OPTIONS.map(opt => {
                  const active = (project.canvasBg || 'dots') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeCanvasBg(opt.id)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control Global de Subramas */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Plegado Rápido de Ramas
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onExpandOrCollapseAll(false)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Expandir Todo</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExpandOrCollapseAll(true)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
                >
                  <ChevronsDownUp className="w-3.5 h-3.5 text-amber-600" />
                  <span>Contraer Niv. 2</span>
                </button>
              </div>
            </div>
          </>
        ) : selectedImage ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 border border-orange-200/80">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-stone-200">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title || 'Preview'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-orange-950 truncate">
                  {selectedImage.title || 'Imagen del mapa'}
                </div>
                <div className="text-[10.5px] text-orange-700">
                  {selectedImage.width} × {selectedImage.height} px
                </div>
              </div>
            </div>

            {/* Título de la Imagen */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Título o Pie de Foto
              </label>
              <input
                type="text"
                value={selectedImage.title || ''}
                placeholder="Descripción opcional"
                onChange={e =>
                  onUpdateImage?.(selectedImage.id, { title: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-xs font-semibold text-stone-800"
              />
            </div>

            {/* Dimensiones y Tamaños Rápidos */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Tamaño Rápido
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {[
                  { label: 'S (160px)', w: 160 },
                  { label: 'M (240px)', w: 240 },
                  { label: 'L (340px)', w: 340 },
                ].map(sz => {
                  const ratio = selectedImage.width / (selectedImage.height || 1);
                  return (
                    <button
                      key={sz.label}
                      type="button"
                      onClick={() =>
                        onUpdateImage?.(selectedImage.id, {
                          width: sz.w,
                          height: Math.round(sz.w / ratio),
                        })
                      }
                      className="py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-semibold text-stone-700"
                    >
                      {sz.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Ancho (px)</label>
                  <input
                    type="number"
                    min={60}
                    max={1600}
                    value={selectedImage.width}
                    onChange={e =>
                      onUpdateImage?.(selectedImage.id, {
                        width: Math.max(60, Number(e.target.value) || 100),
                      })
                    }
                    className="w-full px-2 py-1 rounded-lg border border-stone-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Alto (px)</label>
                  <input
                    type="number"
                    min={50}
                    max={1600}
                    value={selectedImage.height}
                    onChange={e =>
                      onUpdateImage?.(selectedImage.id, {
                        height: Math.max(50, Number(e.target.value) || 80),
                      })
                    }
                    className="w-full px-2 py-1 rounded-lg border border-stone-200 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Opacidad */}
            <div>
              <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                <span>Opacidad</span>
                <span className="text-stone-700">
                  {Math.round((selectedImage.opacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedImage.opacity ?? 1}
                onChange={e =>
                  onUpdateImage?.(selectedImage.id, {
                    opacity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>

            {/* Estilo de Esquinas */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Esquinas
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { br: 0, label: 'Rectas' },
                  { br: 8, label: 'Suaves' },
                  { br: 16, label: 'Curvas' },
                  { br: 999, label: 'Cápsula' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() =>
                      onUpdateImage?.(selectedImage.id, { borderRadius: opt.br })
                    }
                    className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                      (selectedImage.borderRadius ?? 10) === opt.br
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acciones de Bloqueo y Eliminación */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <button
                type="button"
                onClick={() => onToggleLockImage?.(selectedImage.id)}
                className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedImage.locked
                    ? 'bg-amber-500 border-amber-500 text-stone-900 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {selectedImage.locked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Posición Bloqueada</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Bloquear Posición</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDeleteImage?.(selectedImage.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Imagen</span>
              </button>
            </div>
          </div>
        ) : !selectedNode ? (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1.5">
            <div className="text-xs font-bold text-stone-700">
              Ningún elemento seleccionado
            </div>
            <p className="text-[11px] text-stone-500">
              Haz clic en cualquier nodo o imagen del mapa para personalizar su diseño, tamaño, color y detalles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Texto Principal */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Texto del Nodo
              </label>
              <textarea
                rows={2}
                value={selectedNode.text}
                onChange={e =>
                  onUpdateNode(selectedNode.id, { text: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-xs font-semibold text-stone-800 resize-none"
              />
            </div>

            {/* Subtítulo / Cargo / Fecha */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Subtítulo (Cargo, Fecha o Detalle)
              </label>
              <input
                type="text"
                value={selectedNode.subtitle || ''}
                onChange={e =>
                  onUpdateNode(selectedNode.id, {
                    subtitle: e.target.value || undefined,
                  })
                }
                placeholder="Ej. Enero - Marzo / Director..."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-xs text-stone-700"
              />
            </div>

            {/* Color de Rama / Borde */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Color de Acento / Rama
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activeTheme.palette.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onUpdateNode(selectedNode.id, { color: col })}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      selectedNode.color === col
                        ? 'border-stone-900 scale-110'
                        : 'border-white shadow hover:scale-110'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={selectedNode.color || activeTheme.palette[0]}
                  onChange={e =>
                    onUpdateNode(selectedNode.id, { color: e.target.value })
                  }
                  title="Selector de color libre"
                  className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border border-stone-300"
                />
              </div>
            </div>

            {/* Color de Relleno Personalizado */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  Fondo de Tarjeta
                </label>
                {selectedNode.bgColor && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateNode(selectedNode.id, { bgColor: undefined })
                    }
                    className="text-[10.5px] font-semibold text-orange-600 hover:underline"
                  >
                    Automático
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Blanco', val: '#FFFFFF' },
                  { label: 'Crema', val: '#FEF3C7' },
                  { label: 'Menta', val: '#DCFCE7' },
                  { label: 'Cielo', val: '#DBEAFE' },
                  { label: 'Rosa', val: '#FCE7F3' },
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() =>
                      onUpdateNode(selectedNode.id, { bgColor: item.val })
                    }
                    style={{ backgroundColor: item.val }}
                    title={item.label}
                    className="h-6 flex-1 rounded-lg border border-stone-300 hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* Hipervínculo */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Enlace Web (URL)
              </label>
              <input
                type="url"
                value={selectedNode.hyperlink || ''}
                onChange={e =>
                  onUpdateNode(selectedNode.id, {
                    hyperlink: e.target.value || undefined,
                  })
                }
                placeholder="https://ejemplo.com"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-xs text-stone-700"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Notas Detalladas
              </label>
              <textarea
                rows={4}
                value={selectedNode.notes || ''}
                onChange={e =>
                  onUpdateNode(selectedNode.id, {
                    notes: e.target.value || undefined,
                  })
                }
                placeholder="Escribe apuntes, definiciones o recordatorios sobre este nodo..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-xs text-stone-700 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
