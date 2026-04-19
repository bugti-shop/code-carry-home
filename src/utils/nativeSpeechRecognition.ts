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

  const partialListener = await SpeechRecognition.addListener('partialResults', (data) => {
    const text = data.matches?.[0]?.trim();
    if (text) options.onPartial(text);
  });

  const stateListener = await SpeechRecognition.addListener('listeningState', (data) => {
    if (data.status === 'started') options.onStart?.();
    if (data.status === 'stopped') options.onStop?.();
  });

  try {
    await SpeechRecognition.start({
      language: options.language,
      maxResults: 1,
      partialResults: true,
      popup: false,
    });
  } catch (error) {
    await partialListener.remove();
    await stateListener.remove();
    throw error;
  }

  let stopped = false;
  let cleaned = false;

  return {
    stop: async () => {
      if (stopped) return;
      stopped = true;
      try {
        await SpeechRecognition.stop();
      } catch {
        // Ignore: we'll still clean up local listeners.
      }
    },
    cleanup: async () => {
      if (cleaned) return;
      cleaned = true;
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