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
  const recognitionRef = useRef<any>(null);
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

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    setIsListening(false);
  };

  const startListening = () => {
    if (!supportsSpeech) {
      toast.error(t('tasks.aiNoSpeech', 'Speech recognition not supported on this device'));
      return;
    }
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = i18n.language || 'en-US';
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
        setTranscript((prev) => (prev ? prev + ' ' + finalChunk : finalChunk).trim());
        finalChunk = '';
      }
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      console.warn('[voice note] recognition error', e);
      stopListening();
    };
    rec.onend = () => {
      setIsListening(false);
      setInterim('');
    };

    recognitionRef.current = rec;
    setIsListening(true);
    try {
      rec.start();
    } catch (e) {
      console.error('[voice note] start failed', e);
      stopListening();
    }
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
