import React from 'react';
import { LayoutTemplate, ArrowRight, X } from 'lucide-react';
import { TEMPLATE_CARDS, TemplateCard } from '../utils/templates';
import { EDRAW_THEMES } from '../utils/themes';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (card: TemplateCard) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl bg-white border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[88vh]"
      >
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-800">
                Galería de Plantillas Profesionales EdrawMax
              </h2>
              <p className="text-xs text-stone-500">
                8 estructuras geométricas listas con conexiones calibradas y temas cálidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {TEMPLATE_CARDS.map(card => {
            const themeObj = EDRAW_THEMES[card.theme];
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(card);
                  onClose();
                }}
                className="group flex flex-col justify-between p-4 rounded-2xl border border-stone-200/90 hover:border-orange-300 bg-white hover:bg-orange-50/30 text-left transition-all shadow-sm hover:shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[10.5px] font-bold text-amber-800">
                      <span>{card.icon}</span>
                      <span>{card.badge}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {themeObj.palette.slice(0, 4).map((c, idx) => (
                        <span
                          key={idx}
                          style={{ backgroundColor: c }}
                          className="w-2.5 h-2.5 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold text-stone-800 group-hover:text-orange-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100 text-[11px] font-bold text-orange-600">
                  <span>Tema: {themeObj.name}</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Usar plantilla <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
