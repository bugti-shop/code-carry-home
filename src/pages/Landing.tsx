import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, CheckCircle2, Calendar, Bell, Repeat, StickyNote, ListTodo, Cloud, Lock,
  Sparkles, Folder, BarChart3, ArrowRight, Zap, Heart, Star, Shield, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { setSetting } from '@/utils/settingsStorage';

const features = [
  { icon: ListTodo, title: 'Smart Tasks', desc: 'Add tasks in seconds with priorities, due dates and gentle reminders.' },
  { icon: StickyNote, title: 'Beautiful Notes', desc: 'Write notes, sketch ideas, save receipts and code — all in one calm place.' },
  { icon: Calendar, title: 'Clear Calendar', desc: 'See your day, week or month at a glance. Plan ahead without stress.' },
  { icon: Bell, title: 'Smart Reminders', desc: 'Get a nudge at the right time so nothing important slips by.' },
  { icon: Repeat, title: 'Habits & Streaks', desc: 'Build daily habits, keep streaks alive and feel real progress.' },
  { icon: BarChart3, title: 'Weekly Review', desc: 'A simple recap of what you did and what matters next week.' },
  { icon: Folder, title: 'Folders & Tags', desc: 'Organize your way with custom folders, colors and tags.' },
  { icon: Cloud, title: 'Cloud Backup', desc: 'Sync safely with Google Drive. Switch devices without losing a thing.' },
  { icon: Lock, title: 'Private by Default', desc: 'App lock, biometrics and offline-first. Your data stays yours.' },
];

const whyPoints = [
  { icon: Zap, title: 'Fast & lightweight', desc: 'Opens instantly. Works even when your internet doesn\'t.' },
  { icon: Heart, title: 'Calm by design', desc: 'A clean interface that helps you focus instead of distracting you.' },
  { icon: Shield, title: 'Yours forever', desc: 'Export, backup and own your data. No lock-in. Ever.' },
  { icon: Smartphone, title: 'Works everywhere', desc: 'Web, Android and iOS — pick up exactly where you left off.' },
];

const testimonials = [
  { name: 'Ayesha K.', role: 'Student', text: 'Flowist is the only app I actually open every day. Tasks, notes and habits — sorted.' },
  { name: 'Daniel R.', role: 'Designer', text: 'Finally a planner that feels calm. The streaks keep me consistent without feeling pushy.' },
  { name: 'Priya S.', role: 'Founder', text: 'I replaced three apps with Flowist. Cleanest writing space I\'ve used in years.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
    { label: 'Loved by', href: '#loved' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Soft background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#3c78f0]/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[360px] w-[360px] rounded-full bg-[#3c78f0]/5 blur-3xl" />
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all ${
          scrolled
            ? 'border-b border-slate-200/70 bg-white/85 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <AppLogo size="md" />
            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Flowist</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {item.label}
              </a>
            ))}
            <Button onClick={handleGetStarted} className="rounded-full px-6">
              Get Started
            </Button>
          </nav>

          {/* Hamburger - mobile (right) */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors active:bg-slate-50"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-xs border-l border-slate-200 bg-white p-6">
              <div className="mb-8 flex items-center gap-2">
                <AppLogo size="md" />
                <span className="text-lg font-bold text-slate-900">Flowist</span>
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
                <Button
                  onClick={() => {
                    setMenuOpen(false);
                    handleGetStarted();
                  }}
                  className="mt-4 rounded-full"
                >
                  Get Started
                </Button>
              </div>
              <p className="mt-8 text-xs text-slate-400">© {new Date().getFullYear()} Flowist</p>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3c78f0]/20 bg-[#3c78f0]/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#3c78f0] sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Tasks · Notes · Habits — One calm app
            </div>
            <h1 className="mb-5 text-[40px] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Stay organized.
              <br />
              <span className="text-[#3c78f0]">Stay in flow.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base text-slate-600 sm:text-lg sm:leading-relaxed">
              Flowist helps you capture tasks, write beautiful notes and build daily habits — without the noise.
              Simple, fast and made for real life.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="group h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
              >
                Get Started — It's Free
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <a href="#features" className="w-full sm:w-auto">
                <button className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto">
                  See how it works
                </button>
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#3c78f0]" /> Works offline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#3c78f0]" /> No ads
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#3c78f0]" /> Free to try
              </span>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="relative mx-auto mt-14 max-w-4xl sm:mt-20">
            <div className="absolute -inset-x-4 -top-6 -bottom-6 rounded-[32px] bg-gradient-to-b from-[#3c78f0]/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(60,120,240,0.35)] sm:rounded-[28px]">
              <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="ml-3 text-xs font-medium text-slate-400">flowist · today</span>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-7">
                {/* Tasks card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <ListTodo className="h-3.5 w-3.5 text-[#3c78f0]" /> Today
                  </div>
                  <ul className="space-y-2.5 text-sm text-slate-700">
                    {['Finish design review', 'Reply to Sarah', 'Gym at 6 pm'].map((t, i) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            i === 0 ? 'border-[#3c78f0] bg-[#3c78f0] text-white' : 'border-slate-300'
                          }`}
                        >
                          {i === 0 && <CheckCircle2 className="h-3 w-3" />}
                        </span>
                        <span className={i === 0 ? 'text-slate-400 line-through' : ''}>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Notes card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <StickyNote className="h-3.5 w-3.5 text-[#3c78f0]" /> Notes
                  </div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Trip ideas ✈️</p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Hunza in October — pack warm layers, book Karimabad stay, sunrise at Eagle's Nest…
                  </p>
                </div>
                {/* Habit card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Repeat className="h-3.5 w-3.5 text-[#3c78f0]" /> Habits
                  </div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">12</span>
                    <span className="text-xs text-slate-500">day streak</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 1, 1, 1, 1, 0, 1].map((d, i) => (
                      <span
                        key={i}
                        className={`h-6 flex-1 rounded ${d ? 'bg-[#3c78f0]' : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-slate-100 bg-slate-50/60 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3c78f0]">
                Everything in one app
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                A complete toolkit for getting things done
              </h2>
              <p className="text-base text-slate-600 sm:text-lg">
                Stop juggling 5 apps. Tasks, notes, habits, reminders and a calendar — all under one calm roof.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-slate-200/70 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#3c78f0]/30 hover:shadow-[0_12px_40px_-12px_rgba(60,120,240,0.25)]"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#3c78f0]/10 text-[#3c78f0] transition-colors group-hover:bg-[#3c78f0] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Flowist */}
        <section id="why" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3c78f0]">Why Flowist</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                Built to keep your day simple
              </h2>
              <p className="text-base text-slate-600 sm:text-lg">
                No clutter. No endless menus. Just a clean space to plan, write and finish what matters.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {whyPoints.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-slate-200/70 bg-white p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#3c78f0]/10 text-[#3c78f0]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Loved by */}
        <section id="loved" className="border-t border-slate-100 bg-slate-50/60 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3c78f0]">Loved by people like you</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Real flow, real progress
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl border border-slate-200/70 bg-white p-6">
                  <div className="mb-3 flex items-center gap-0.5 text-[#3c78f0]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-slate-700">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3c78f0]/10 text-sm font-semibold text-[#3c78f0]">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-[#3c78f0] px-6 py-14 text-center sm:px-12 sm:py-20">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <h2 className="relative mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Ready to take back your day?
              </h2>
              <p className="relative mx-auto mb-8 max-w-xl text-base text-white/85 sm:text-lg">
                Join people using Flowist to plan smarter, write freely and build habits that stick.
              </p>
              <button
                onClick={handleGetStarted}
                className="relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-[#3c78f0] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="relative mt-4 text-xs text-white/70">No credit card needed · Works offline</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <span className="text-sm font-semibold text-slate-900">Flowist</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="/privacy-policy" className="transition-colors hover:text-slate-900">Privacy</a>
            <a href="/terms-and-conditions" className="transition-colors hover:text-slate-900">Terms</a>
            <a href="#top" className="transition-colors hover:text-slate-900">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
