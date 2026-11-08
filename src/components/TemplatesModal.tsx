import React, { useMemo, useState } from 'react';
import { ArrowRight, LayoutTemplate, Plus, Search, Sparkles, X } from 'lucide-react';
import {
  TEMPLATE_CARDS,
  TEMPLATE_CATEGORY_META,
  TemplateCard,
  TemplateCategory,
} from '../utils/templates';
import { EDRAW_THEMES } from '../utils/themes';
import { TemplateThumbnail } from './TemplateThumbnail';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (card: TemplateCard) => void;
  onCreateBlank?: () => void;
  onOpenAiGenerator?: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateBlank,
  onOpenAiGenerator,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TEMPLATE_CARDS.filter(card => {
      const matchCat =
        activeCategory === 'all' || card.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.badge.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/35 flex items-center justify-center p-2 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-5xl rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-200/90 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Cabecera estilo EdrawMax + iOS */}
        <div className="px-4 pt-3.5 pb-3 sm:px-6 sm:pt-5 sm:pb-3.5 border-b border-stone-200/70 bg-gradient-to-r from-stone-50/95 via-amber-50/40 to-orange-50/50 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                <LayoutTemplate className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900 truncate">
                  Centro de Plantillas Profesionales
                </h2>
                <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">
                  {TEMPLATE_CARDS.length} plantillas calibradas sin colisiones y 12 motores estructurales
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenAiGenerator && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAiGenerator();
                  }}
                  className="ios-btn hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200/90 text-xs font-bold text-orange-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Crear con IA</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                title="Cerrar galería"
                className="ios-btn p-2 rounded-full bg-stone-100/90 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Buscador + Categorías desplazables sin desbordar */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
            <div className="relative md:w-72 shrink-0">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar diagrama o plantilla..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-stone-200/90 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-base sm:text-xs font-medium text-stone-800 placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-1">
              {TEMPLATE_CATEGORY_META.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`ios-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-all ${
                      active
                        ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                        : 'bg-white/90 border-stone-200/90 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cuadrícula de Plantillas */}
        <div className="p-3.5 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Tarjeta "+ Dibujo en blanco" estilo EdrawMax */}
          {onCreateBlank && !searchQuery.trim() && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateBlank();
              }}
              className="ios-btn group flex flex-col justify-between p-3.5 rounded-2xl border-2 border-dashed border-stone-300 hover:border-orange-400 bg-stone-50/50 hover:bg-orange-50/30 text-left transition-all"
            >
              <div>
                <div className="w-full h-28 rounded-xl bg-white border border-stone-200/80 flex flex-col items-center justify-center gap-1.5 mb-3 group-hover:border-orange-200 transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-500 group-hover:text-orange-700">
                    Lienzo nuevo a medida
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200/70 text-[10.5px] font-bold text-stone-700 mb-1.5">
                  ✨ 12 estructuras disponibles
                </span>
                <h3 className="text-sm font-extrabold text-stone-800 group-hover:text-orange-700">
                  Dibujo en blanco
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Escribe tu idea central y elige cualquiera de los 12 motores visuales para empezar desde cero.
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200/70 text-[11px] font-bold text-orange-600">
                <span>Personalizado</span>
                <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Crear en blanco <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          )}

          {filteredCards.map(card => {
            const themeObj = EDRAW_THEMES[card.theme] || EDRAW_THEMES['vitality-warm'];
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(card);
                  onClose();
                }}
                className="ios-btn group flex flex-col justify-between p-3.5 rounded-2xl border border-stone-200/90 hover:border-orange-300 bg-white hover:bg-orange-50/15 text-left transition-all shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="mb-3">
                    <TemplateThumbnail
                      type={card.type}
                      theme={card.theme}
                      title={card.title}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-900 truncate">
                      <span>{card.icon}</span>
                      <span className="truncate">{card.badge}</span>
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {themeObj.palette.slice(0, 4).map((c, idx) => (
                        <span
                          key={idx}
                          style={{ backgroundColor: c }}
                          className="w-2 h-2 rounded-full"
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-[13px] font-extrabold text-stone-800 group-hover:text-orange-700 transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[11.5px] text-stone-500 mt-1 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 text-[11px] font-bold text-orange-600">
                  <span className="truncate text-stone-500 font-semibold">
                    {themeObj.name}
                  </span>
                  <span className="inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                    Usar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="col-span-full py-10 text-center space-y-2">
              <p className="text-sm font-bold text-stone-700">
                No encontramos plantillas para «{searchQuery}»
              </p>
              <p className="text-xs text-stone-500">
                Prueba otra palabra clave o genera un organizador sobre ese tema con IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
