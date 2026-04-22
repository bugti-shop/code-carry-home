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
  // currentBest holds the best partial from the current cycle (first/highest-confidence match).
  // On auto-restart we commit currentBest → committedSegments and reset.
  let committedSegments: string[] = [];
  let currentBest = '';

  // Remove overlapping prefix between the last committed segment and new text.
  // Also handles stuttered duplicates like "buy some buy some groceries".
  const deduplicateOverlap = (committed: string, incoming: string): string => {
    if (!committed || !incoming) return incoming;
    const cWords = committed.toLowerCase().split(/\s+/);
    const iWords = incoming.toLowerCase().split(/\s+/);
    const iWordsOrig = incoming.split(/\s+/);
    // Find the longest suffix of committed that matches a prefix of incoming
    let overlapLen = 0;
    const maxCheck = Math.min(cWords.length, iWords.length);
    for (let len = 1; len <= maxCheck; len++) {
      const suffix = cWords.slice(-len).join(' ');
      const prefix = iWords.slice(0, len).join(' ');
      if (suffix === prefix) overlapLen = len;
    }
    return overlapLen > 0 ? iWordsOrig.slice(overlapLen).join(' ') : incoming;
  };

  // Remove stuttered repetitions within a single phrase
  // e.g. "buy some buy some buy some groceries" → "buy some groceries"
  const removeStutter = (text: string): string => {
    const words = text.split(/\s+/);
    if (words.length <= 2) return text;
    // Try patterns of length 1..4 words repeating at the start
    for (let patLen = 1; patLen <= Math.min(4, Math.floor(words.length / 2)); patLen++) {
      const pattern = words.slice(0, patLen).join(' ').toLowerCase();
      let i = patLen;
      while (i + patLen <= words.length) {
        const nextChunk = words.slice(i, i + patLen).join(' ').toLowerCase();
        if (nextChunk === pattern) {
          i += patLen; // skip duplicate
        } else {
          break;
        }
      }
      if (i > patLen) {
        // Found repeats — reconstruct with first occurrence + rest
        return [...words.slice(0, patLen), ...words.slice(i)].join(' ');
      }
    }
    return text;
  };

  const getFullTranscript = () => {
    const parts = [...committedSegments];
    if (currentBest) parts.push(currentBest);
    return parts.join(' ').trim();
  };

  const partialListener = await SpeechRecognition.addListener('partialResults', (data) => {
    const matches = (data?.matches ?? []) as string[];
    // Use first match (highest confidence) instead of longest — avoids
    // picking up garbled alternatives that are longer but wrong.
    const best = (matches[0] || '').trim();
    if (best) {
      currentBest = best;
      options.onPartial(getFullTranscript());
    }
  });

  let userRequestedStop = false;
  let cleaned = false;
  let restarting = false;
  let restartFailCount = 0;
  const MAX_RESTART_FAILS = 3;
  const RESTART_DELAY_MS = 250;

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
      // Commit the current segment before restarting, deduplicating overlap
      if (currentBest) {
        const lastCommitted = committedSegments.length > 0 ? committedSegments.join(' ') : '';
        const deduped = deduplicateOverlap(lastCommitted, currentBest);
        if (deduped) {
          committedSegments.push(deduped);
        }
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
