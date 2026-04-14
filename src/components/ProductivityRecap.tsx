import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { m as motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Flame, Trophy, Star, Sparkles,
  ChevronRight, ChevronLeft, Share2, X, Zap, Target, Crown
} from 'lucide-react';
import { loadTodoItems } from '@/utils/todoItemsStorage';
import { TodoItem } from '@/types/note';
import { startOfWeek, endOfWeek, subWeeks, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface RecapSlide {
  id: string;
  bg: string;
  render: () => React.ReactNode;
}

export const ProductivityRecap = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    if (!isOpen) return;
    loadStats();
  }, [isOpen, mode]);

  const loadStats = async () => {
    const tasks = await loadTodoItems();
    const now = new Date();
    
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);
    
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const completed = tasks.filter(t => t.completed && t.completedAt);
    
    const periodStart = mode === 'weekly' ? thisWeekStart : thisMonthStart;
    const periodEnd = mode === 'weekly' ? thisWeekEnd : thisMonthEnd;
    const prevStart = mode === 'weekly' ? lastWeekStart : lastMonthStart;
    const prevEnd = mode === 'weekly' ? lastWeekEnd : lastMonthEnd;

    const thisPeriod = completed.filter(t => {
      const d = new Date(t.completedAt!);
      return d >= periodStart && d <= periodEnd;
    });

    const lastPeriod = completed.filter(t => {
      const d = new Date(t.completedAt!);
      return d >= prevStart && d <= prevEnd;
    });

    // Day distribution
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayDistribution = dayNames.map((name, idx) => ({
      name,
      count: thisPeriod.filter(t => new Date(t.completedAt!).getDay() === idx).length,
    }));
    const bestDay = dayDistribution.reduce((a, b) => a.count > b.count ? a : b, dayDistribution[0]);

    // Hour distribution
    const hourDistribution = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: thisPeriod.filter(t => new Date(t.completedAt!).getHours() === h).length,
    }));
    const peakHour = hourDistribution.reduce((a, b) => a.count > b.count ? a : b, hourDistribution[0]);
    const peakTimeLabel = peakHour.hour < 6 ? 'Night Owl 🦉' : peakHour.hour < 12 ? 'Morning Person ☀️' : peakHour.hour < 18 ? 'Afternoon Warrior ⚡' : 'Evening Star 🌙';

    // Streak within period
    let maxStreak = 0, currentStreak = 0;
    const days = mode === 'weekly' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const d = new Date(periodStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const hasTask = thisPeriod.some(t => new Date(t.completedAt!).toISOString().split('T')[0] === dateStr);
      if (hasTask) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else currentStreak = 0;
    }

    const change = lastPeriod.length > 0
      ? Math.round(((thisPeriod.length - lastPeriod.length) / lastPeriod.length) * 100)
      : thisPeriod.length > 0 ? 100 : 0;

    // Priority breakdown
    const highPriority = thisPeriod.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    
    setStats({
      thisCount: thisPeriod.length,
      lastCount: lastPeriod.length,
      change,
      bestDay,
      peakTimeLabel,
      peakHour: peakHour.hour,
      maxStreak,
      dayDistribution,
      totalAll: completed.length,
      highPriority,
      avgPerDay: Math.round((thisPeriod.length / days) * 10) / 10,
    });
    setCurrentSlide(0);
  };

  const slides: RecapSlide[] = stats ? [
    {
      id: 'intro',
      bg: 'from-violet-600 via-purple-600 to-indigo-700',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <Sparkles className="h-16 w-16 mb-6 text-yellow-300" />
          </motion.div>
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-3xl font-black mb-2">
            Your {mode === 'weekly' ? 'Weekly' : 'Monthly'} Recap
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-white/70 text-lg">
            Let's see how you did ✨
          </motion.p>
        </div>
      ),
    },
    {
      id: 'total',
      bg: 'from-emerald-600 via-teal-600 to-cyan-700',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.3, duration: 0.6 }}>
            <Trophy className="h-14 w-14 mb-4 text-yellow-300" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-sm uppercase tracking-widest mb-2">Tasks Completed</motion.p>
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}
            className="text-8xl font-black">{stats.thisCount}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className={cn("mt-4 flex items-center gap-2 px-4 py-2 rounded-full", stats.change >= 0 ? "bg-green-500/30" : "bg-red-500/30")}>
            <TrendingUp className={cn("h-4 w-4", stats.change < 0 && "rotate-180")} />
            <span className="text-sm font-bold">{stats.change >= 0 ? '+' : ''}{stats.change}% vs last {mode === 'weekly' ? 'week' : 'month'}</span>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'bestday',
      bg: 'from-orange-500 via-amber-500 to-yellow-600',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-6">
          <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
            <Star className="h-14 w-14 mb-4 text-white" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-sm uppercase tracking-widest mb-2">Most Productive Day</motion.p>
          <motion.p initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-5xl font-black">{stats.bestDay.name}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-2xl font-bold mt-2 text-white/90">{stats.bestDay.count} tasks</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex gap-1 mt-6">
            {stats.dayDistribution.map((d: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-8 bg-white/20 rounded-full overflow-hidden" style={{ height: 80 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / Math.max(stats.bestDay.count, 1)) * 100}%` }}
                    transition={{ delay: 0.9 + i * 0.05 }}
                    className="bg-white/80 rounded-full w-full mt-auto"
                    style={{ marginTop: 'auto' }}
                  />
                </div>
                <span className="text-[10px] text-white/70">{d.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      ),
    },
    {
      id: 'personality',
      bg: 'from-pink-600 via-rose-500 to-red-600',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
            <Zap className="h-14 w-14 mb-4 text-yellow-300" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-sm uppercase tracking-widest mb-2">Your Productivity Style</motion.p>
          <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }}
            className="text-4xl font-black">{stats.peakTimeLabel}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-white/70 mt-3 text-sm">Peak hour: {stats.peakHour}:00</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="bg-white/15 backdrop-blur rounded-xl p-3">
              <p className="text-2xl font-black">{stats.avgPerDay}</p>
              <p className="text-[10px] text-white/70">avg/day</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-3">
              <p className="text-2xl font-black">{stats.highPriority}</p>
              <p className="text-[10px] text-white/70">high priority</p>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'streak',
      bg: 'from-blue-600 via-indigo-600 to-purple-700',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
            <Flame className="h-14 w-14 mb-4 text-orange-400" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/80 text-sm uppercase tracking-widest mb-2">Best Streak This {mode === 'weekly' ? 'Week' : 'Month'}</motion.p>
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}
            className="text-8xl font-black">{stats.maxStreak}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-white/70 text-lg">consecutive days</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="mt-6 bg-white/15 backdrop-blur rounded-xl px-6 py-3">
            <p className="text-sm"><span className="font-bold">{stats.totalAll}</span> tasks completed all time</p>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'summary',
      bg: 'from-fuchsia-600 via-purple-600 to-violet-700',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-6">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.3 }}>
            <Crown className="h-16 w-16 mb-4 text-yellow-300" />
          </motion.div>
          <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-3xl font-black mb-4">
            {stats.thisCount >= 20 ? 'Productivity Legend!' : stats.thisCount >= 10 ? 'Great Progress!' : stats.thisCount >= 5 ? 'Nice Work!' : 'Keep Going!'}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="bg-white/15 backdrop-blur rounded-2xl p-4 w-full max-w-xs space-y-2">
            <div className="flex justify-between"><span className="text-white/70">Tasks Done</span><span className="font-bold">{stats.thisCount}</span></div>
            <div className="flex justify-between"><span className="text-white/70">Best Day</span><span className="font-bold">{stats.bestDay.name}</span></div>
            <div className="flex justify-between"><span className="text-white/70">Best Streak</span><span className="font-bold">{stats.maxStreak} days</span></div>
            <div className="flex justify-between"><span className="text-white/70">Style</span><span className="font-bold text-xs">{stats.peakTimeLabel}</span></div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={handleShare}
            className="mt-6 flex items-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-full active:scale-95 transition-transform"
          >
            <Share2 className="h-4 w-4" /> Share My Recap
          </motion.button>
        </div>
      ),
    },
  ] : [];

  const handleShare = async () => {
    try {
      const text = `🎉 My ${mode === 'weekly' ? 'Weekly' : 'Monthly'} Productivity Recap!\n✅ ${stats.thisCount} tasks completed\n🔥 ${stats.maxStreak} day streak\n⭐ Best day: ${stats.bestDay.name}\n${stats.peakTimeLabel}\n\n#Flowist #ProductivityWrapped`;
      if (navigator.share) {
        await navigator.share({ title: 'My Productivity Recap', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  const nextSlide = () => setCurrentSlide(p => Math.min(p + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(p => Math.max(p - 1, 0));

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 border border-violet-500/30 rounded-2xl p-4 flex items-center gap-4 active:opacity-80 transition-opacity"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-sm">Productivity Recap</h3>
          <p className="text-xs text-muted-foreground">Your Spotify Wrapped-style stats ✨</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </motion.button>

      <AnimatePresence>
        {isOpen && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ paddingTop: 'var(--safe-top, 0px)', paddingBottom: 'var(--safe-bottom, 0px)' }}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-700", slides[currentSlide]?.bg)} />
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4">
              <div className="flex gap-1 flex-1 mx-2">
                {slides.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: idx <= currentSlide ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-white/80 hover:text-white ml-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="relative z-10 flex justify-center">
              <div className="flex bg-white/15 backdrop-blur rounded-full p-1">
                {(['weekly', 'monthly'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                      mode === m ? "bg-white text-purple-700" : "text-white/70")}>
                    {m === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {slides[currentSlide]?.render()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="relative z-10 flex items-center justify-between p-6">
              <button onClick={prevSlide} disabled={currentSlide === 0}
                className={cn("p-3 rounded-full bg-white/15 backdrop-blur", currentSlide === 0 && "opacity-30")}>
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <span className="text-white/50 text-xs">{currentSlide + 1} / {slides.length}</span>
              <button onClick={nextSlide} disabled={currentSlide === slides.length - 1}
                className={cn("p-3 rounded-full bg-white/15 backdrop-blur", currentSlide === slides.length - 1 && "opacity-30")}>
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductivityRecap;
