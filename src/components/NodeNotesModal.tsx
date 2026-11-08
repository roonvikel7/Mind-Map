import React, { useEffect, useState } from 'react';
import { FileText, Link2, Save, X } from 'lucide-react';
import { OrganizerNode } from '../types/organizer';

interface NodeNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: OrganizerNode | null;
  onSave: (nodeId: string, updates: Partial<OrganizerNode>) => void;
}

export const NodeNotesModal: React.FC<NodeNotesModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
}) => {
  const [subtitle, setSubtitle] = useState('');
  const [hyperlink, setHyperlink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (node) {
      setSubtitle(node.subtitle || '');
      setHyperlink(node.hyperlink || '');
      setNotes(node.notes || '');
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(node.id, {
      subtitle: subtitle.trim() || undefined,
      hyperlink: hyperlink.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/35 flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-lg rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh]"
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-stone-800 truncate">
                Ficha y Notas de «{node.text}»
              </h3>
              <p className="text-[11px] text-stone-500 line-clamp-1">
                Enriquece este nodo con contexto, subtítulo o enlace externo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Subtítulo visible bajo el texto
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="Ej. Responsable, Fecha, Resumen breve..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-800"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-stone-700 mb-1">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Hipervínculo o Referencia Web</span>
            </label>
            <input
              type="url"
              value={hyperlink}
              onChange={e => setHyperlink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Notas Explicativas
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Escribe definiciones, fuentes, tareas pendientes o detalles adicionales..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-800 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Ficha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
