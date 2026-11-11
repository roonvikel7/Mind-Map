import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Globe2,
  QrCode,
  Radio,
  RefreshCw,
  Share2,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { OrganizerProject } from '../types/organizer';
import {
  buildShareUrl,
  CollaborationStatus,
  getMyCollaboratorInfo,
} from '../utils/collaboration';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: OrganizerProject | null;
  collabStatus: CollaborationStatus;
  activeCollaboratorsCount: number;
  onEnsureShareRoom: () => Promise<string>;
  onRegenerateShareRoom: () => Promise<string>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  collabStatus,
  activeCollaboratorsCount,
  onEnsureShareRoom,
  onRegenerateShareRoom,
}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const myInfo = getMyCollaboratorInfo();

  useEffect(() => {
    if (!isOpen || !project) return;

    let mounted = true;
    setLoading(true);

    const initUrl = async () => {
      try {
        let roomId = project.shareRoomId;
        if (!roomId) {
          roomId = await onEnsureShareRoom();
        }
        if (mounted && roomId) {
          const url = await buildShareUrl(project, roomId);
          setShareUrl(url);

          // Generar código QR de alta resolución
          try {
            const qr = await QRCode.toDataURL(url, {
              width: 320,
              margin: 2,
              color: {
                dark: '#1c1917',
                light: '#ffffff',
              },
            });
            if (mounted) setQrDataUrl(qr);
          } catch (qrErr) {
            console.warn('Error generando QR:', qrErr);
          }
        }
      } catch (err) {
        console.warn('Error preparando enlace compartido:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initUrl();

    return () => {
      mounted = false;
    };
  }, [isOpen, project?.shareRoomId, project?.id]);

  if (!isOpen || !project) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback para navegadores antiguos
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: `Editar mapa: ${project.title}`,
          text: `Te comparto este mapa conceptual para editarlo juntos en tiempo real:`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleNewRoom = async () => {
    setLoading(true);
    try {
      const newRoom = await onRegenerateShareRoom();
      const newUrl = await buildShareUrl(project, newRoom);
      setShareUrl(newUrl);
      const qr = await QRCode.toDataURL(newUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#1c1917', light: '#ffffff' },
      });
      setQrDataUrl(qr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="ios-modal-backdrop fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="ios-modal-card w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabecera estilo iOS */}
        <div className="px-5 py-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                Compartir y Editar en Varios Dispositivos
              </h3>
              <p className="text-[11px] text-stone-500">
                Colaboración en tiempo real con enlace único
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Tarjeta de estado de conexión en vivo */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${
                    collabStatus === 'connected'
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                      : collabStatus === 'connecting' || collabStatus === 'reconnecting'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-stone-400'
                  }`}
                />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <span>
                    {collabStatus === 'connected'
                      ? 'Sincronización en vivo activa'
                      : collabStatus === 'connecting'
                      ? 'Conectando sala...'
                      : collabStatus === 'reconnecting'
                      ? 'Reconectando sala...'
                      : 'Sala sin conexión'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    En vivo
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-stone-400" />
                  <span>
                    {activeCollaboratorsCount > 1
                      ? `${activeCollaboratorsCount} dispositivos conectados ahora`
                      : '1 dispositivo conectado (tú)'}
                  </span>
                  <span>•</span>
                  <span>Tu alias: <strong>{myInfo.name}</strong></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNewRoom}
              disabled={loading}
              title="Generar un nuevo enlace único de sala"
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Enlace único para compartir */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-orange-600" />
                Enlace Único de Edición
              </label>
              {shareUrl && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  ⚡ Corto ({shareUrl.length} letras)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono text-stone-700 break-all select-all font-medium">
                {shareUrl || 'Generando enlace único corto...'}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!shareUrl || loading}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10.5px] text-stone-500">
              Ocupa menos de una línea. Cualquiera que abra este enlace podrá editar contigo al instante.
            </p>
          </div>

          {/* Botones de acción rápida: Escaneo móvil QR y Compartir nativo */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowQr(prev => !prev)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                showQr
                  ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-xs'
                  : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <QrCode className="w-4 h-4 text-orange-600" />
              <span>{showQr ? 'Ocultar Código QR' : 'Abrir con Celular (QR)'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all"
            >
              <Smartphone className="w-4 h-4 text-orange-600" />
              <span>Enviar por App</span>
            </button>
          </div>

          {/* Visualizador de Código QR */}
          {showQr && qrDataUrl && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col items-center gap-2 animate-in fade-in duration-150">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-200">
                <img
                  src={qrDataUrl}
                  alt="Código QR para editar en celular"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg"
                />
              </div>
              <p className="text-[11px] text-stone-600 text-center max-w-xs font-medium">
                Apunta con la cámara de tu teléfono móvil o tablet para abrir el mapa y empezar a editar en vivo.
              </p>
            </div>
          )}

          {/* Guía informativa de funcionamiento */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11.5px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>💡 ¿Cómo funciona la edición compartida?</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-0.5">
              <li>
                <strong>Edición simultánea:</strong> Las personas conectadas al enlace verán los cambios en tiempo real al mover cuadros o editar texto.
              </li>
              <li>
                <strong>Edición asíncrona:</strong> Si alguien abre el enlace más tarde, el mapa se cargará completo y guardará sus cambios en la misma sala.
              </li>
              <li>
                <strong>100% Gratis:</strong> Opera sin servidores costosos ni suscripciones, sincronizado a través de WebSockets seguros.
              </li>
            </ul>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="px-5 py-3.5 bg-stone-50/90 border-t border-stone-200/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
