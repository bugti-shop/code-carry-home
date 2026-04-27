/**
 * CustomCameraSheet — A beautiful, in-app fullscreen camera UI used by the
 * "Scan tasks from photo" flow. Replaces the OS-default camera picker with a
 * branded experience: scan-frame corners, flash toggle, gallery picker, and a
 * large shutter button.
 *
 * Persistence: last-used facing (front/back), flash state, and HD toggle are
 * remembered across sessions in localStorage so the scanner opens exactly how
 * the user left it.
 *
 * Quality: an HD toggle bumps the requested capture resolution up to ~2560px
 * (when supported) and the saved JPEG to ~1600px so the AI extractor receives
 * sharper text. We also auto-crop the captured frame to the scan-frame box,
 * which both zooms the subject and removes background noise — boosting OCR
 * reliability on small handwriting.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Zap, ZapOff, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import { compressImage } from '@/utils/imageCompression';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { captureImageForAI } from '@/utils/imageCaptureForAI';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  onPickGallery?: () => void;
  title?: string;
}

// localStorage keys for persisted preferences
const LS_FACING = 'customCamera.facing.v1';
const LS_TORCH = 'customCamera.torch.v1';
const LS_HD = 'customCamera.hd.v1';

type Facing = 'environment' | 'user';

const readPref = <T,>(key: string, fallback: T, parse: (s: string) => T): T => {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return parse(v);
  } catch {
    return fallback;
  }
};

const writePref = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
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
  const frameRef = useRef<HTMLDivElement | null>(null);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);

  // Persisted user preferences (read once on mount)
  const [facing, setFacing] = useState<Facing>(() =>
    readPref<Facing>(LS_FACING, 'environment', (v) => (v === 'user' ? 'user' : 'environment')),
  );
  const [hdMode, setHdMode] = useState<boolean>(() =>
    readPref<boolean>(LS_HD, true, (v) => v === '1'),
  );
  const wantTorchOnOpen = useRef<boolean>(
    readPref<boolean>(LS_TORCH, false, (v) => v === '1'),
  );

  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashAnim, setFlashAnim] = useState(false);

  // Persist whenever prefs change
  useEffect(() => { writePref(LS_FACING, facing); }, [facing]);
  useEffect(() => { writePref(LS_HD, hdMode ? '1' : '0'); }, [hdMode]);
  useEffect(() => { writePref(LS_TORCH, torchOn ? '1' : '0'); }, [torchOn]);

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

  const startStream = useCallback(async (mode: Facing, hd: boolean) => {
    setError(null);
    setIsReady(false);
    stopStream();

    // Guard: some Android WebViews / insecure contexts expose no mediaDevices.
    const md: MediaDevices | undefined =
      typeof navigator !== 'undefined' ? (navigator.mediaDevices as any) : undefined;
    if (!md || typeof md.getUserMedia !== 'function') {
      console.warn('[CustomCamera] mediaDevices.getUserMedia not available');
      setError(
        t(
          'camera.unsupported',
          'Camera not available in this browser. Use the gallery instead.',
        ),
      );
      return;
    }

    // On native (Capacitor) ask the OS for camera permission first; without
    // this Android often returns NotAllowedError silently and the white-frame
    // crash appears.
    if (Capacitor.isNativePlatform()) {
      try {
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.checkPermissions();
        if (status.camera !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera'] });
          if (req.camera !== 'granted') {
            setError(t('camera.permissionDenied', 'Camera permission denied'));
            return;
          }
        }
      } catch (e) {
        console.warn('[CustomCamera] native permission check skipped', e);
      }
    }

    try {
      const target = hd
        ? { width: { ideal: 2560 }, height: { ideal: 1440 } }
        : { width: { ideal: 1920 }, height: { ideal: 1080 } };
      let stream: MediaStream;
      try {
        stream = await md.getUserMedia({
          video: { facingMode: { ideal: mode }, ...target },
          audio: false,
        });
      } catch (innerErr) {
        // Fallback: some devices reject the resolution constraints.
        console.warn('[CustomCamera] retrying with relaxed constraints', innerErr);
        stream = await md.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => { /* ignore autoplay errors */ });
      }
      const track = stream.getVideoTracks()[0];
      const caps: any = (track && (track.getCapabilities?.() || {})) || {};
      const torchOk = Boolean(caps.torch);
      setTorchSupported(torchOk);

      // Re-apply torch preference (back camera only — front cameras have no flash)
      if (torchOk && mode === 'environment' && wantTorchOnOpen.current) {
        try {
          await (track as any).applyConstraints({ advanced: [{ torch: true }] });
          setTorchOn(true);
        } catch { /* ignore */ }
      }
      setIsReady(true);
    } catch (e: any) {
      console.error('[CustomCamera] getUserMedia failed', e);
      const name = e?.name || '';
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? t('camera.permissionDenied', 'Camera permission denied')
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? t('camera.noDevice', 'No camera found on this device')
            : t('camera.unavailable', 'Camera unavailable on this device'),
      );
    }
  }, [stopStream, t]);

  // Open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      // capture current torch pref so startStream can re-apply
      wantTorchOnOpen.current = readPref<boolean>(LS_TORCH, false, (v) => v === '1');
      startStream(facing, hdMode);
    } else {
      stopStream();
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleFacing = async () => {
    const next: Facing = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    await startStream(next, hdMode);
  };

  const toggleHd = async () => {
    const next = !hdMode;
    setHdMode(next);
    await startStream(facing, next);
    toast.success(
      next
        ? t('camera.hdOn', 'HD capture on — sharper scans')
        : t('camera.hdOff', 'HD capture off'),
    );
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
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Compute scan-frame crop in video coordinates so the saved image
      // contains only what's inside the white corners (sharper for AI).
      // We use a centered square covering ~85% of the shorter side, which
      // matches the on-screen 78vw frame when the preview uses object-cover.
      const cropFraction = 0.88;
      const previewBox = previewBoxRef.current;
      const frame = frameRef.current;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (previewBox && frame) {
        const pb = previewBox.getBoundingClientRect();
        const fb = frame.getBoundingClientRect();
        // object-cover scales video so the smaller axis fills the box.
        const scale = Math.max(pb.width / vw, pb.height / vh);
        const renderedW = vw * scale;
        const renderedH = vh * scale;
        const offsetX = (pb.width - renderedW) / 2;
        const offsetY = (pb.height - renderedH) / 2;
        sx = Math.max(0, ((fb.left - pb.left) - offsetX) / scale);
        sy = Math.max(0, ((fb.top - pb.top) - offsetY) / scale);
        sw = Math.min(vw - sx, fb.width / scale);
        sh = Math.min(vh - sy, fb.height / scale);
      } else {
        const side = Math.min(vw, vh) * cropFraction;
        sx = (vw - side) / 2;
        sy = (vh - side) / 2;
        sw = side;
        sh = side;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas context unavailable');
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const raw = canvas.toDataURL('image/jpeg', hdMode ? 0.92 : 0.88);

      const compressOpts = hdMode
        ? { maxWidth: 1600, maxHeight: 1600, quality: 0.88 as const, mimeType: 'image/jpeg' as const }
        : { maxWidth: 1024, maxHeight: 1024, quality: 0.85 as const, mimeType: 'image/jpeg' as const };
      const compressed = await compressImage(raw, compressOpts).catch(() => raw);
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
        <div className="flex items-center gap-2">
          {/* HD toggle */}
          <button
            onClick={toggleHd}
            className={`h-10 px-3 rounded-full backdrop-blur flex items-center gap-1 text-xs font-semibold active:scale-95 transition-transform ${hdMode ? 'bg-yellow-300 text-black' : 'bg-white/15 text-white'}`}
            aria-label={t('camera.hd', 'HD capture')}
            aria-pressed={hdMode}
          >
            <Sparkles className="h-3.5 w-3.5" />
            HD
          </button>
          <button
            onClick={toggleTorch}
            disabled={!torchSupported}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
            aria-label={t('camera.flash', 'Flash')}
          >
            {torchOn ? <Zap className="h-5 w-5 text-yellow-300" /> : <ZapOff className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Camera preview */}
      <div ref={previewBoxRef} className="relative flex-1 overflow-hidden bg-black">
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
            <div ref={frameRef} className="relative" style={{ width: 'min(78vw, 360px)', height: 'min(78vw, 360px)' }}>
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
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
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => startStream(facing, hdMode)}
                className="mt-2 px-5 py-2 rounded-full bg-white text-black text-sm font-medium"
              >
                {t('common.retry', 'Retry')}
              </button>
              <button
                onClick={async () => {
                  try {
                    const dataUrl = await captureImageForAI('camera');
                    if (dataUrl) {
                      stopStream();
                      onCapture(dataUrl);
                    }
                  } catch (e) {
                    console.error('[CustomCamera] system camera fallback failed', e);
                  }
                }}
                className="mt-2 px-5 py-2 rounded-full bg-white/20 text-white text-sm font-medium"
              >
                {t('camera.useSystem', 'Use system camera')}
              </button>
              {onPickGallery && (
                <button
                  onClick={() => { stopStream(); onPickGallery(); }}
                  className="mt-2 px-5 py-2 rounded-full bg-white/20 text-white text-sm font-medium"
                >
                  {t('camera.gallery', 'Gallery')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Shutter flash overlay */}
        {flashAnim && <div className="absolute inset-0 bg-white animate-pulse pointer-events-none" />}

        {/* Hint pill */}
        {isReady && !error && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 px-4 py-2 rounded-full bg-black/55 backdrop-blur text-xs font-medium text-white/95 pointer-events-none">
            {hdMode
              ? t('camera.scanTasksHintHd', 'Align inside the frame · HD')
              : (title || t('camera.scanTasksHint', 'Align inside the frame'))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-8 pt-5 pb-6 flex items-center justify-between bg-gradient-to-t from-black to-transparent">
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

        <button
          onClick={handleShutter}
          disabled={!isReady || isCapturing}
          aria-label={t('camera.capture', 'Take photo')}
          className="relative w-[78px] h-[78px] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="absolute inset-0 rounded-full border-[3px] border-white" />
          <span className={`block w-[60px] h-[60px] rounded-full bg-white transition-transform ${isCapturing ? 'scale-90' : 'scale-100'}`} />
          {isCapturing && <Loader2 className="absolute h-6 w-6 text-black animate-spin" />}
        </button>

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
