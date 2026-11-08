import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, LayoutTemplate, Sparkles, X } from 'lucide-react';
import { OrganizerType } from '../types/organizer';
import { ORGANIZER_TYPES_META } from '../utils/themes';
import { getDefaultTitleForType } from '../utils/templates';

interface CreateChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: OrganizerType;
  currentTitle: string;
  onConfirm: (title: string, type: OrganizerType) => void;
  onOpenTemplates?: () => void;
}

export const CreateChooserModal: React.FC<CreateChooserModalProps> = ({
  isOpen,
  onClose,
  currentType,
  currentTitle,
  onConfirm,
  onOpenTemplates,
}) => {
  const [selectedType, setSelectedType] = useState<OrganizerType>(currentType || 'mindmap');
  const [title, setTitle] = useState(currentTitle || 'Idea Central');
  const modalBoxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(currentType || 'mindmap');
      setTitle(currentTitle && currentTitle !== 'Idea Central' ? currentTitle : '');
      // En escritorio enfocar el título automáticamente; en celular evitar abrir el teclado de golpe
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
  }, [isOpen, currentType, currentTitle]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || getDefaultTitleForType(selectedType);
    onConfirm(finalTitle, selectedType);
    onClose();
  };

  const handleSelectTypeAndSubmit = (type: OrganizerType) => {
    setSelectedType(type);
    const finalTitle = title.trim() || getDefaultTitleForType(type);
    onConfirm(finalTitle, type);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/35 flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        ref={modalBoxRef}
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-4xl rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh] shadow-2xl"
      >
        {/* Cabecera Cálida */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-50/90 to-orange-50/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-stone-800 truncate">
                ¿Qué deseas crear hoy?
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">
                Escribe tu título y elige cualquiera de los 12 motores visuales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenTemplates && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTemplates();
                }}
                className="ios-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-stone-200/90 hover:border-orange-300 text-xs font-bold text-stone-800 shadow-2xs"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-orange-600" />
                <span>Ver Plantillas</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Cerrar (o haz clic afuera)"
              className="ios-btn p-2 rounded-full bg-white/80 text-stone-400 hover:text-stone-700 hover:bg-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Campo para el título central */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              Título o Idea Central
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. El Tahuantinsuyo, Inteligencia Artificial, Plan Estratégico..."
              className="w-full px-3.5 sm:px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none text-base sm:text-sm font-bold text-stone-800 bg-stone-50/60 transition-all placeholder:text-stone-400 placeholder:font-normal"
            />
            <p className="text-[11px] text-stone-400">
              Se creará automáticamente con la estructura lista, nodos y cuadros para escribir directamente.
            </p>
          </div>

          {/* Selector de los 9 tipos de organizadores */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              Escoge el tipo de organizador visual:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
              {ORGANIZER_TYPES_META.map(item => {
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleSelectTypeAndSubmit(item.type)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-orange-50/90 border-orange-400 ring-2 ring-orange-200 shadow-sm'
                        : 'bg-white border-stone-200/90 hover:bg-stone-50/80 hover:border-orange-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl">{item.emoji}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white">
                            Activo
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-stone-800 group-hover:text-orange-700 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[10.5px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10.5px] font-bold text-orange-600">
                      <span>Seleccionar</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pie de acción */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 hidden md:inline">
              Haz clic afuera o presiona Esc para ir directo al lienzo
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 sm:px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>Crear con Estructura Lista</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
