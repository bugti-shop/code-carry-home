import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface NativeSpeechSessionOptions {
  language: string;
  /** Called with the FULL accumulated transcript so far (committed + current partial). */
  onPartial: (text: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

interface NativeSpeechSessionController {
  stop: () => Promise<void>;
  cleanup: () => Promise<void>;
  /** Returns the full accumulated transcript at any point. */
  getTranscript: () => string;
}

export const shouldUseNativeSpeechRecognition = () => Capacitor.isNativePlatform();

/**
 * Pre-warm permissions BEFORE the user taps mic.
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

  // ── Accumulation state ──
  // committedSegments holds finalized text from previous recognition cycles.
  // currentBest holds the longest partial from the current cycle.
  // On auto-restart we commit currentBest → committedSegments and reset.
  let committedSegments: string[] = [];
  let currentBest = '';

  let userRequestedStop = false;
  let cleaned = false;
  let restarting = false;
  let restartFailCount = 0;
  const MAX_RESTART_FAILS = 3;
  // Delay between restart attempts (increases on failure)
  const RESTART_DELAY_MS = 250;

  const getFullTranscript = () => {
    const parts = [...committedSegments];
    if (currentBest) parts.push(currentBest);
    return parts.join(' ').trim();
  };

  const partialListener = await SpeechRecognition.addListener('partialResults', (data) => {
    const matches = (data?.matches ?? []) as string[];
    let best = '';
    for (const m of matches) {
      const trimmed = (m || '').trim();
      if (trimmed.length > best.length) best = trimmed;
    }
    if (best) {
      currentBest = best;
      options.onPartial(getFullTranscript());
    }
  });

  const startRecognizer = () =>
    SpeechRecognition.start({
      language: options.language,
      maxResults: 5,
      partialResults: true,
      popup: false,
    });

  const attemptRestart = () => {
    if (userRequestedStop || cleaned || restarting || restartFailCount >= MAX_RESTART_FAILS) {
      if (restartFailCount >= MAX_RESTART_FAILS) {
        console.warn('[nativeSpeech] max restart attempts reached — stopping');
      }
      options.onStop?.();
      return;
    }
    restarting = true;
    const delay = RESTART_DELAY_MS * (restartFailCount + 1);
    setTimeout(() => {
      if (userRequestedStop || cleaned) {
        options.onStop?.();
        return;
      }
      startRecognizer().catch((err) => {
        console.warn('[nativeSpeech] auto-restart failed', err);
        restarting = false;
        restartFailCount++;
        // Retry recursively with back-off
        attemptRestart();
      });
    }, delay);
  };

  const stateListener = await SpeechRecognition.addListener('listeningState', (data) => {
    if (data.status === 'started') {
      restarting = false;
      restartFailCount = 0;
      options.onStart?.();
      return;
    }
    if (data.status === 'stopped') {
      // Commit the current segment before restarting
      if (currentBest) {
        committedSegments.push(currentBest);
        currentBest = '';
      }

      if (!userRequestedStop && !cleaned) {
        attemptRestart();
        return;
      }
      options.onStop?.();
    }
  });

  try {
    await startRecognizer();
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
        // Ignore
      }
    },
    cleanup: async () => {
      if (cleaned) return;
      cleaned = true;
      userRequestedStop = true;
      try { await partialListener.remove(); } catch {}
      try { await stateListener.remove(); } catch {}
    },
    getTranscript: getFullTranscript,
  };
};
