import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, KeyRound, Loader2, Settings, Sparkles, X } from 'lucide-react';
import { ApiSettings, loadApiSettings, saveApiSettings } from '../utils/storage';
import { testGeminiApiKey } from '../utils/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<ApiSettings>({
    geminiApiKey: '',
    openaiApiKey: '',
    defaultProvider: 'local',
  });
  const [saved, setSaved] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadApiSettings();
      setSettings(loaded);
      setSaved(false);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestGemini = async () => {
    if (!settings.geminiApiKey.trim()) {
      setTestResult({
        success: false,
        msg: 'Por favor escribe o pega primero tu clave de API de Gemini.',
      });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(
        settings.geminiApiKey,
        settings.geminiTier || 'pro'
      );
      if (res.success) {
        setTestResult({
          success: true,
          msg: `¡Conexión verificada con Google Gemini (${res.model}${res.isPro ? ' • Versión Pro Activa' : ''})!`,
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveProvider = settings.geminiApiKey.trim()
      ? 'gemini'
      : settings.defaultProvider;
    const toSave: ApiSettings = {
      ...settings,
      defaultProvider: effectiveProvider,
    };
    saveApiSettings(toSave);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 850);
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
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-stone-200/80 text-stone-700 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-stone-800 truncate">
                Configuración del Motor IA
              </h3>
              <p className="text-[11px] text-stone-500 line-clamp-1">
                Funciona local o conectado a Google Gemini / OpenAI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Proveedor Predeterminado
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'local', label: 'Motor Local Instantáneo' },
                  { id: 'gemini', label: 'Google Gemini API' },
                  { id: 'openai', label: 'OpenAI GPT-4o' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setSettings(s => ({ ...s, defaultProvider: opt.id }))
                  }
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    settings.defaultProvider === opt.id
                      ? 'bg-orange-50 border-orange-400 text-orange-900'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {settings.defaultProvider === 'gemini' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>Clave de API de Google Gemini</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 underline"
                >
                  <span>Obtener clave gratis</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={e => {
                    setSettings(s => ({ ...s, geminiApiKey: e.target.value }));
                    setTestResult(null);
                  }}
                  placeholder="Pega aquí tu clave de Gemini..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-base sm:text-xs font-mono"
                />
                <button
                  type="button"
                  disabled={testingKey || !settings.geminiApiKey.trim()}
                  onClick={handleTestGemini}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100/90 border border-orange-200 text-orange-950 text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-orange-50 shrink-0"
                >
                  {testingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      <span>Probar Conexión</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-semibold ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {testResult.msg}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Versión / Nivel de tu Plan Gemini
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, geminiTier: 'pro' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      (settings.geminiTier ?? 'pro') === 'pro'
                        ? 'bg-amber-50/90 border-amber-400 text-amber-950 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>👑 Versión Pro</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-extrabold">Plan Pro</span>
                    </div>
                    <p className="text-[10.5px] text-stone-500 mt-1 leading-snug">
                      gemini-2.5-pro y gemini-1.5-pro con razonamiento avanzado y profundidad profesional.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, geminiTier: 'flash' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.geminiTier === 'flash'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 ring-2 ring-orange-400/20 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>⚡ Versión Flash</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 font-semibold">Rápido</span>
                    </div>
                    <p className="text-[10.5px] text-stone-500 mt-1 leading-snug">
                      gemini-2.5-flash optimizado para velocidad instantánea en milisegundos.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {settings.defaultProvider === 'openai' && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1">
                <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                <span>Clave de API de OpenAI</span>
              </label>
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={e =>
                  setSettings(s => ({ ...s, openaiApiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-base sm:text-xs"
              />
            </div>
          )}

          <p className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
            Tus claves se almacenan únicamente en el navegador local de tu equipo y nunca se envían a terceros.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guardado</span>
                </>
              ) : (
                <span>Guardar Preferencias</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
