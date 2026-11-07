import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  KeyRound,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { OrganizerType } from '../types/organizer';
import { ORGANIZER_TYPES_META } from '../utils/themes';
import { loadApiSettings, saveApiSettings } from '../utils/storage';
import { testGeminiApiKey } from '../utils/aiService';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    topic: string,
    type: OrganizerType,
    details?: string,
    depth?: 'standard' | 'deep'
  ) => Promise<void>;
}

const SUGGESTED_TOPICS = [
  { label: 'Administración Financiera', type: 'cartographic' as OrganizerType },
  { label: 'Inteligencia Artificial', type: 'mindmap' as OrganizerType },
  { label: 'Los Géneros Literarios', type: 'synoptic' as OrganizerType },
  { label: 'Retraso en Entrega de Software', type: 'fishbone' as OrganizerType },
  { label: 'La Fotosíntesis', type: 'concept' as OrganizerType },
  { label: 'Hoja de Ruta 2026', type: 'timeline' as OrganizerType },
];

export const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [topic, setTopic] = useState('');
  const [selectedType, setSelectedType] = useState<OrganizerType>('mindmap');
  const [details, setDetails] = useState('');
  const [depth, setDepth] = useState<'standard' | 'deep'>('deep');
  const [loading, setLoading] = useState(false);

  // Estado de clave y conexión de Google Gemini
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const settings = loadApiSettings();
      setGeminiApiKey(settings.geminiApiKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!geminiApiKey.trim()) {
      setTestResult({
        success: false,
        msg: 'Ingresa primero una clave de Google Gemini para probar.',
      });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(geminiApiKey);
      if (res.success) {
        if (res.model) setActiveModel(res.model);
        setTestResult({
          success: true,
          msg: `¡Clave verificada con éxito (${res.model})!`,
        });
        const current = loadApiSettings();
        saveApiSettings({
          ...current,
          geminiApiKey: geminiApiKey.trim(),
          defaultProvider: 'gemini',
        });
      } else {
        setTestResult({
          success: false,
          msg: `Error: ${res.error || 'No se pudo conectar.'}`,
        });
      }
    } finally {
      setTestingKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (geminiApiKey.trim()) {
      const current = loadApiSettings();
      saveApiSettings({
        ...current,
        geminiApiKey: geminiApiKey.trim(),
        defaultProvider: 'gemini',
      });
    }

    setLoading(true);
    try {
      await onGenerate(
        topic.trim(),
        selectedType,
        details.trim() || undefined,
        depth
      );
      setTopic('');
      setDetails('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh]"
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-2 bg-gradient-to-r from-orange-50/90 to-amber-50/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-stone-800 truncate">
                Generador Inteligente de Organizadores
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">
                Crea mapas estructurados desde una idea o pegando tus apuntes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white/70 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Tarjeta de Estado del Motor de IA (Google Gemini) */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    geminiApiKey.trim()
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-xs font-bold text-stone-800 truncate">
                  {geminiApiKey.trim()
                    ? 'Google Gemini API Conectado'
                    : 'Motor Semántico Local'}
                </span>
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-white text-stone-600 font-semibold border border-stone-200">
                  {geminiApiKey.trim() ? activeModel : 'Autónomo'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyConfig(v => !v)}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-700 hover:text-orange-900 ml-auto"
              >
                <span>
                  {geminiApiKey.trim() ? 'Clave API' : 'Conectar Gemini'}
                </span>
                {showKeyConfig ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {showKeyConfig && (
              <div className="mt-3 pt-3 border-t border-orange-200/60 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-orange-600" />
                    <span>Clave de API de Google Gemini</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10.5px] font-semibold text-orange-600 hover:text-orange-700 underline"
                  >
                    <span>Obtener clave gratis</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={e => {
                      setGeminiApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="Pega aquí tu clave de Gemini..."
                    className="flex-1 px-3 py-2 sm:py-1.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs font-mono bg-white"
                  />
                  <button
                    type="button"
                    disabled={testingKey || !geminiApiKey.trim()}
                    onClick={handleTestKey}
                    className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-orange-200 text-orange-950 text-xs font-bold transition-all disabled:opacity-40 shrink-0"
                  >
                    {testingKey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                        <span>Probando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                        <span>Probar Clave</span>
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2 rounded-xl border text-[11px] font-semibold ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {testResult.msg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tema Central */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ¿Sobre qué tema deseas construir tu organizador?
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ej. Revolución Industrial, Plan de Marketing, Ciberseguridad..."
              className="w-full px-3.5 sm:px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none text-base sm:text-sm font-semibold text-stone-800"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_TOPICS.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setTopic(s.label);
                    setSelectedType(s.type);
                  }}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-[11px] font-semibold text-stone-600 transition-colors"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Tipo de Diagrama (Cuadrícula armónica 3x3 en sm+) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Tipo de Estructura Visual
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ORGANIZER_TYPES_META.map(meta => {
                const active = selectedType === meta.type;
                return (
                  <button
                    key={meta.type}
                    type="button"
                    onClick={() => setSelectedType(meta.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-sm'
                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-base sm:text-lg shrink-0">{meta.emoji}</span>
                    <span className="text-[11px] sm:text-[11.5px] font-bold leading-tight">
                      {meta.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Apuntes opcionales o esquema indentado */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-bold text-stone-700">
                Apuntes o Esquema Propio (Opcional)
              </label>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDepth('standard')}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                    depth === 'standard'
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-500'
                  }`}
                >
                  Conciso
                </button>
                <button
                  type="button"
                  onClick={() => setDepth('deep')}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                    depth === 'deep'
                      ? 'bg-white text-orange-700 shadow-sm'
                      : 'text-stone-500'
                  }`}
                >
                  Detallado
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={
                'Déjalo vacío para creación automática con IA, o pega tus apuntes / lista:\n- Rama Principal 1\n  - Subtema A'
              }
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs text-stone-700 resize-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Construyendo Mapa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Organizador</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
