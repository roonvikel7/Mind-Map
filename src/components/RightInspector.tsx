import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Compass,
  Image as ImageIcon,
  Lock,
  Palette,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Unlock,
  X,
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
import { buildAiImageUrl } from '../utils/aiService';

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
  onToggleRainbowBranches?: () => void;
  onExpandOrCollapseAll: (collapse: boolean) => void;
  onChangeCartographicDirection?: (direction: 'clockwise' | 'counterclockwise') => void;
  onApplyGlobalTextAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onClearAllIcons?: () => void;
  onClose?: () => void;
}

const CONNECTOR_STYLES: { id: EdgeStyle; label: string; desc: string }[] = [
  { id: 'bezier', label: 'Curva Bézier', desc: 'Suave y armónica' },
  { id: 'tapered', label: 'Orgánica Buzan', desc: 'Rama cónica viva' },
  { id: 'elbow', label: 'Ortogonal', desc: 'Ángulos limpios' },
  { id: 'straight', label: 'Recta Directa', desc: 'Técnica precisa' },
];

const CANVAS_BG_OPTIONS: { id: CanvasBgStyle; label: string }[] = [
  { id: 'dots', label: 'Puntos' },
  { id: 'grid', label: 'Cuadrícula' },
  { id: 'clean', label: 'Liso' },
];

const RightInspectorComponent: React.FC<RightInspectorProps> = ({
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
  onToggleRainbowBranches,
  onExpandOrCollapseAll,
  onChangeCartographicDirection,
  onApplyGlobalTextAlign,
  onClearAllIcons,
  onClose,
}) => {
  const [tab, setTab] = useState<'theme' | 'format'>('theme');
  const [connectorsOpen, setConnectorsOpen] = useState(true);
  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const [advancedNodeOpen, setAdvancedNodeOpen] = useState(false);

  const activeTheme = getThemeConfig(project.theme);
  const iconsCount = useMemo(
    () => project.nodes.filter(n => Boolean(n.icon)).length,
    [project.nodes]
  );

  useEffect(() => {
    if (selectedNode?.id || selectedImage?.id) {
      setTab('format');
    }
  }, [selectedNode?.id, selectedImage?.id]);

  if (!isOpen) return null;

  return (
    <aside className="ios-drawer-right ios-glass-bar fixed lg:static top-14 lg:top-0 bottom-0 right-0 z-40 w-[290px] max-w-[88vw] lg:w-[276px] shrink-0 border-l border-stone-200/80 flex flex-col lg:h-full shadow-2xl lg:shadow-none select-none">
      {/* Control segmentado estilo iOS + botón cerrar móvil */}
      <div className="flex items-center gap-1.5 p-2.5 border-b border-stone-200/70 bg-stone-50/60 shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-200/65 flex-1">
          <button
            type="button"
            onClick={() => setTab('theme')}
            className={`ios-btn flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              tab === 'theme'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-orange-600" />
            <span>Diseño</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('format')}
            className={`ios-btn flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              tab === 'format'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {selectedImage ? (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Imagen</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Formato</span>
              </>
            )}
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Cerrar inspector"
            className="ios-btn lg:hidden p-1.5 rounded-full bg-stone-200/70 text-stone-600 hover:text-stone-900 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'theme' ? (
          <>
            {/* Giro simétrico 1-3-1-3 en Cartografía Conceptual */}
            {project.type === 'cartographic' && onChangeCartographicDirection && (
              <div className="p-3 rounded-2xl bg-orange-50/85 border border-orange-200/90 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-xs font-extrabold text-orange-950">
                    Giro Simétrico de 8 Ejes
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => onChangeCartographicDirection('clockwise')}
                    className={`ios-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      (project.cartographicDirection || 'clockwise') === 'clockwise'
                        ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                        : 'bg-white border-orange-200 text-orange-900 hover:bg-orange-100/60'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Horario</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeCartographicDirection('counterclockwise')}
                    className={`ios-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      project.cartographicDirection === 'counterclockwise'
                        ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                        : 'bg-white border-orange-200 text-orange-900 hover:bg-orange-100/60'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Antihorario</span>
                  </button>
                </div>
                <p className="text-[10px] text-orange-900/80 leading-snug">
                  {(project.cartographicDirection || 'clockwise') === 'clockwise'
                    ? 'Simetría 1-3-1-3: Eje 1 (Norte) → 2, 3, 4 (Este) → 5 (Sur) → 6, 7, 8 (Oeste)'
                    : 'Simetría 1-3-1-3: Eje 1 (Norte) → 2, 3, 4 (Oeste) → 5 (Sur) → 6, 7, 8 (Este)'}
                </p>
              </div>
            )}

            {/* PRIMORDIALES: Galería de 8 Temas EdrawMax + iOS */}
            <div className="p-2.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-2">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400 px-0.5">
                Temas Profesionales ({Object.keys(EDRAW_THEMES).length})
              </div>
              <div className="space-y-1.5">
                {(Object.keys(EDRAW_THEMES) as ThemeId[]).map(tid => {
                  const t = EDRAW_THEMES[tid];
                  const active = project.theme === tid;
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => onChangeTheme(tid)}
                      className={`ios-btn w-full p-2 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-orange-50/80 border-orange-400 shadow-2xs'
                          : 'bg-white border-stone-200/80 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-800 truncate">
                          {t.name}
                        </span>
                        <span
                          style={{ backgroundColor: t.canvasBg }}
                          className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                          title="Color de fondo del lienzo"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          style={{ backgroundColor: t.rootBg }}
                          className="h-2 w-5 rounded-full"
                        />
                        {t.palette.slice(0, 6).map((c, idx) => (
                          <span
                            key={idx}
                            style={{ backgroundColor: c }}
                            className="h-2 flex-1 rounded-full"
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESPLEGABLE 1: Líneas Conectoras y Ramas Arcoíris */}
            <div className="rounded-2xl bg-white/90 border border-stone-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setConnectorsOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50/80 transition-colors"
              >
                <span className="text-[11px] font-extrabold text-stone-700">
                  Líneas Conectoras y Color
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    connectorsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {connectorsOpen && (
                <div className="px-2.5 pb-2.5 pt-1.5 border-t border-stone-100 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {CONNECTOR_STYLES.map(cs => {
                      const current =
                        (project.connectorStyle || activeTheme.defaultConnector) === cs.id;
                      return (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => onChangeConnectorStyle(cs.id)}
                          className={`ios-btn p-2 rounded-xl border text-left transition-all ${
                            current
                              ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-2xs'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="text-xs font-bold">{cs.label}</div>
                          <div className="text-[10px] text-stone-500">{cs.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  {onToggleRainbowBranches && (
                    <button
                      type="button"
                      onClick={onToggleRainbowBranches}
                      className={`ios-btn w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                        project.rainbowBranches !== false
                          ? 'bg-orange-50/80 border-orange-200 text-orange-950'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                        <span>Ramas Arcoíris Edraw</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          project.rainbowBranches !== false
                            ? 'bg-orange-600 text-white'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {project.rainbowBranches !== false ? 'Activo' : 'Uniforme'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* DESPLEGABLE 2: Superficie del Lienzo y Plegado de Ramas */}
            <div className="rounded-2xl bg-white/90 border border-stone-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setSurfaceOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50/80 transition-colors"
              >
                <span className="text-[11px] font-extrabold text-stone-700">
                  Lienzo y Plegado de Ramas
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    surfaceOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {surfaceOpen && (
                <div className="px-2.5 pb-2.5 pt-1.5 border-t border-stone-100 space-y-2.5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Retícula de Fondo
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CANVAS_BG_OPTIONS.map(opt => {
                        const active = (project.canvasBg || 'dots') === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChangeCanvasBg(opt.id)}
                            className={`ios-btn py-1.5 rounded-xl border text-xs font-bold transition-all ${
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

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Niveles de Subramas
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onExpandOrCollapseAll(false)}
                        className="ios-btn flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
                      >
                        <ChevronsUpDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Expandir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onExpandOrCollapseAll(true)}
                        className="ios-btn flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
                      >
                        <ChevronsDownUp className="w-3.5 h-3.5 text-amber-600" />
                        <span>Contraer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {onClearAllIcons && (
              <button
                type="button"
                disabled={iconsCount === 0}
                onClick={onClearAllIcons}
                className="ios-btn w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border border-red-200/80 bg-red-50/70 hover:bg-red-50 text-red-700 text-xs font-bold transition-all disabled:opacity-45 disabled:bg-stone-50 disabled:border-stone-200 disabled:text-stone-400"
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
          </>
        ) : selectedImage ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-orange-50/90 border border-orange-200/80">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200">
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

            <div className="p-2.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Pie de Foto
                </label>
                <input
                  type="text"
                  value={selectedImage.title || ''}
                  placeholder="Descripción opcional"
                  onChange={e =>
                    onUpdateImage?.(selectedImage.id, { title: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs font-semibold text-stone-800"
                />
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Escala Rápida
                </div>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {[
                    { label: 'S (160)', w: 160 },
                    { label: 'M (240)', w: 240 },
                    { label: 'L (340)', w: 340 },
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
                        className="ios-btn py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-semibold text-stone-700"
                      >
                        {sz.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">Ancho</label>
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
                      className="w-full px-2 py-1 rounded-lg border border-stone-200 text-base sm:text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">Alto</label>
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
                      className="w-full px-2 py-1 rounded-lg border border-stone-200 text-base sm:text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
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

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Esquinas
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { br: 0, label: 'Rectas' },
                    { br: 8, label: 'Suaves' },
                    { br: 16, label: 'Curvas' },
                    { br: 999, label: 'Óvalo' },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        onUpdateImage?.(selectedImage.id, { borderRadius: opt.br })
                      }
                      className={`ios-btn py-1.5 rounded-lg border text-[10.5px] font-semibold ${
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
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onToggleLockImage?.(selectedImage.id)}
                className={`ios-btn w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold ${
                  selectedImage.locked
                    ? 'bg-amber-500 border-amber-500 text-stone-900 shadow-xs'
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
                className="ios-btn w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Imagen</span>
              </button>
            </div>
          </div>
        ) : !selectedNode ? (
          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/80 text-center space-y-1.5">
            <div className="text-xs font-bold text-stone-700">
              Selecciona un cuadro o imagen
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Toca cualquier elemento del lienzo para personalizar su contenido, colores y notas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* PRIMORDIALES: Texto y Colores del Cuadro */}
            <div className="p-2.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">
                  Contenido del Cuadro
                </label>
                <textarea
                  rows={3}
                  value={selectedNode.text}
                  onChange={e =>
                    onUpdateNode(selectedNode.id, { text: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-base sm:text-xs font-semibold text-stone-800 resize-none"
                />
              </div>

              {/* Alineación de Texto (Izquierda, Centro, Derecha, Justificado) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                    Alineación del Texto
                  </label>
                  {selectedNode.textAlign && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode(selectedNode.id, { textAlign: undefined })
                      }
                      className="text-[10px] font-semibold text-orange-600 hover:underline"
                    >
                      Por defecto
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-stone-100/90 border border-stone-200/80">
                  {[
                    { id: 'left', icon: AlignLeft, label: 'Izquierda' },
                    { id: 'center', icon: AlignCenter, label: 'Centro' },
                    { id: 'right', icon: AlignRight, label: 'Derecha' },
                    { id: 'justify', icon: AlignJustify, label: 'Justificado' },
                  ].map(item => {
                    const Icon = item.icon;
                    const isExplicitOrCurrent =
                      selectedNode.textAlign === item.id ||
                      (!selectedNode.textAlign &&
                        (selectedNode.isRoot ||
                        selectedNode.shape === 'diamond' ||
                        selectedNode.shape === 'circle' ||
                        selectedNode.shape === 'pill'
                          ? item.id === 'center'
                          : item.id === 'left'));
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          onUpdateNode(selectedNode.id, { textAlign: item.id as any })
                        }
                        title={`Alinear texto: ${item.label}`}
                        className={`ios-btn flex flex-col items-center justify-center py-1.5 rounded-lg transition-all ${
                          isExplicitOrCurrent
                            ? 'bg-white text-orange-700 shadow-xs font-bold ring-1 ring-orange-400/40'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[9.5px] mt-0.5">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {onApplyGlobalTextAlign && (
                  <button
                    type="button"
                    onClick={() => onApplyGlobalTextAlign('justify')}
                    className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-orange-50 text-[10px] font-semibold text-stone-600 hover:text-orange-900 transition-colors"
                  >
                    <AlignJustify className="w-3 h-3 text-orange-600" />
                    <span>Justificar todos los cuadros del mapa</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1.5">
                  Color de Rama / Borde
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {activeTheme.palette.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => onUpdateNode(selectedNode.id, { color: col })}
                      style={{ backgroundColor: col }}
                      className={`ios-btn w-6 h-6 rounded-full border-2 ${
                        selectedNode.color === col
                          ? 'border-stone-900 scale-110'
                          : 'border-white shadow-xs hover:scale-105'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedNode.color || activeTheme.palette[0]}
                    onChange={e =>
                      onUpdateNode(selectedNode.id, { color: e.target.value })
                    }
                    title="Color personalizado"
                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                    Fondo del Cuadro
                  </label>
                  {selectedNode.bgColor && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode(selectedNode.id, { bgColor: undefined })
                      }
                      className="text-[10px] font-semibold text-orange-600 hover:underline"
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
                    { label: 'Lavanda', val: '#F3E8FF' },
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
                      className="ios-btn h-6 flex-1 rounded-lg border border-stone-300"
                    />
                  ))}
                </div>
              </div>

              {/* Ilustración IA del Cuadro */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                    Ilustración del Cuadro
                  </label>
                  {selectedNode.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode(selectedNode.id, {
                          imageUrl: undefined,
                          imagePrompt: undefined,
                        })
                      }
                      className="text-[10px] font-semibold text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                {selectedNode.imageUrl ? (
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative">
                      <img
                        src={selectedNode.imageUrl}
                        alt={selectedNode.text}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const prompt =
                          selectedNode.imagePrompt ||
                          `${selectedNode.text} realistic conceptual illustration`;
                        const newUrl = buildAiImageUrl(
                          prompt,
                          Date.now() % 100000
                        );
                        onUpdateNode(selectedNode.id, {
                          imageUrl: newUrl,
                          imagePrompt: prompt,
                        });
                      }}
                      className="ios-btn w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Regenerar Variante con IA</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = `${selectedNode.text} realistic conceptual photographic illustration`;
                      const newUrl = buildAiImageUrl(
                        prompt,
                        Date.now() % 100000
                      );
                      onUpdateNode(selectedNode.id, {
                        imageUrl: newUrl,
                        imagePrompt: prompt,
                      });
                    }}
                    className="ios-btn w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar Ilustración IA</span>
                  </button>
                )}
              </div>
            </div>

            {/* DESPLEGABLE: Subtítulo, Enlace y Notas */}
            <div className="rounded-2xl bg-white/90 border border-stone-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedNodeOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50/80 transition-colors"
              >
                <span className="text-[11px] font-extrabold text-stone-700">
                  Subtítulo, Enlace y Notas
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    advancedNodeOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {advancedNodeOpen && (
                <div className="px-2.5 pb-2.5 pt-2 border-t border-stone-100 space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Subtítulo Opcional (Cargo o Fecha)
                    </label>
                    <input
                      type="text"
                      value={selectedNode.subtitle || ''}
                      onChange={e =>
                        onUpdateNode(selectedNode.id, {
                          subtitle: e.target.value || undefined,
                        })
                      }
                      placeholder="Ej. Director / Q1 2026..."
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
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
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Notas Explicativas
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNode.notes || ''}
                      onChange={e =>
                        onUpdateNode(selectedNode.id, {
                          notes: e.target.value || undefined,
                        })
                      }
                      placeholder="Apuntes, referencias o detalles..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-700 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export const RightInspector = React.memo(RightInspectorComponent);
