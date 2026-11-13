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
import { GeminiTier, testGeminiApiKey } from '../utils/aiService';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    topic: string,
    type: OrganizerType,
    details?: string,
    depth?: 'standard' | 'deep',
    promptMode?: 'prompt' | 'outline'
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

const PROMPT_CHIPS = [
  'Incluye ejemplos reales y casos prácticos',
  'Menciona autores, teorías o fechas clave',
  'Enfoque académico riguroso y bien sustentado',
  'Compara ventajas, límites y retos actuales',
];

const TIER_OPTIONS: Array<{
  id: GeminiTier;
  badge: string;
  title: string;
  subtitle: string;
  tag: string;
  activeClass: string;
  tagClass: string;
}> = [
  {
    id: 'hydrogen',
    badge: '🚀 4 Hydrogen',
    title: '🚀 Gemini 4 Hydrogen',
    subtitle: 'gemini-4-hydrogen. Razonamiento actual con respaldo instantáneo sin bloqueos.',
    tag: 'Nuevo • Predet.',
    activeClass: 'bg-orange-50/95 border-orange-400 text-orange-950 ring-2 ring-orange-400/20 shadow-xs',
    tagClass: 'bg-orange-200/80 text-orange-900',
  },
  {
    id: 'pro',
    badge: '👑 Pro',
    title: '👑 Versión Pro',
    subtitle: 'gemini-3.1-pro-preview y 4-carbon (Plan Pro) con respaldo rápido automático.',
    tag: 'Plan Pro',
    activeClass: 'bg-amber-50/95 border-amber-400 text-amber-950 ring-2 ring-amber-400/20 shadow-xs',
    tagClass: 'bg-amber-200/80 text-amber-900',
  },
  {
    id: 'flash',
    badge: '⚡ Flash 3',
    title: '⚡ Flash 3 Rápido',
    subtitle: 'gemini-3-flash-preview. Máxima velocidad para mapas y borradores inmediatos.',
    tag: 'Rápido',
    activeClass: 'bg-emerald-50/95 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/20 shadow-xs',
    tagClass: 'bg-emerald-100 text-emerald-800',
  },
];

function getTierDisplayModel(tier: GeminiTier): string {
  if (tier === 'pro') return 'gemini-3.1-pro-preview';
  if (tier === 'flash') return 'gemini-3-flash-preview';
  return 'gemini-4-hydrogen';
}

export const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [topic, setTopic] = useState('');
  const [selectedType, setSelectedType] = useState<OrganizerType>('mindmap');
  const [details, setDetails] = useState('');
  const [promptMode, setPromptMode] = useState<'prompt' | 'outline'>('prompt');
  const [depth, setDepth] = useState<'standard' | 'deep'>('deep');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado de clave y conexión de Google Gemini
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiTier, setGeminiTier] = useState<GeminiTier>('hydrogen');
  const [activeModel, setActiveModel] = useState('gemini-4-hydrogen');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const settings = loadApiSettings();
      const loadedTier: GeminiTier = settings.geminiTier || 'hydrogen';
      setGeminiApiKey(settings.geminiApiKey || '');
      setGeminiTier(loadedTier);
      setActiveModel(getTierDisplayModel(loadedTier));
      setTestResult(null);
      setErrorMsg(null);
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
      const res = await testGeminiApiKey(geminiApiKey, geminiTier);
      if (res.success) {
        if (res.model) setActiveModel(res.model);
        setTestResult({
          success: true,
          msg: res.fallbackNote
            ? `Conectado con ${res.model}. ${res.fallbackNote}`
            : `¡Clave verificada con éxito (${res.model}${res.isPro ? ' • Versión Pro Activa' : ''})!`,
        });
        const current = loadApiSettings();
        saveApiSettings({
          ...current,
          geminiApiKey: geminiApiKey.trim(),
          geminiTier,
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

  const handleTierChange = (newTier: GeminiTier) => {
    setGeminiTier(newTier);
    setActiveModel(getTierDisplayModel(newTier));
    setTestResult(null);
    const current = loadApiSettings();
    saveApiSettings({
      ...current,
      geminiTier: newTier,
    });
  };

  const handleAppendChip = (chip: string) => {
    setPromptMode('prompt');
    setDetails(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return chip + '.';
      if (trimmed.toLowerCase().includes(chip.toLowerCase())) return prev;
      return `${trimmed}\n- ${chip}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (geminiApiKey.trim()) {
      const current = loadApiSettings();
      saveApiSettings({
        ...current,
        geminiApiKey: geminiApiKey.trim(),
        geminiTier,
        defaultProvider: 'gemini',
      });
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await onGenerate(
        topic.trim(),
        selectedType,
        details.trim() || undefined,
        depth,
        promptMode
      );
      setTopic('');
      setDetails('');
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'No se pudo completar la generación. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/35 flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-2xl rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-200 edraw-panel-shadow overflow-hidden flex flex-col max-h-[92dvh]"
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
                Define el título arriba y escribe abajo tu prompt e indicaciones para la IA
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
          <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200/80 space-y-2.5">
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
                    ? geminiTier === 'pro'
                      ? '👑 Google Gemini Pro'
                      : geminiTier === 'flash'
                      ? '⚡ Google Gemini 3 Flash'
                      : '🚀 Gemini 4 Hydrogen Activo'
                    : 'Motor Semántico Local'}
                </span>
                <span
                  className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    geminiTier === 'pro'
                      ? 'bg-amber-100/90 text-amber-900 border-amber-300'
                      : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  {geminiApiKey.trim() ? activeModel : 'Autónomo'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyConfig(v => !v)}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-700 hover:text-orange-900 ml-auto"
              >
                <span>
                  {geminiApiKey.trim() ? 'Configurar API' : 'Conectar Gemini'}
                </span>
                {showKeyConfig ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Selector rápido siempre visible de motor Gemini */}
            {geminiApiKey.trim() && (
              <div className="flex flex-wrap items-center gap-1.5">
                {TIER_OPTIONS.map(opt => {
                  const selected =
                    geminiTier === opt.id || (opt.id === 'hydrogen' && geminiTier === 'auto');
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTierChange(opt.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                        selected
                          ? `${opt.activeClass}`
                          : 'bg-white/80 border-stone-200 text-stone-600 hover:bg-white'
                      }`}
                    >
                      {opt.badge}
                    </button>
                  );
                })}
              </div>
            )}

            {showKeyConfig && (
              <div className="pt-2.5 border-t border-orange-200/60 space-y-2">
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

                {/* Selector detallado de versión de Gemini */}
                <div className="pt-1.5">
                  <div className="text-[11px] font-bold text-stone-700 mb-1.5">
                    Detalles de Modelos por Nivel
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {TIER_OPTIONS.map(opt => {
                      const selected =
                        geminiTier === opt.id || (opt.id === 'hydrogen' && geminiTier === 'auto');
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleTierChange(opt.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selected
                              ? opt.activeClass
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 font-bold text-[11.5px]">
                            <span>{opt.title}</span>
                          </div>
                          <span
                            className={`inline-block mt-1 text-[9.5px] px-1.5 py-0.5 rounded-full font-extrabold ${opt.tagClass}`}
                          >
                            {opt.tag}
                          </span>
                          <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                            {opt.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Título del Mapa (Arriba) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <label className="block text-xs font-bold text-stone-700">
                Título o Tema Central del Mapa
              </label>
              <span className="text-[10.5px] font-medium text-stone-400">
                Se colocará en el cuadro central
              </span>
            </div>
            <input
              type="text"
              required
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ej. Fenómeno El Niño, Inteligencia Artificial, Reforma Agraria..."
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

          {/* 2. Selector de Tipo de Diagrama */}
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

          {/* 3. Prompt e Indicaciones para la IA (Abajo) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div>
                <label className="text-xs font-bold text-stone-700 block">
                  {promptMode === 'prompt'
                    ? 'Prompt e Indicaciones para la IA (Qué buscar e incluir)'
                    : 'Esquema Literal o Lista de Viñetas'}
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPromptMode('prompt')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-colors ${
                      promptMode === 'prompt'
                        ? 'bg-white text-orange-700 shadow-sm'
                        : 'text-stone-500'
                    }`}
                  >
                    ✨ Prompt IA
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromptMode('outline')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-colors ${
                      promptMode === 'outline'
                        ? 'bg-white text-stone-800 shadow-sm'
                        : 'text-stone-500'
                    }`}
                  >
                    📝 Esquema
                  </button>
                </div>

                <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg">
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
            </div>

            <textarea
              rows={4}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={
                promptMode === 'prompt'
                  ? 'Escribe aquí tus indicaciones o lo que quieres que la IA investigue e incluya en el mapa.\nEj.: Enfócate en las causas históricas, autores principales, aplicaciones prácticas en Latinoamérica y ejemplos concretos...'
                  : 'Pega tus apuntes con guiones e indentación para convertirlos tal cual:\n- Rama Principal 1\n  - Subtema A'
              }
              className={`w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/70 outline-none text-base sm:text-xs text-stone-700 resize-y leading-relaxed ${
                promptMode === 'outline' ? 'font-mono' : 'font-sans'
              }`}
            />

            {promptMode === 'prompt' && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PROMPT_CHIPS.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAppendChip(chip)}
                    className="px-2 py-0.5 rounded-full bg-orange-50/70 hover:bg-orange-100 text-[10.5px] font-semibold text-orange-800 border border-orange-200/60 transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {errorMsg}
            </div>
          )}

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
                  <span>
                    {promptMode === 'outline'
                      ? 'Estructurando Esquema...'
                      : geminiTier === 'pro'
                      ? 'Construyendo con Gemini Pro...'
                      : geminiTier === 'flash'
                      ? 'Construyendo con Flash 3...'
                      : 'Construyendo con Gemini 4 Hydrogen...'}
                  </span>
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
