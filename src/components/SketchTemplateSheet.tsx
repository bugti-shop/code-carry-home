import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SKETCH_TEMPLATES } from '@/utils/sketchTemplates';
import { Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SketchTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (json: string) => void;
  hasExistingContent: boolean;
}

export const SketchTemplateSheet = ({ isOpen, onClose, onApply, hasExistingContent }: SketchTemplateSheetProps) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleApply = () => {
    const tmpl = SKETCH_TEMPLATES.find(t => t.id === selectedId);
    if (!tmpl) return;
    
    if (hasExistingContent) {
      // Confirm overwrite
      if (!window.confirm(t('sketch.templateOverwriteConfirm', 'This will replace your current sketch. Continue?'))) {
        return;
      }
    }
    
    const json = tmpl.generator();
    onApply(json);
    toast.success(t('sketch.templateApplied', 'Template applied!'));
    onClose();
    setSelectedId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setSelectedId(null); } }}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('sketch.templates', 'Sketch Templates')}
          </SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto flex-1 pb-20 space-y-3 px-1">
          {SKETCH_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedId(tmpl.id === selectedId ? null : tmpl.id)}
              className={cn(
                "w-full text-left rounded-xl border-2 p-4 transition-all",
                selectedId === tmpl.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: tmpl.previewColor || '#f3e8ff' }}
                >
                  {tmpl.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{tmpl.name}</h3>
                    {tmpl.premium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tmpl.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedId && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button onClick={handleApply} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              {t('sketch.applyTemplate', 'Apply Template')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
