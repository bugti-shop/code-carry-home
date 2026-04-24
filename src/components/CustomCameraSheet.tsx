/**
 * CustomCameraSheet — A beautiful, in-app fullscreen camera UI used by the
 * "Scan tasks from photo" flow. Replaces the OS-default camera picker with a
 * branded experience: scan-frame corners, flash toggle, gallery picker, and a
 * large shutter button.
 *
 * Uses getUserMedia on both web and native (Capacitor WebView supports it on
 * Android/iOS when camera permission is granted). Falls back gracefully if the
 * stream cannot be opened.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Zap, ZapOff, RotateCcw, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { compressImage } from '@/utils/imageCompression';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  onPickGallery?: () => void;
  title?: string;
}

const COMPRESS_OPTS = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.85 as const,
  mimeType: 'image/jpeg' as const,
};

export const CustomCameraSheet = ({
  isOpen,
  onClose,
  onCapture,
  onPickGallery,
  title,
}: Props) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashAnim, setFlashAnim] = useState(false);

  const stopStream = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((tr) => {
        try { tr.stop(); } catch { /* ignore */ }
      });
    }
    streamRef.current = null;
    setIsReady(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startStream = useCallback(async (mode: 'environment' | 'user') => {
    setError(null);
    setIsReady(false);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => { /* ignore autoplay errors */ });
      }
      // Detect torch support on the video track
      const track = stream.getVideoTracks()[0];
      const caps: any = (track && (track.getCapabilities?.() || {})) || {};
      setTorchSupported(Boolean(caps.torch));
      setIsReady(true);
    } catch (e: any) {
      console.error('[CustomCamera] getUserMedia failed', e);
      setError(
        e?.name === 'NotAllowedError'
          ? t('camera.permissionDenied', 'Camera permission denied')
          : t('camera.unavailable', 'Camera unavailable on this device'),
      );
    }
  }, [stopStream, t]);

  // Open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      startStream(facing);
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleFacing = async () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    await startStream(next);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (!track) return;
    try {
      const newVal = !torchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: newVal }] });
      setTorchOn(newVal);
    } catch (e) {
      console.warn('[CustomCamera] torch toggle failed', e);
      toast.error(t('camera.torchFailed', 'Flash not available'));
    }
  };

  const handleShutter = async () => {
    if (!isReady || isCapturing) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setIsCapturing(true);
    setFlashAnim(true);
    setTimeout(() => setFlashAnim(false), 180);
    try {
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas context unavailable');
      ctx.drawImage(video, 0, 0, w, h);
      const raw = canvas.toDataURL('image/jpeg', 0.9);
      const compressed = await compressImage(raw, COMPRESS_OPTS).catch(() => raw);
      stopStream();
      onCapture(compressed);
    } catch (e) {
      console.error('[CustomCamera] capture failed', e);
      toast.error(t('camera.captureFailed', 'Could not take photo'));
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col" style={{ paddingTop: 'var(--safe-top, 0px)', paddingBottom: 'var(--safe-bottom, 0px)' }}>
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          aria-label={t('common.close', 'Close')}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-medium">{title || t('camera.scanner', 'Scanner')}</h2>
        <button
          onClick={toggleTorch}
          disabled={!torchSupported}
          className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
          aria-label={t('camera.flash', 'Flash')}
        >
          {torchOn ? <Zap className="h-5 w-5 text-yellow-300" /> : <ZapOff className="h-5 w-5" />}
        </button>
      </div>

      {/* Camera preview */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Scan frame corners */}
        {isReady && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative" style={{ width: 'min(78vw, 360px)', height: 'min(78vw, 360px)' }}>
              {/* Top-left */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
              {/* Top-right */}
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isReady && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <Loader2 className="h-7 w-7 animate-spin" />
            <span className="text-sm">{t('camera.starting', 'Starting camera…')}</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-base text-white/90">{error}</p>
            <button
              onClick={() => startStream(facing)}
              className="mt-2 px-5 py-2 rounded-full bg-white text-black text-sm font-medium"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}

        {/* Shutter flash overlay */}
        {flashAnim && <div className="absolute inset-0 bg-white animate-pulse pointer-events-none" />}

        {/* Hint pill (like the reference "Scan food") */}
        {isReady && !error && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 px-4 py-2 rounded-full bg-black/55 backdrop-blur text-xs font-medium text-white/95 pointer-events-none">
            {title || t('camera.scanTasksHint', 'Scan tasks')}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-8 pt-5 pb-6 flex items-center justify-between bg-gradient-to-t from-black to-transparent">
        {/* Gallery */}
        <button
          onClick={() => {
            stopStream();
            onPickGallery?.();
          }}
          disabled={!onPickGallery}
          className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
          aria-label={t('camera.gallery', 'Gallery')}
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        {/* Shutter */}
        <button
          onClick={handleShutter}
          disabled={!isReady || isCapturing}
          aria-label={t('camera.capture', 'Take photo')}
          className="relative w-[78px] h-[78px] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="absolute inset-0 rounded-full border-[3px] border-white" />
          <span className={`block w-[60px] h-[60px] rounded-full bg-white transition-transform ${isCapturing ? 'scale-90' : 'scale-100'}`} />
          {isCapturing && (
            <Loader2 className="absolute h-6 w-6 text-black animate-spin" />
          )}
        </button>

        {/* Flip camera */}
        <button
          onClick={toggleFacing}
          disabled={!isReady}
          className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
          aria-label={t('camera.flip', 'Flip camera')}
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
};
