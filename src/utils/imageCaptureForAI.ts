// Capture an image for AI extraction.
// On native (Capacitor) → opens the camera or gallery via @capacitor/camera.
// On web → uses a hidden <input type="file" capture="environment"> fallback.
// Always returns a compressed JPEG data URL (~1024px, ~80% quality) to keep
// upload size and AI token cost low.

import { Capacitor } from '@capacitor/core';
import { compressImage } from '@/utils/imageCompression';

export type CaptureSource = 'camera' | 'gallery';

const COMPRESS_OPTS = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8 as const,
  mimeType: 'image/jpeg' as const,
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const captureWeb = (source: CaptureSource): Promise<string | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    let resolved = false;
    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        if (!resolved) { resolved = true; resolve(null); }
        return;
      }
      try {
        const raw = await fileToDataUrl(file);
        const compressed = await compressImage(raw, COMPRESS_OPTS);
        if (!resolved) { resolved = true; resolve(compressed); }
      } catch (e) {
        console.error('[imageCaptureForAI] web capture failed', e);
        if (!resolved) { resolved = true; resolve(null); }
      }
    };
    // If user cancels the picker there's no reliable event; rely on next call.
    document.body.appendChild(input);
    input.click();
  });

export async function captureImageForAI(
  source: CaptureSource = 'camera',
): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import(
        '@capacitor/camera'
      );
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        width: 1024,
        height: 1024,
      });
      const dataUrl = photo.dataUrl;
      if (!dataUrl) return null;
      // Re-compress to guarantee ≤ 1024px JPEG even if the native picker returned larger.
      try {
        return await compressImage(dataUrl, COMPRESS_OPTS);
      } catch {
        return dataUrl;
      }
    } catch (e: any) {
      // User cancelled or permission denied.
      if (e?.message && /cancel/i.test(String(e.message))) return null;
      console.error('[imageCaptureForAI] native capture failed', e);
      return null;
    }
  }
  return captureWeb(source);
}
