import React, { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';

interface EdgeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  edgeId: string | null;
  currentLabel: string;
  onSave: (edgeId: string, label: string) => void;
}

const QUICK_CONNECTOR_WORDS = [
  'produce',
  'comprende',
  'requiere',
  'impulsa',
  'depende de',
  'se clasifica en',
  'Sí',
  'No',
];

export const EdgeLabelModal: React.FC<EdgeLabelModalProps> = ({
  isOpen,
  onClose,
  edgeId,
  currentLabel,
  onSave,
}) => {
  const [label, setLabel] = useState(currentLabel);

  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel]);

  if (!isOpen || !edgeId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(edgeId, label.trim());
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white border border-stone-200 edraw-panel-shadow overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-extrabold text-stone-800">
              Etiqueta o Proposición del Conector
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej. se divide en, genera, impulsa..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-xs font-semibold text-stone-800"
            />
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {QUICK_CONNECTOR_WORDS.map(word => (
                <button
                  key={word}
                  type="button"
                  onClick={() => setLabel(word)}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-[11px] font-semibold text-stone-600"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                onSave(edgeId, '');
                onClose();
              }}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Limpiar etiqueta
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
