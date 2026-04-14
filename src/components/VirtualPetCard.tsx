import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { m as motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Heart, Star, Sparkles, Share2, ChevronRight } from 'lucide-react';
import { loadTodoItems } from '@/utils/todoItemsStorage';
import { getSetting, setSetting } from '@/utils/settingsStorage';

interface PetState {
  name: string;
  stage: number; // 0-5
  xp: number;
  totalFed: number;
  lastFedDate: string;
  happiness: number; // 0-100
}

const PET_STAGES = [
  { name: 'Seed', emoji: '🌱', minXp: 0, color: 'from-lime-400 to-green-500', desc: 'Just planted! Complete tasks to help me grow.' },
  { name: 'Sprout', emoji: '🌿', minXp: 10, color: 'from-green-400 to-emerald-500', desc: 'I\'m growing! Keep going!' },
  { name: 'Sapling', emoji: '🪴', minXp: 30, color: 'from-emerald-400 to-teal-500', desc: 'Getting stronger every day!' },
  { name: 'Bloom', emoji: '🌸', minXp: 60, color: 'from-pink-400 to-rose-500', desc: 'Look at me bloom! You\'re amazing!' },
  { name: 'Tree', emoji: '🌳', minXp: 100, color: 'from-green-500 to-emerald-600', desc: 'Fully grown! I\'m so proud of you!' },
  { name: 'Magic Tree', emoji: '✨🌳✨', minXp: 200, color: 'from-violet-500 to-purple-600', desc: 'Legendary! You\'re a productivity master!' },
];

const MOOD_EMOJIS: Record<string, string> = {
  ecstatic: '😍',
  happy: '😊',
  content: '🙂',
  neutral: '😐',
  sad: '😢',
  wilting: '😴',
};

const PET_KEY = 'flowist_virtual_pet';

export const VirtualPetCard = () => {
  const { t } = useTranslation();
  const [pet, setPet] = useState<PetState | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [feedAnimation, setFeedAnimation] = useState(false);
  const [evolveAnimation, setEvolveAnimation] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    loadPet();
    const handler = () => feedPet();
    window.addEventListener('tasksUpdated', handler);
    return () => window.removeEventListener('tasksUpdated', handler);
  }, []);

  const loadPet = async () => {
    const saved = await getSetting<PetState>(PET_KEY, null);
    if (saved) {
      updateHappiness(saved);
    } else {
      const newPet: PetState = { name: 'Buddy', stage: 0, xp: 0, totalFed: 0, lastFedDate: '', happiness: 50 };
      await setSetting(PET_KEY, newPet);
      setPet(newPet);
    }
  };

  const updateHappiness = (p: PetState) => {
    const today = new Date().toISOString().split('T')[0];
    const daysSinceLastFed = p.lastFedDate
      ? Math.floor((new Date(today).getTime() - new Date(p.lastFedDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const happinessDecay = Math.min(daysSinceLastFed * 15, 80);
    const newHappiness = Math.max(20, Math.min(100, p.happiness - happinessDecay + (p.lastFedDate === today ? 0 : 0)));
    setPet({ ...p, happiness: newHappiness });
  };

  const feedPet = async () => {
    const saved = await getSetting<PetState>(PET_KEY, null);
    if (!saved) return;

    const today = new Date().toISOString().split('T')[0];
    const xpGain = 1;
    const newXp = saved.xp + xpGain;
    const newHappiness = Math.min(100, saved.happiness + 5);

    // Check evolution
    const currentStage = saved.stage;
    let newStage = currentStage;
    for (let i = PET_STAGES.length - 1; i >= 0; i--) {
      if (newXp >= PET_STAGES[i].minXp) { newStage = i; break; }
    }

    const updated: PetState = {
      ...saved,
      xp: newXp,
      totalFed: saved.totalFed + 1,
      lastFedDate: today,
      happiness: newHappiness,
      stage: newStage,
    };

    await setSetting(PET_KEY, updated);
    setPet(updated);

    if (newStage > currentStage) {
      setEvolveAnimation(true);
      setTimeout(() => setEvolveAnimation(false), 2000);
    } else {
      setFeedAnimation(true);
      setParticles(Array.from({ length: 6 }, (_, i) => i));
      setTimeout(() => { setFeedAnimation(false); setParticles([]); }, 1000);
    }
  };

  const getMood = (happiness: number): string => {
    if (happiness >= 90) return 'ecstatic';
    if (happiness >= 70) return 'happy';
    if (happiness >= 50) return 'content';
    if (happiness >= 35) return 'neutral';
    if (happiness >= 20) return 'sad';
    return 'wilting';
  };

  const getNextStageXp = () => {
    if (!pet) return 0;
    const next = PET_STAGES[pet.stage + 1];
    return next ? next.minXp : PET_STAGES[PET_STAGES.length - 1].minXp;
  };

  const handleShare = async () => {
    if (!pet) return;
    const stage = PET_STAGES[pet.stage];
    const text = `🌱 My Flowist Plant: ${stage.emoji} ${stage.name}\n📊 Level ${pet.stage + 1} | ${pet.xp} XP\n💚 ${pet.totalFed} tasks completed!\n\n#Flowist #VirtualPet #Productivity`;
    try {
      if (navigator.share) await navigator.share({ title: 'My Flowist Pet', text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  };

  if (!pet) return null;

  const stage = PET_STAGES[pet.stage];
  const mood = getMood(pet.happiness);
  const nextXp = getNextStageXp();
  const progress = pet.stage < PET_STAGES.length - 1
    ? ((pet.xp - stage.minXp) / (nextXp - stage.minXp)) * 100
    : 100;

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowDetail(true)}
        className="w-full bg-card rounded-2xl p-4 border shadow-sm flex items-center gap-4 active:bg-muted/50 transition-colors text-left"
      >
        <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0 relative", stage.color)}>
          <span>{stage.emoji}</span>
          {feedAnimation && particles.map(i => (
            <motion.span key={i}
              initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              animate={{ opacity: 0, y: -30, x: (i % 2 === 0 ? 1 : -1) * (10 + i * 5), scale: 0.5 }}
              className="absolute text-sm">💚</motion.span>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{pet.name}</h3>
            <span className="text-xs text-muted-foreground">Lv.{pet.stage + 1} {stage.name}</span>
            <span>{MOOD_EMOJIS[mood]}</span>
          </div>
          <div className="mt-1.5 w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full bg-gradient-to-r", stage.color)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{pet.xp}/{nextXp} XP • {stage.desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </motion.button>

      {/* Detail Fullscreen */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
            style={{ paddingTop: 'var(--safe-top, 0px)', paddingBottom: 'var(--safe-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-bold">Your Plant Buddy</h2>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">✕</button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Pet Display */}
              <div className={cn("rounded-2xl p-8 bg-gradient-to-br text-white text-center relative overflow-hidden", stage.color)}>
                <AnimatePresence>
                  {evolveAnimation && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"
                    >
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 1] }}
                        className="text-4xl font-black text-purple-700"
                      >
                        EVOLVED! 🎉
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={feedAnimation ? { scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] } : { y: [0, -5, 0] }}
                  transition={feedAnimation ? { duration: 0.5 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-7xl mb-4 relative inline-block"
                >
                  {stage.emoji}
                  {feedAnimation && particles.map(i => (
                    <motion.span key={i}
                      initial={{ opacity: 1, y: 0, x: 0 }}
                      animate={{ opacity: 0, y: -60, x: (i % 2 === 0 ? 1 : -1) * (20 + i * 10) }}
                      transition={{ duration: 0.8 }}
                      className="absolute text-xl top-0 left-1/2">
                      {['💚', '✨', '⭐', '🌟', '💫', '🌈'][i]}
                    </motion.span>
                  ))}
                </motion.div>
                <h3 className="text-2xl font-black">{pet.name}</h3>
                <p className="text-white/80 text-sm mt-1">Level {pet.stage + 1} — {stage.name} {MOOD_EMOJIS[mood]}</p>

                <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-white/70 mt-1">{pet.xp} / {nextXp} XP</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{pet.totalFed}</p>
                  <p className="text-[10px] text-muted-foreground">Tasks Fed</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{pet.happiness}%</p>
                  <p className="text-[10px] text-muted-foreground">Happiness</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">Lv.{pet.stage + 1}</p>
                  <p className="text-[10px] text-muted-foreground">Stage</p>
                </div>
              </div>

              {/* Evolution Roadmap */}
              <div className="bg-card border rounded-xl p-4">
                <h4 className="font-semibold text-sm mb-3">Evolution Roadmap</h4>
                <div className="space-y-2">
                  {PET_STAGES.map((s, i) => (
                    <div key={i} className={cn("flex items-center gap-3 p-2 rounded-lg transition-all",
                      i <= pet.stage ? "bg-primary/10" : "opacity-40")}>
                      <span className="text-xl w-8 text-center">{s.emoji}</span>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", i <= pet.stage && "text-primary")}>{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.minXp} XP required</p>
                      </div>
                      {i <= pet.stage && <Star className="h-4 w-4 text-warning fill-warning" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Share */}
              <button onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform">
                <Share2 className="h-4 w-4" /> Share My Plant Card
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VirtualPetCard;
