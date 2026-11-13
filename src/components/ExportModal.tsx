import React, { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  Presentation,
  Printer,
  X,
} from 'lucide-react';
import { OrganizerProject } from '../types/organizer';
import {
  convertProjectToMarkdown,
  exportAsInteractiveHtml,
  exportAsJsonFile,
  exportAsMarkdownFile,
  exportAsRasterFile,
  exportAsSvgFile,
  exportAsVectorPdf,
  generateStandaloneSvg,
} from '../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: OrganizerProject;
  onOpenCanva?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenCanva,
}) => {
  const [transparentBg, setTransparentBg] = useState(false);
  const [includeGrid, setIncludeGrid] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [busyFormat, setBusyFormat] = useState<string | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const previewData = useMemo(() => {
    if (!isOpen) return null;
    return generateStandaloneSvg(project, {
      transparentBg,
      includeGrid,
      includeHeader,
    });
  }, [isOpen, project, transparentBg, includeGrid, includeHeader]);

  if (!isOpen) return null;

  const notifySuccess = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3200);
  };

  const handleRaster = async (fmt: 'png' | 'jpg', tier: '8k' | '4k' | 'standard' = '8k') => {
    try {
      setBusyFormat(`${fmt}-${tier}`);
      await exportAsRasterFile(project, fmt, {
        transparentBg,
        includeGrid,
        includeHeader,
        qualityTier: tier,
      });
      notifySuccess(
        fmt === 'png'
          ? tier === '8k'
            ? '¡Imagen PNG 8K Ultra Resolución descargada con máxima nitidez!'
            : 'Imagen PNG 4K Ultra HD descargada correctamente.'
          : 'Imagen JPG 8K descargada correctamente.'
      );
    } catch (err) {
      console.error(err);
      notifySuccess('Hubo un inconveniente al generar la imagen.');
    } finally {
      setBusyFormat(null);
    }
  };

  const previewDataUri = previewData
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewData.svg)}`
    : '';

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/35 flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-3xl rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Cabecera */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-stone-800 truncate">
                Centro de Exportación 8K UHD
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">
                Motor vectorial autónomo de máxima nitidez (independiente del zoom)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Vista previa real en vivo + Opciones */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            <div
              className="md:col-span-3 rounded-2xl border border-stone-200 overflow-hidden flex items-center justify-center p-3 min-h-[190px]"
              style={{
                background: transparentBg
                  ? 'repeating-conic-gradient(#f5f5f4 0% 25%, #ffffff 0% 50%) 50% / 16px 16px'
                  : '#FAF7F2',
              }}
            >
              {previewDataUri && (
                <img
                  src={previewDataUri}
                  alt="Vista previa de exportación"
                  className="max-h-48 max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>

            <div className="md:col-span-2 rounded-2xl bg-stone-50 border border-stone-200/80 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Ajustes de Salida
                </div>

                <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <span>Incluir título y fecha</span>
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={e => setIncludeHeader(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <span>Fondo transparente (PNG/SVG)</span>
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={e => setTransparentBg(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <span>Incluir puntos/cuadrícula</span>
                  <input
                    type="checkbox"
                    disabled={transparentBg}
                    checked={!transparentBg && includeGrid}
                    onChange={e => setIncludeGrid(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded disabled:opacity-40"
                  />
                </label>
              </div>

              {previewData && (
                <div className="pt-2 border-t border-stone-200/80 text-[11px] text-stone-500 space-y-0.5">
                  <div>Lienzo base: <strong>{previewData.width} × {previewData.height} px</strong></div>
                  <div>
                    Resolución 8K UHD:{' '}
                    <strong className="text-orange-700 font-extrabold">
                      {Math.min(14000, Math.round(previewData.width * Math.max(2, Math.min(8, 7680 / Math.max(previewData.width, previewData.height)))))} ×{' '}
                      {Math.min(14000, Math.round(previewData.height * Math.max(2, Math.min(8, 7680 / Math.max(previewData.width, previewData.height)))))} px
                    </strong>{' '}
                    (ultra nitidez para zoom)
                  </div>
                </div>
              )}
            </div>
          </div>

          {statusMsg && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Formatos de Descarga */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
              Selecciona el Formato de Descarga Directa
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Presentación Editable en Canva */}
              {onOpenCanva && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCanva();
                  }}
                  className="sm:col-span-2 flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 border-cyan-400/90 bg-gradient-to-r from-cyan-50/90 via-sky-50/80 to-violet-50/90 hover:from-cyan-100/80 hover:to-violet-100/80 text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C4CC] via-[#3B82F6] to-[#7D2AE8] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-extrabold text-stone-900">
                          Presentación de Canva (Editable)
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white">
                          CANVA .PPTX
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                        Cuadros, textos, etiquetas y temas en diapositivas 16:9 editables al importar en Canva
                      </div>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-xl bg-white/90 border border-cyan-200 text-[11px] font-extrabold text-cyan-800 shrink-0">
                    Configurar →
                  </span>
                </button>
              )}

              {/* PNG 8K UHD */}
              <button
                type="button"
                disabled={busyFormat !== null}
                onClick={() => handleRaster('png', '8k')}
                className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-orange-400 bg-orange-50/80 hover:bg-orange-100/80 text-left transition-all shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileImage className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-stone-900">
                      {busyFormat === 'png-8k' ? 'Generando PNG 8K...' : 'PNG 8K Ultra Resolución'}
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-600 text-white">
                      8K UHD
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                    Máxima nitidez (hasta 7680px+). Zoom cristalino sin pixelado.
                  </div>
                </div>
              </button>

              {/* PNG 4K */}
              <button
                type="button"
                disabled={busyFormat !== null}
                onClick={() => handleRaster('png', '4k')}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FileImage className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-stone-900">
                      {busyFormat === 'png-4k' ? 'Generando PNG 4K...' : 'PNG 4K Ultra HD'}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      4K
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    Excelente balance para presentaciones y diapositivas
                  </div>
                </div>
              </button>

              {/* SVG Vectorial */}
              <button
                type="button"
                onClick={() => {
                  exportAsSvgFile(project, {
                    transparentBg,
                    includeGrid,
                    includeHeader,
                  });
                  notifySuccess('Archivo vectorial SVG descargado correctamente.');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-stone-900">
                      Vector Escalable (.SVG)
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Infinito
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    Vectores escalables para Illustrator, Figma o insertar como gráfico en Canva
                  </div>
                </div>
              </button>

              {/* PDF Vectorial / Impresión */}
              <button
                type="button"
                onClick={() => {
                  exportAsVectorPdf(project);
                  notifySuccess('Hoja vectorial preparada para Guardar como PDF.');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-stone-900">
                    Documento PDF / Imprimir
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    Lámina horizontal A4/Carta 100% vectorial sin pérdida
                  </div>
                </div>
              </button>

              {/* JPG 8K */}
              <button
                type="button"
                disabled={busyFormat !== null}
                onClick={() => handleRaster('jpg', '8k')}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileImage className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-stone-900">
                      {busyFormat === 'jpg-8k' ? 'Generando JPG 8K...' : 'JPG 8K Ultra Definición'}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      JPG 8K
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    Fondo sólido cálido con resolución 8K para compartir
                  </div>
                </div>
              </button>

              {/* HTML Interactivo */}
              <button
                type="button"
                onClick={() => {
                  exportAsInteractiveHtml(project);
                  notifySuccess('Visor web HTML interactivo descargado.');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-stone-900">
                    Página HTML Interactiva (.HTML)
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Abre el mapa con zoom y paneo en cualquier navegador sin internet
                  </div>
                </div>
              </button>

              {/* Respaldo JSON Editable */}
              <button
                type="button"
                onClick={() => {
                  exportAsJsonFile(project);
                  notifySuccess('Proyecto editable (.synapse.json) descargado.');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-stone-900">
                    Archivo de Proyecto (.JSON)
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Copia de seguridad completa para volver a importar y editar
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Barra inferior Markdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-stone-600" />
              <span className="text-xs font-bold text-stone-700">
                Esquema de Texto Jerárquico (Markdown / Notion / Obsidian)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(convertProjectToMarkdown(project));
                  setCopiedMd(true);
                  setTimeout(() => setCopiedMd(false), 2200);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-xs font-bold text-stone-700 transition-colors"
              >
                {copiedMd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  exportAsMarkdownFile(project);
                  notifySuccess('Esquema Markdown (.md) descargado.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .MD</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
