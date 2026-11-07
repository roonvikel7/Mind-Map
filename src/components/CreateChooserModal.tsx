import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  GitBranch,
  GitFork,
  HelpCircle,
  Network,
  Sparkles,
  Workflow,
  X,
  ArrowRight,
} from 'lucide-react';
import { OrganizerType } from '../types/organizer';
import { ORGANIZER_TYPES_META } from '../utils/themes';

interface CreateChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: OrganizerType;
  currentTitle: string;
  onConfirm: (title: string, type: OrganizerType) => void;
}

export const CreateChooserModal: React.FC<CreateChooserModalProps> = ({
  isOpen,
  onClose,
  currentType,
  currentTitle,
  onConfirm,
}) => {
  const [selectedType, setSelectedType] = useState<OrganizerType>(currentType || 'mindmap');
  const [title, setTitle] = useState(currentTitle || 'Idea Central');
  const modalBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(currentType || 'mindmap');
      setTitle(currentTitle && currentTitle !== 'Idea Central' ? currentTitle : '');
    }
  }, [isOpen, currentType, currentTitle]);

  // Cierre inmediato con la tecla Escape o al hacer click afuera
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
    const finalTitle = title.trim() || 'Idea Central';
    onConfirm(finalTitle, selectedType);
    onClose();
  };

  const handleSelectTypeAndSubmit = (type: OrganizerType) => {
    setSelectedType(type);
    const finalTitle = title.trim() || 'Idea Central';
    onConfirm(finalTitle, type);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        ref={modalBoxRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl bg-white border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        {/* Cabecera Cálida */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-amber-50/90 to-orange-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-800">
                ¿Qué deseas crear hoy?
              </h2>
              <p className="text-xs text-stone-500">
                Escribe tu título y elige el tipo de organizador visual que prefieras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar (o haz clic afuera)"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Campo para el título central */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Título o Idea Central
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. El Tahuantinsuyo, Inteligencia Artificial, Plan Estratégico..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none text-sm font-bold text-stone-800 bg-stone-50/60 transition-all placeholder:text-stone-400 placeholder:font-normal"
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Aparecerá en el centro del lienzo como la forma principal de tu mapa.
            </p>
          </div>

          {/* Selector de los 9 tipos de organizadores */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              Escoge el tipo de organizador visual:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
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

                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10.5px] font-bold text-orange-600">
                      <span>Seleccionar</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pie de acción */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Haz clic afuera o presiona Esc para cerrar en cualquier momento
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>Comenzar a Crear</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
