import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { OrganizerNode, OrganizerProject } from '../types/organizer';
import { generateStandaloneSvg } from '../utils/exporter';
import { getThemeConfig, PRIORITY_BADGES } from '../utils/themes';

interface PresentationViewProps {
  isOpen: boolean;
  onClose: () => void;
  project: OrganizerProject;
}

interface SlideItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  color: string;
  notes?: string;
  priority?: number;
  progress?: number;
  children: OrganizerNode[];
  isOverview?: boolean;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [step, setStep] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const theme = getThemeConfig(project.theme);

  const slides = useMemo<SlideItem[]>(() => {
    if (!isOpen) return [];
    const root =
      project.nodes.find(n => n.isRoot) ||
      project.nodes.find(n => !n.parentId) ||
      project.nodes[0];
    if (!root) return [];

    const mainBranches = project.nodes.filter(n => n.parentId === root.id);
    const list: SlideItem[] = [
      {
        id: 'overview',
        title: project.title,
        subtitle: 'Panorama Completo del Organizador',
        icon: root.icon || '💡',
        color: theme.rootBg,
        notes: root.notes,
        children: mainBranches,
        isOverview: true,
      },
    ];

    mainBranches.forEach(branch => {
      const subItems = project.nodes.filter(n => n.parentId === branch.id);
      list.push({
        id: branch.id,
        title: branch.text,
        subtitle: branch.subtitle,
        icon: branch.icon,
        color: branch.color || theme.palette[0],
        notes: branch.notes,
        priority: branch.priority,
        progress: branch.progress,
        children: subItems,
      });
    });

    return list;
  }, [isOpen, project, theme]);

  const svgPreview = useMemo(() => {
    if (!isOpen) return '';
    const { svg } = generateStandaloneSvg(project, {
      transparentBg: false,
      includeGrid: false,
      includeHeader: false,
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [isOpen, project]);

  useEffect(() => {
    setStep(0);
  }, [isOpen, project.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        setStep(s => Math.min(slides.length - 1, s + 1));
      } else if (e.key === 'ArrowLeft') {
        setStep(s => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, slides.length]);

  if (!isOpen || slides.length === 0) return null;

  const current = slides[Math.min(step, slides.length - 1)];

  return (
    <div
      style={{ backgroundColor: theme.canvasBg }}
      className="fixed inset-0 z-50 h-[100dvh] flex flex-col select-none"
      onTouchStart={e => {
        const t = e.touches[0];
        if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={e => {
        if (!touchStartRef.current) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - touchStartRef.current.x;
        const dy = t.clientY - touchStartRef.current.y;
        touchStartRef.current = null;
        if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          if (dx < 0) {
            setStep(s => Math.min(slides.length - 1, s + 1));
          } else {
            setStep(s => Math.max(0, s - 1));
          }
        }
      }}
    >
      {/* Cabecera limpia responsiva */}
      <div className="h-14 px-3 sm:px-6 border-b border-stone-200/80 bg-white/85 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] sm:text-xs font-extrabold shrink-0">
            {step + 1} / {slides.length}
          </span>
          <span className="text-xs sm:text-sm font-bold text-stone-800 truncate">
            {project.title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shrink-0"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Salir (Esc)</span>
          <span className="sm:hidden">Salir</span>
        </button>
      </div>

      {/* Cuerpo de presentación */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
        {current.isOverview ? (
          <div className="w-full max-w-6xl h-full flex flex-col items-center justify-center gap-3">
            <img
              src={svgPreview}
              alt={project.title}
              className="max-h-[70dvh] max-w-full object-contain rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-2 sm:p-3 edraw-panel-shadow"
            />
            <span className="sm:hidden text-[11px] text-stone-400 font-medium">
              Desliza a la izquierda para recorrer cada rama
            </span>
          </div>
        ) : (
          <div className="w-full max-w-3xl rounded-2xl sm:rounded-3xl bg-white border border-stone-200/90 edraw-panel-shadow p-5 sm:p-8 md:p-10 space-y-5 my-auto">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{ backgroundColor: current.color }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center text-xl sm:text-2xl shadow-sm shrink-0"
                >
                  {current.icon || '📌'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-extrabold text-stone-900 break-words">
                    {current.title}
                  </h2>
                  {current.subtitle && (
                    <p className="text-xs sm:text-sm font-medium text-stone-500 mt-0.5">
                      {current.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {current.priority && PRIORITY_BADGES[current.priority] && (
                  <span
                    style={{
                      backgroundColor: PRIORITY_BADGES[current.priority].bg,
                      color: '#FFF',
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-extrabold"
                  >
                    {PRIORITY_BADGES[current.priority].label}
                  </span>
                )}
                {current.progress !== undefined && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    {current.progress}% completado
                  </span>
                )}
              </div>
            </div>

            {current.notes && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs sm:text-sm text-stone-700 leading-relaxed">
                {current.notes}
              </div>
            )}

            {current.children.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                {current.children.map(sub => (
                  <div
                    key={sub.id}
                    style={{ borderLeftColor: current.color }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/90 border border-stone-200/80 border-l-4"
                  >
                    <div className="flex items-center gap-2 font-bold text-stone-800 text-xs sm:text-sm">
                      {sub.icon && <span>{sub.icon}</span>}
                      <span>{sub.text}</span>
                    </div>
                    {sub.subtitle && (
                      <div className="text-xs text-stone-500 mt-1">
                        {sub.subtitle}
                      </div>
                    )}
                    {sub.notes && (
                      <div className="text-xs text-stone-600 mt-1.5">
                        {sub.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-stone-400 italic">
                Rama enfocada sin subtemas adicionales.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Controles inferiores */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 bg-white/90 border-t border-stone-200/80 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setStep(0)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Panorama</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 text-xs font-bold text-stone-700"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            type="button"
            disabled={step >= slides.length - 1}
            onClick={() => setStep(s => Math.min(slides.length - 1, s + 1))}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-xs font-bold text-white"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-stone-400 hidden md:block">
          Usa las flechas ← → o desliza para avanzar
        </div>
      </div>
    </div>
  );
};
