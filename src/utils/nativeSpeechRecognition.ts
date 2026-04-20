import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface NativeSpeechSessionOptions {
  language: string;
  onPartial: (text: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

interface NativeSpeechSessionController {
  stop: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export const shouldUseNativeSpeechRecognition = () => Capacitor.isNativePlatform();

/**
 * Pre-warm permissions BEFORE the user taps mic. This avoids breaking the
 * gesture chain on Android — `SpeechRecognition.start()` works much more
 * reliably when called synchronously from a user tap (no await beforehand).
 * Safe to call multiple times; resolves to true once permission is granted.
 */
export const ensureSpeechRecognitionReady = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const available = await SpeechRecognition.available();
    if (!available.available) return false;
    let permission = await SpeechRecognition.checkPermissions();
    if (permission.speechRecognition !== 'granted') {
      permission = await SpeechRecognition.requestPermissions();
    }
    return permission.speechRecognition === 'granted';
  } catch {
    return false;
  }
};

export const startNativeSpeechSession = async (
  options: NativeSpeechSessionOptions,
): Promise<NativeSpeechSessionController> => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native speech recognition is only available on device');
  }

  const available = await SpeechRecognition.available();
  if (!available.available) {
    throw new Error('Speech recognition not available on this device');
  }

  let permission = await SpeechRecognition.checkPermissions();
  if (permission.speechRecognition !== 'granted') {
    permission = await SpeechRecognition.requestPermissions();
  }
  if (permission.speechRecognition !== 'granted') {
    throw new Error('Speech recognition permission denied');
  }

  // State for the session — needs to be in scope for restart logic below.
  let userRequestedStop = false;
  let cleaned = false;
  let restarting = false;

  const partialListener = await SpeechRecognition.addListener('partialResults', (data) => {
    // Android emits BOTH partial transcripts AND the final transcript through
    // this same event. Pick the longest match — that's the most complete one.
    const matches = (data?.matches ?? []) as string[];
    let best = '';
    for (const m of matches) {
      const trimmed = (m || '').trim();
      if (trimmed.length > best.length) best = trimmed;
    }
    if (best) options.onPartial(best);
  });

  const stateListener = await SpeechRecognition.addListener('listeningState', (data) => {
    if (data.status === 'started') {
      restarting = false;
      options.onStart?.();
      return;
    }
    if (data.status === 'stopped') {
      // Android's recognizer auto-stops on silence. If the user hasn't tapped
      // Stop yet, silently restart so dictation feels continuous (web-like).
      if (!userRequestedStop && !cleaned && !restarting) {
        restarting = true;
        SpeechRecognition.start({
          language: options.language,
          maxResults: 5,
          partialResults: true,
          popup: false,
        }).catch((err) => {
          console.warn('[nativeSpeech] auto-restart failed', err);
          restarting = false;
          options.onStop?.();
        });
        return;
      }
      options.onStop?.();
    }
  });

  try {
    await SpeechRecognition.start({
      language: options.language,
      // Request multiple alternatives so we get the best transcript even
      // when Android's recognizer is uncertain (improves accuracy).
      maxResults: 5,
      partialResults: true,
      popup: false,
    });
  } catch (error) {
    await partialListener.remove().catch(() => {});
    await stateListener.remove().catch(() => {});
    throw error;
  }

  return {
    stop: async () => {
      if (userRequestedStop) return;
      userRequestedStop = true;
      try {
        await SpeechRecognition.stop();
      } catch {
        // Ignore: we'll still clean up local listeners.
      }
    },
    cleanup: async () => {
      if (cleaned) return;
      cleaned = true;
      userRequestedStop = true;
      try {
        await partialListener.remove();
      } catch {
        // Ignore listener cleanup failures.
      }
      try {
        await stateListener.remove();
      } catch {
        // Ignore listener cleanup failures.
      }
    },
  };
};