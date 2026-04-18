/**
 * VoiceNoteSheet — Three-mode dictation:
 *  1. Live (Web Speech)  — fastest, close-mic only.
 *  2. Smart Record       — records via MediaRecorder, transcribes with
 *                          ElevenLabs Scribe (far-field, noisy room friendly).
 *  3. Upload File        — pick an audio/video file (YouTube/Zoom recording)
 *                          and Scribe transcribes it.
 *
 * Pro-gated via the `ai_dictation` feature flag (existing).
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Loader2, Check, X, Upload, Sparkles, Radio } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectGroup, SelectLabel, SelectSeparator,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';
import { getRecentDictationLangs, recordRecentDictationLang } from '@/utils/dictationLangRecent';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// BCP-47 (for Web Speech) + ISO-639-3 (for ElevenLabs Scribe).
const DICTATION_LANGUAGES: { code: string; label: string; iso3: string }[] = [
  { code: 'en-US', label: 'English (US)', iso3: 'eng' },
  { code: 'en-GB', label: 'English (UK)', iso3: 'eng' },
  { code: 'ur-PK', label: 'اردو (Urdu)', iso3: 'urd' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', iso3: 'hin' },
  { code: 'ar-SA', label: 'العربية (Arabic)', iso3: 'ara' },
  { code: 'es-ES', label: 'Español', iso3: 'spa' },
  { code: 'fr-FR', label: 'Français', iso3: 'fra' },
  { code: 'de-DE', label: 'Deutsch', iso3: 'deu' },
  { code: 'it-IT', label: 'Italiano', iso3: 'ita' },
  { code: 'pt-BR', label: 'Português (BR)', iso3: 'por' },
  { code: 'ru-RU', label: 'Русский', iso3: 'rus' },
  { code: 'zh-CN', label: '中文 (简体)', iso3: 'zho' },
  { code: 'ja-JP', label: '日本語', iso3: 'jpn' },
  { code: 'ko-KR', label: '한국어', iso3: 'kor' },
  { code: 'tr-TR', label: 'Türkçe', iso3: 'tur' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', iso3: 'ben' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', iso3: 'tam' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', iso3: 'tel' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', iso3: 'mar' },
  { code: 'he-IL', label: 'עברית (Hebrew)', iso3: 'heb' },
  { code: 'id-ID', label: 'Bahasa Indonesia', iso3: 'ind' },
];

const LANG_STORAGE_KEY = 'flowist_dictation_lang';
const MODE_STORAGE_KEY = 'flowist_dictation_mode';
type Mode = 'live' | 'smart' | 'upload';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
}

export const VoiceNoteSheet = ({ isOpen, onClose, onInsertText }: Props) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'smart';
    return ((localStorage.getItem(MODE_STORAGE_KEY) as Mode) || 'smart');
  });
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en-US';
    return localStorage.getItem(LANG_STORAGE_KEY) || 'en-US';
  });

  // ─── Live (Web Speech) ────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recognitionRef = useRef<any>(null);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userStoppedRef = useRef(false);
  const interimRef = useRef('');
  const restartAttemptsRef = useRef(0);
  const safetyRestartRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supportsSpeech =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // ─── Smart Record (MediaRecorder → Scribe) ────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number | null>(null);
  const recordTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordMs, setRecordMs] = useState(0);

  // ─── Upload ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      stopAll();
      setTranscript('');
      setInterim('');
    }
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stopAll = () => {
    stopListening();
    stopRecordingHard();
  };

  const formatElapsed = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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

  // ═══ LIVE MODE (Web Speech API) ════════════════════════════════════════
  const stopListening = () => {
    userStoppedRef.current = true;
    const trailing = interimRef.current.trim();
    if (trailing) {
      appendToTranscript(trailing);
      interimRef.current = '';
    }
    try { recognitionRef.current?.stop?.(); } catch {}
    recognitionRef.current = null;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (safetyRestartRef.current) { clearInterval(safetyRestartRef.current); safetyRestartRef.current = null; }
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
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;

    let finalChunk = '';
    rec.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalChunk += (finalChunk ? ' ' : '') + res[0].transcript.trim();
        else interimText += res[0].transcript;
      }
      if (finalChunk) { appendToTranscript(finalChunk); finalChunk = ''; }
      interimRef.current = interimText;
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      const recoverable = ['no-speech', 'aborted', 'network', 'audio-capture'];
      if (e?.error && !recoverable.includes(e.error)) {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          toast.error(t('errors.microphoneFailed', 'Microphone permission denied'));
        }
        stopListening();
      }
    };
    rec.onend = () => {
      interimRef.current = '';
      setInterim('');
      if (!userStoppedRef.current && recognitionRef.current === rec) {
        const attempt = ++restartAttemptsRef.current;
        const delay = Math.min(2000, 100 * attempt);
        if (attempt > 10) { stopListening(); return; }
        setTimeout(() => {
          if (userStoppedRef.current || recognitionRef.current !== rec) return;
          try { rec.start(); restartAttemptsRef.current = 0; }
          catch { try { rec.onend?.(new Event('end') as any); } catch {} }
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
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (startedAtRef.current != null) setElapsedMs(Date.now() - startedAtRef.current);
    }, 250);
    if (safetyRestartRef.current) clearInterval(safetyRestartRef.current);
    safetyRestartRef.current = setInterval(() => {
      if (userStoppedRef.current || recognitionRef.current !== rec) return;
      try { rec.stop(); } catch {}
    }, 50_000);
    try { rec.start(); }
    catch (e) { console.error('[voice note] start failed', e); stopListening(); }
  };

  // ═══ SMART RECORD MODE (MediaRecorder → ElevenLabs Scribe) ═════════════
  const stopRecordingHard = () => {
    try { mediaRecorderRef.current?.stop(); } catch {}
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recordTickRef.current) { clearInterval(recordTickRef.current); recordTickRef.current = null; }
    recordStartRef.current = null;
    setIsRecording(false);
  };

  const startSmartRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      // Pick supported mime type. webm/opus is widely supported; Safari uses mp4.
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported?.(m)) || '';
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        await transcribeBlob(blob, blob.type.includes('mp4') ? 'recording.m4a' : 'recording.webm');
      };
      mediaRecorderRef.current = rec;
      rec.start(1000); // collect every 1s

      recordStartRef.current = Date.now();
      setRecordMs(0);
      if (recordTickRef.current) clearInterval(recordTickRef.current);
      recordTickRef.current = setInterval(() => {
        if (recordStartRef.current != null) setRecordMs(Date.now() - recordStartRef.current);
      }, 250);
      setIsRecording(true);
    } catch (e) {
      console.error('[smart record] failed', e);
      toast.error(t('errors.microphoneFailed', 'Microphone permission denied'));
    }
  };

  const stopSmartRecord = () => {
    if (!mediaRecorderRef.current) return;
    try { mediaRecorderRef.current.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recordTickRef.current) { clearInterval(recordTickRef.current); recordTickRef.current = null; }
    recordStartRef.current = null;
    setIsRecording(false);
    // transcribeBlob runs in onstop handler
  };

  const transcribeBlob = async (blob: Blob, filename: string) => {
    if (blob.size < 1000) {
      toast.error(t('voiceNote.tooShort', 'Recording too short'));
      return;
    }
    setIsTranscribing(true);
    setUploadProgress(t('voiceNote.uploading', 'Uploading audio…'));
    try {
      const form = new FormData();
      form.append('file', blob, filename);
      const langEntry = DICTATION_LANGUAGES.find((l) => l.code === lang);
      if (langEntry) form.append('language_code', langEntry.iso3);

      const { data, error } = await supabase.functions.invoke('elevenlabs-transcribe', {
        body: form,
      });
      if (error) throw error;
      const text = (data as any)?.text?.trim() || '';
      if (!text) {
        toast.error(t('voiceNote.noSpeechDetected', 'No speech detected'));
        return;
      }
      appendToTranscript(text);
      toast.success(t('voiceNote.transcribed', 'Transcribed'));
    } catch (e: any) {
      console.error('[scribe] failed', e);
      toast.error(e?.message || t('errors.generic', 'Transcription failed'));
    } finally {
      setIsTranscribing(false);
      setUploadProgress('');
    }
  };

  // ═══ UPLOAD MODE ═══════════════════════════════════════════════════════
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!file) return;
    if (file.size > 24 * 1024 * 1024) {
      toast.error(t('voiceNote.fileTooLarge', 'File too large (max 24MB)'));
      return;
    }
    await transcribeBlob(file, file.name);
  };

  const handleInsert = () => {
    const text = transcript.trim();
    if (!text) { toast.error(t('voiceNote.nothing', 'Nothing recorded yet')); return; }
    stopAll();
    onInsertText(text);
    toast.success(t('voiceNote.inserted', 'Transcript inserted'));
    onClose();
  };

  const handleModeChange = (next: string) => {
    const m = next as Mode;
    stopAll();
    setMode(m);
    try { localStorage.setItem(MODE_STORAGE_KEY, m); } catch {}
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] p-0 overflow-y-auto">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Mic className="h-5 w-5 text-primary" />
            {t('voiceNote.title', 'Dictate to note')}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Language picker */}
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
                recordRecentDictationLang(v);
                if (isListening) { stopListening(); setTimeout(() => startListening(), 150); }
              }}
              disabled={isListening || isRecording || isTranscribing}
            >
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(() => {
                  const recents = getRecentDictationLangs();
                  const recentItems = recents
                    .map((code) => DICTATION_LANGUAGES.find((l) => l.code === code))
                    .filter((x): x is { code: string; label: string; iso3: string } => !!x);
                  const restItems = DICTATION_LANGUAGES.filter((l) => !recents.includes(l.code));
                  return (
                    <>
                      {recentItems.length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel className="text-[10px] uppercase tracking-wider">
                              {t('voiceNote.recent', 'Recent')}
                            </SelectLabel>
                            {recentItems.map((l) => (
                              <SelectItem key={`r-${l.code}`} value={l.code}>{l.label}</SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                        </>
                      )}
                      <SelectGroup>
                        {recentItems.length > 0 && (
                          <SelectLabel className="text-[10px] uppercase tracking-wider">
                            {t('voiceNote.allLanguages', 'All languages')}
                          </SelectLabel>
                        )}
                        {restItems.map((l) => (
                          <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  );
                })()}
              </SelectContent>
            </Select>
          </div>

          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="smart" className="text-xs gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {t('voiceNote.smart', 'Smart')}
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs gap-1">
                <Radio className="h-3.5 w-3.5" />
                {t('voiceNote.live', 'Live')}
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs gap-1">
                <Upload className="h-3.5 w-3.5" />
                {t('voiceNote.upload', 'Upload')}
              </TabsTrigger>
            </TabsList>

            {/* SMART RECORD */}
            <TabsContent value="smart" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                {t('voiceNote.smartHelper', 'Best for noisy rooms or distant speakers. Records, then transcribes with AI.')}
              </p>
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={isRecording ? stopSmartRecord : startSmartRecord}
                  disabled={isTranscribing}
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50',
                    isRecording
                      ? 'bg-destructive text-destructive-foreground animate-pulse scale-110'
                      : 'bg-primary text-primary-foreground hover:scale-105',
                  )}
                  aria-label={isRecording ? t('voiceNote.stop', 'Stop') : t('voiceNote.start', 'Start')}
                >
                  {isTranscribing
                    ? <Loader2 className="h-10 w-10 animate-spin" />
                    : isRecording
                      ? <span className="w-8 h-8 rounded bg-current" />
                      : <Mic className="h-10 w-10" />}
                </button>
                <span className="text-xs text-muted-foreground">
                  {isTranscribing
                    ? (uploadProgress || t('voiceNote.transcribing', 'Transcribing…'))
                    : isRecording
                      ? t('voiceNote.recordingTap', 'Recording… tap to transcribe')
                      : t('voiceNote.tapToRecord', 'Tap to record')}
                </span>
                {isRecording && (
                  <div className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-destructive">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    {formatElapsed(recordMs)}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* LIVE (Web Speech) */}
            <TabsContent value="live" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                {t('voiceNote.liveHelper', 'Instant captions while you speak. Works best with the microphone close to your mouth.')}
              </p>
              <div className="flex flex-col items-center gap-3 py-2">
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
                  <div className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-destructive">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    {formatElapsed(elapsedMs)}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* UPLOAD */}
            <TabsContent value="upload" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                {t('voiceNote.uploadHelper', 'Upload an audio file (YouTube/Zoom recording, podcast, voice memo). Max 24MB.')}
              </p>
              <div className="flex flex-col items-center gap-3 py-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTranscribing}
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50',
                    'bg-primary text-primary-foreground hover:scale-105',
                  )}
                  aria-label={t('voiceNote.upload', 'Upload')}
                >
                  {isTranscribing
                    ? <Loader2 className="h-10 w-10 animate-spin" />
                    : <Upload className="h-10 w-10" />}
                </button>
                <span className="text-xs text-muted-foreground text-center">
                  {isTranscribing
                    ? (uploadProgress || t('voiceNote.transcribing', 'Transcribing…'))
                    : t('voiceNote.tapToUpload', 'Tap to choose audio file')}
                </span>
              </div>
            </TabsContent>
          </Tabs>

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
              onClick={() => { setTranscript(''); setInterim(''); }}
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
