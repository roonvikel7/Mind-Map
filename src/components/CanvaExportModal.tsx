import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Layers,
  Loader2,
  Presentation,
  Sparkles,
  X,
} from 'lucide-react';
import type { OrganizerProject } from '../types/organizer';
import {
  exportForCanvaPresentation,
  type CanvaExportResult,
} from '../utils/canvaExporter';
import { computeHierarchyVisibility } from '../utils/measure';

interface CanvaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: OrganizerProject;
}

export const CanvaExportModal: React.FC<CanvaExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [includeBranchSlides, setIncludeBranchSlides] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CanvaExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!isOpen) return { visibleCount: 0, branchCount: 0 };
    const { hiddenIds } = computeHierarchyVisibility(project.nodes, project.edges);
    const visible = project.nodes.filter(n => !hiddenIds.has(n.id));
    const root =
      project.nodes.find(n => n.isRoot) ||
      project.nodes.find(n => !n.parentId) ||
      project.nodes[0];
    const branches = root
      ? project.nodes.filter(n => n.parentId === root.id && n.id !== root.id).length
      : 0;
    return { visibleCount: visible.length, branchCount: branches };
  }, [isOpen, project.nodes, project.edges]);

  if (!isOpen) return null;

  const totalSlidesPreview = includeBranchSlides ? 1 + stats.branchCount : 1;

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const exportResult = await exportForCanvaPresentation(project, {
        includeBranchSlides,
        includeHeader,
        includeSpeakerNotes,
      });
      setResult(exportResult);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo construir el archivo editable para Canva. Intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-2xl rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Cabecera estilo Canva */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-cyan-50/80 via-sky-50/70 to-violet-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00C4CC] via-[#3B82F6] to-[#7D2AE8] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Presentation className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900 truncate">
                  Presentación en Canva (Editable)
                </h2>
                <span className="hidden sm:inline-flex text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200/80 shrink-0">
                  16:9 • .PPTX Editable
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 line-clamp-1">
                Convierte cuadros, textos, títulos, colores e imágenes en elementos editables dentro de Canva
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Resumen rápido del mapa */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3 text-center">
              <div className="text-base sm:text-lg font-extrabold text-stone-900">
                {stats.visibleCount}
              </div>
              <div className="text-[10.5px] sm:text-[11px] font-semibold text-stone-500">
                Cuadros editables
              </div>
            </div>
            <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3 text-center">
              <div className="text-base sm:text-lg font-extrabold text-cyan-700">
                {totalSlidesPreview}
              </div>
              <div className="text-[10.5px] sm:text-[11px] font-semibold text-stone-500">
                {totalSlidesPreview === 1 ? 'Diapositiva 16:9' : 'Diapositivas 16:9'}
              </div>
            </div>
            <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3 text-center">
              <div className="text-base sm:text-lg font-extrabold text-violet-700">
                100%
              </div>
              <div className="text-[10.5px] sm:text-[11px] font-semibold text-stone-500">
                Texto re-editable
              </div>
            </div>
          </div>

          {/* Selector de estructura de diapositivas */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Formato de Diapositivas para Canva
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIncludeBranchSlides(true);
                  setResult(null);
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  includeBranchSlides
                    ? 'border-cyan-500 bg-cyan-50/60 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Mapa + Temas por Diapositiva</span>
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-cyan-600 text-white shrink-0">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Diapositiva 1 con el mapa completo editable + {stats.branchCount} diapositivas amplias por cada rama/eje.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIncludeBranchSlides(false);
                  setResult(null);
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  !includeBranchSlides
                    ? 'border-violet-500 bg-violet-50/60 shadow-xs'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-900">
                  <Presentation className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>Solo Mapa Completo (1 lámina)</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Genera únicamente 1 diapositiva 16:9 (1920 × 1080) con todo el organizador editable en un solo lienzo.
                </p>
              </button>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3.5 space-y-2.5">
            <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-stone-700">
              <span>Incluir encabezado con título y fecha en la diapositiva 1</span>
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={e => {
                  setIncludeHeader(e.target.checked);
                  setResult(null);
                }}
                className="w-4 h-4 accent-cyan-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-stone-700">
              <span>Exportar apuntes de los cuadros como Notas del Presentador</span>
              <input
                type="checkbox"
                checked={includeSpeakerNotes}
                onChange={e => {
                  setIncludeSpeakerNotes(e.target.checked);
                  setResult(null);
                }}
                className="w-4 h-4 accent-cyan-600 rounded"
              />
            </label>
          </div>

          {errorMsg && (
            <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Panel de confirmación + Pasos para abrir en Canva */}
          {result ? (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-cyan-50/70 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-emerald-950">
                    ¡Presentación editable lista para Canva!
                  </div>
                  <div className="text-[11px] text-emerald-900 mt-0.5">
                    Archivo descargado: <strong className="break-all">{result.fileName}</strong> ({result.slideCount}{' '}
                    {result.slideCount === 1 ? 'diapositiva' : 'diapositivas'}, {result.editableShapeCount} formas y{' '}
                    {result.editableTextCount} textos editables).
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white/90 border border-emerald-200/70 p-3 space-y-1.5 text-[11.5px] text-stone-700">
                <div className="font-extrabold text-stone-900">
                  Cómo abrirlo editable en Canva en 3 segundos:
                </div>
                <div>
                  1. Haz clic en <strong>«Ir a Canva.com →»</strong> debajo (o abre Canva en otra pestaña).
                </div>
                <div>
                  2. En el inicio de Canva, pulsa <strong>Subir</strong> (arriba a la derecha) o{' '}
                  <strong>Crear un diseño → Importar archivo</strong> (también puedes arrastrar el{' '}
                  <code className="px-1 py-0.5 rounded bg-stone-100 text-[10.5px]">.pptx</code> directo a la ventana).
                </div>
                <div>
                  3. Canva lo convertirá automáticamente en una <strong>Presentación editable</strong> donde podrás
                  modificar textos, tipografías, colores, mover cuadros o aplicar animaciones.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="ios-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .PPTX otra vez</span>
                </button>

                <a
                  href="https://www.canva.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:opacity-95 text-white text-xs font-extrabold shadow-sm"
                >
                  <span>Ir a Canva.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <a
                href="https://www.canva.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-cyan-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Canva.com</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="ios-btn px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="ios-btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00C4CC] via-[#3B82F6] to-[#7D2AE8] hover:opacity-95 disabled:opacity-60 text-white text-xs font-extrabold shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Construyendo Presentación...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Presentación Editable (.PPTX)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
