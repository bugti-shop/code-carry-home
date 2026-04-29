import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ListTodo, StickyNote, Repeat, Bell, Calendar, Cloud, Star } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { setSetting } from '@/utils/settingsStorage';

const BLUE = '#3c78f0';

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleGetStarted = async () => {
    await setSetting('onboarding_completed', false);
    try {
      sessionStorage.setItem('flowist_landing_acknowledged', 'true');
      localStorage.setItem('flowist_landing_acknowledged', 'true');
    } catch {}
    window.dispatchEvent(new Event('flowistLandingDismissed'));
    navigate('/');
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Why Flowist', href: '#why' },
    { label: 'Reviews', href: '#reviews' },
  ];

  const features = [
    { icon: ListTodo, title: 'Smart tasks', desc: 'Add tasks fast with priorities, dates and gentle reminders.' },
    { icon: StickyNote, title: 'Beautiful notes', desc: 'Write, sketch and save ideas in one calm place.' },
    { icon: Repeat, title: 'Habits & streaks', desc: 'Build daily habits and watch your streak grow.' },
    { icon: Bell, title: 'Smart reminders', desc: 'Get a nudge at the right moment so nothing slips by.' },
    { icon: Calendar, title: 'Clear calendar', desc: 'See your day, week and month at a glance.' },
    { icon: Cloud, title: 'Safe backup', desc: 'Sync with Google Drive. Switch devices, lose nothing.' },
  ];

  const reviews = [
    { name: 'Ayesha K.', text: 'The only app I open every single day. Tasks, notes and habits — all sorted.' },
    { name: 'Daniel R.', text: 'Calmest planner I’ve used. Streaks keep me consistent without feeling pushy.' },
    { name: 'Priya S.', text: 'Replaced 3 apps with Flowist. Cleanest space to write and plan.' },
  ];

  return (
    <div className="min-h-screen bg-[#fff7f3] text-slate-900 antialiased">
      {/* Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all ${
          scrolled ? 'border-b border-slate-200/70 bg-white/90 backdrop-blur-xl' : 'border-b border-transparent bg-[#fff7f3]'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <AppLogo size="md" />
            <span className="text-xl font-bold tracking-tight" style={{ color: BLUE }}>
              Flowist
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleGetStarted}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] sm:px-6 sm:text-base"
              style={{ backgroundColor: BLUE }}
            >
              Start for free
            </button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors active:bg-slate-100"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] max-w-xs border-l border-slate-200 bg-white p-6">
                <div className="mb-8 flex items-center gap-2">
                  <AppLogo size="md" />
                  <span className="text-lg font-bold" style={{ color: BLUE }}>Flowist</span>
                </div>
                <div className="flex flex-col gap-1">
                  {navLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors active:bg-slate-100"
                    >
                      {item.label}
                    </a>
                  ))}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleGetStarted();
                    }}
                    className="mt-4 rounded-full py-3 text-base font-semibold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    Start for free
                  </button>
                </div>
                <p className="mt-8 text-xs text-slate-400">© {new Date().getFullYear()} Flowist</p>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto w-full max-w-3xl px-5 pt-10 pb-12 text-center sm:pt-20 sm:pb-20">
          <h1 className="mb-6 text-[44px] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-7xl">
            Clarity, finally.
          </h1>
          <p className="mx-auto mb-7 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Plan your day, capture your ideas and build calm habits — all in one simple app.
          </p>

          <div className="mx-auto mb-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
            <span aria-hidden></span>
            <span aria-hidden>🤖</span>
            <span className="ml-1 font-medium">Loved on Web, Android & iOS</span>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={handleGetStarted}
              className="w-full max-w-xs rounded-2xl py-4 text-lg font-bold text-white shadow-[0_8px_0_0_#2b5dbf] transition-transform active:translate-y-1 active:shadow-[0_2px_0_0_#2b5dbf] sm:w-auto sm:px-14"
              style={{ backgroundColor: BLUE }}
            >
              Start for free
            </button>
            <p className="mt-4 text-xs text-slate-500">No credit card · Works offline · Free to try</p>
          </div>

          {/* Mobile preview card */}
          <div className="relative mx-auto mt-14 max-w-sm">
            <div className="absolute -inset-6 rounded-[40px] bg-[#3c78f0]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(60,120,240,0.4)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">8:30</span>
                <span className="text-xs text-slate-400">●●●</span>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-slate-900">Today</h3>
              <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-400">My Tasks · 3</p>
              <ul className="space-y-3.5 text-left">
                {[
                  { text: 'Do 30 minutes of yoga 🧘', tag: 'Fitness', done: true },
                  { text: 'Dentist appointment', tag: 'Health', done: false },
                  { text: 'Reply to Sarah', tag: 'Work', done: false },
                ].map((t, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: t.done ? BLUE : '#cbd5e1',
                        backgroundColor: t.done ? BLUE : 'transparent',
                      }}
                    >
                      {t.done && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white"><path fill="currentColor" d="M10.28 3.22a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0L2.22 6.28a.75.75 0 1 1 1.06-1.06l2 2 3.97-3.97a.75.75 0 0 1 1.03-.03Z"/></svg>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.text}</p>
                      <p className="text-[11px]" style={{ color: BLUE }}># {t.tag}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Everything you need. Nothing you don’t.
              </h2>
              <p className="text-base text-slate-600 sm:text-lg">
                Tasks, notes, habits, reminders and a calendar — under one calm roof.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all active:scale-[0.99]">
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section id="why" className="bg-[#fff7f3] py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Calm. Fast. Yours.
            </h2>
            <p className="mb-10 text-base text-slate-600 sm:text-lg">
              Flowist opens instantly, works offline and never gets in your way. Your data stays private — you can export or back it up anytime.
            </p>
            <button
              onClick={handleGetStarted}
              className="rounded-2xl px-10 py-4 text-base font-bold text-white shadow-[0_8px_0_0_#2b5dbf] transition-transform active:translate-y-1 active:shadow-[0_2px_0_0_#2b5dbf]"
              style={{ backgroundColor: BLUE }}
            >
              Try Flowist free
            </button>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Loved by people like you</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-3 flex items-center gap-0.5" style={{ color: BLUE }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-slate-700">“{r.text}”</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                      style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
                    >
                      {r.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#fff7f3] py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Start your day in flow.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base text-slate-600 sm:text-lg">
              Join people using Flowist to plan smarter, write freely and build habits that stick.
            </p>
            <button
              onClick={handleGetStarted}
              className="rounded-2xl px-12 py-4 text-lg font-bold text-white shadow-[0_8px_0_0_#2b5dbf] transition-transform active:translate-y-1 active:shadow-[0_2px_0_0_#2b5dbf]"
              style={{ backgroundColor: BLUE }}
            >
              Start for free
            </button>
            <p className="mt-4 text-xs text-slate-500">No credit card needed · Works offline</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="text-sm font-semibold" style={{ color: BLUE }}>Flowist</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="/privacy-policy" className="hover:text-slate-900">Privacy</a>
            <a href="/terms-and-conditions" className="hover:text-slate-900">Terms</a>
            <a href="#top" className="hover:text-slate-900">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
