/**
 * VoiceNoteSheet — Press-to-talk dictation that converts speech to text using
 * the browser's Web Speech API and inserts the transcript into the note.
 *
 * Pro-gated via the `ai_dictation` feature flag.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Loader2, Check, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages } from 'lucide-react';

// Common dictation languages. BCP-47 codes for Web Speech API.
const DICTATION_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'ur-PK', label: 'اردو (Urdu)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ar-SA', label: 'العربية (Arabic)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'tr-TR', label: 'Türkçe' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'he-IL', label: 'עברית (Hebrew)' },
  { code: 'id-ID', label: 'Bahasa Indonesia' },
];

const LANG_STORAGE_KEY = 'flowist_dictation_lang';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { canUseAiFeature, recordAiUsage, getLimitReachedMessage } from '@/utils/aiUsageLimits';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the transcript (plain text -> wrapped <p> on insert). */
  onInsertText: (text: string) => void;
}

export const VoiceNoteSheet = ({ isOpen, onClose, onInsertText }: Props) => {
  const { t, i18n } = useTranslation();
  const { isPro } = useSubscription();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  // Persisted dictation language. Defaults to saved → en-US.
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en-US';
    return localStorage.getItem(LANG_STORAGE_KEY) || 'en-US';
  });
  const recognitionRef = useRef<any>(null);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // True only when the user explicitly tapped Stop. Used so that when the
  // browser auto-ends the SpeechRecognition session (silence / timeout), we
  // transparently restart it instead of finalizing the transcript.
  const userStoppedRef = useRef(false);
  // Buffer for interim text so we can commit it if the user stops mid-utterance.
  const interimRef = useRef('');
  // Backoff counter for restart failures (resets on successful start).
  const restartAttemptsRef = useRef(0);
  // Periodic safety restart (Chrome can silently stall recognition after
  // several minutes of continuous dictation). We cycle the session every ~50s.
  const safetyRestartRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supportsSpeech =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setInterim('');
    }
    return () => stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Append text to transcript while guarding against duplicate trailing words.
  // Some Chrome builds re-emit the same interim chunk as final after a session
  // cycle, which previously caused "your your your" style duplication.
  const appendToTranscript = (chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;
    setTranscript((prev) => {
      const prevTrim = prev.trim();
      if (!prevTrim) return clean;
      if (prevTrim.toLowerCase().endsWith(clean.toLowerCase())) return prevTrim;
      const prevWords = prevTrim.split(/\s+/);
      const newWords = clean.split(/\s+/);
      const maxOverlap = Math.min(prevWords.length, newWords.length, 8);
      let overlap = 0;
      for (let n = maxOverlap; n > 0; n--) {
        const tail = prevWords.slice(-n).join(' ').toLowerCase();
        const head = newWords.slice(0, n).join(' ').toLowerCase();
        if (tail === head) { overlap = n; break; }
      }
      const remaining = newWords.slice(overlap).join(' ');
      return remaining ? prevTrim + ' ' + remaining : prevTrim;
    });
  };

  const stopListening = () => {
    userStoppedRef.current = true;
    const trailing = interimRef.current.trim();
    if (trailing) {
      appendToTranscript(trailing);
      interimRef.current = '';
    }
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (safetyRestartRef.current) {
      clearInterval(safetyRestartRef.current);
      safetyRestartRef.current = null;
    }
    startedAtRef.current = null;
    restartAttemptsRef.current = 0;
    setIsListening(false);
    setInterim('');
  };

  const startListening = () => {
    if (!supportsSpeech) {
      toast.error(t('tasks.aiNoSpeech', 'Speech recognition not supported on this device'));
      return;
    }
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;

    let finalChunk = '';
    rec.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalChunk += (finalChunk ? ' ' : '') + res[0].transcript.trim();
        } else {
          interimText += res[0].transcript;
        }
      }
      if (finalChunk) {
        appendToTranscript(finalChunk);
        finalChunk = '';
      }
      interimRef.current = interimText;
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      console.warn('[voice note] recognition error', e?.error);
      // Recoverable: 'no-speech' (silence), 'aborted' (programmatic stop),
      // 'network' (transient on long sessions) — let onend restart.
      const recoverable = ['no-speech', 'aborted', 'network', 'audio-capture'];
      if (e?.error && !recoverable.includes(e.error)) {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          toast.error(t('errors.microphoneFailed', 'Microphone permission denied'));
        }
        stopListening();
      }
    };
    rec.onend = () => {
      // Do NOT flush interim during auto-restart — Chrome often re-emits the
      // same words as final on the next session, causing duplication. Interim
      // is only committed when the user explicitly taps Stop.
      interimRef.current = '';
      setInterim('');
      // If the user didn't tap Stop, the browser auto-ended on silence/timeout.
      // Restart with a small delay + backoff to avoid InvalidStateError.
      if (!userStoppedRef.current && recognitionRef.current === rec) {
        const attempt = ++restartAttemptsRef.current;
        const delay = Math.min(2000, 100 * attempt); // 100, 200, 300… capped 2s
        if (attempt > 10) {
          console.warn('[voice note] giving up after 10 restart failures');
          stopListening();
          return;
        }
        setTimeout(() => {
          if (userStoppedRef.current || recognitionRef.current !== rec) return;
          try {
            rec.start();
            restartAttemptsRef.current = 0; // success path
          } catch {
            // Fire onend again so the next backoff tick retries.
            try { rec.onend?.(new Event('end') as any); } catch {}
          }
        }, delay);
        return;
      }
      setIsListening(false);
      setInterim('');
    };

    userStoppedRef.current = false;
    restartAttemptsRef.current = 0;
    interimRef.current = '';
    recognitionRef.current = rec;
    setIsListening(true);
    // Start elapsed-time counter (only when user begins, not on auto-restarts).
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 250);
    // Safety cycle: every ~50s force a restart. Some Chrome builds silently
    // stop returning results after several minutes of continuous dictation.
    if (safetyRestartRef.current) clearInterval(safetyRestartRef.current);
    safetyRestartRef.current = setInterval(() => {
      if (userStoppedRef.current || recognitionRef.current !== rec) return;
      try {
        // .stop() will trigger onend → auto-restart path above.
        rec.stop();
      } catch {}
    }, 50_000);
    try {
      rec.start();
    } catch (e) {
      console.error('[voice note] start failed', e);
      stopListening();
    }
  };

  // Format ms → MM:SS for the on-screen timer.
  const formatElapsed = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleInsert = () => {
    const text = transcript.trim();
    if (!text) {
      toast.error(t('voiceNote.nothing', 'Nothing recorded yet'));
      return;
    }
    stopListening();
    onInsertText(text);
    toast.success(t('voiceNote.inserted', 'Transcript inserted'));
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Mic className="h-5 w-5 text-primary" />
            {t('voiceNote.title', 'Dictate to note')}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              'voiceNote.helper',
              'Tap the mic and start speaking. Your words become text you can insert into the note.',
            )}
          </p>

          {/* Dictation language picker */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Languages className="h-3.5 w-3.5" />
              {t('voiceNote.language', 'Recognition language')}
            </label>
            <Select
              value={lang}
              onValueChange={(v) => {
                setLang(v);
                try { localStorage.setItem(LANG_STORAGE_KEY, v); } catch {}
                // If currently listening, restart with new language.
                if (isListening) {
                  stopListening();
                  setTimeout(() => startListening(), 150);
                }
              }}
              disabled={isListening}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {DICTATION_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Big mic button */}
          <div className="flex flex-col items-center gap-3 py-4">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg',
                isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse scale-110'
                  : 'bg-primary text-primary-foreground hover:scale-105',
              )}
              aria-label={isListening ? t('voiceNote.stop', 'Stop') : t('voiceNote.start', 'Start')}
            >
              {isListening ? <Loader2 className="h-10 w-10 animate-spin" /> : <Mic className="h-10 w-10" />}
            </button>
            <span className="text-xs text-muted-foreground">
              {isListening
                ? t('voiceNote.listening', 'Listening… tap to stop')
                : t('voiceNote.tapToSpeak', 'Tap to speak')}
            </span>
            {isListening && (
              <div
                className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-destructive"
                aria-live="polite"
                aria-label={t('voiceNote.elapsed', 'Recording time')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                {formatElapsed(elapsedMs)}
              </div>
            )}
          </div>

          {/* Editable transcript */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('voiceNote.transcript', 'Transcript')}
            </div>
            <Textarea
              value={transcript + (interim ? (transcript ? ' ' : '') + interim : '')}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t('voiceNote.placeholder', 'Your words will appear here…')}
              className="min-h-[140px] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTranscript('');
                setInterim('');
              }}
              disabled={!transcript && !interim}
              className="h-11 gap-1.5"
            >
              <X className="h-4 w-4" />
              {t('common.clear', 'Clear')}
            </Button>
            <Button onClick={handleInsert} disabled={!transcript.trim()} className="h-11 gap-1.5">
              <Check className="h-4 w-4" />
              {t('voiceNote.insert', 'Insert')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
