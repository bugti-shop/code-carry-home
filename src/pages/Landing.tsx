import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Check, Plus, Calendar, Bell, Repeat, StickyNote, Sparkles, Shield, Zap, Star, ArrowRight } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { setSetting } from '@/utils/settingsStorage';

const BLUE = '#3c78f0';
const BLUE_DARK = '#2b5dbf';

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Preload onboarding chunk on idle so the landing → onboarding handoff is instant (no white screen)
  useEffect(() => {
    const preload = () => { import('@/components/OnboardingFlow').catch(() => {}); };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload, { timeout: 1500 });
    } else {
      setTimeout(preload, 300);
    }
  }, []);

  const handleGetStarted = async () => {
    // Preload onboarding chunk BEFORE navigating so the next screen renders immediately
    const preload = import('@/components/OnboardingFlow').catch(() => {});
    await setSetting('onboarding_completed', false);
    try {
      sessionStorage.setItem('flowist_landing_acknowledged', 'true');
      localStorage.setItem('flowist_landing_acknowledged', 'true');
    } catch {}
    await preload;
    window.dispatchEvent(new Event('flowistLandingDismissed'));
    navigate('/');
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'FAQ', href: '#faq' },
  ];

  const features = [
    { icon: Check, title: 'Quick tasks', desc: 'Add tasks in seconds with priorities and due dates.' },
    { icon: StickyNote, title: 'Notes & sketches', desc: 'Write, draw and save ideas in one calm space.' },
    { icon: Repeat, title: 'Habits & streaks', desc: 'Build daily habits and keep your streak alive.' },
    { icon: Bell, title: 'Smart reminders', desc: 'Gentle nudges so nothing important slips by.' },
    { icon: Calendar, title: 'Clear calendar', desc: 'See your day, week and month at a glance.' },
    { icon: Sparkles, title: 'AI helpers', desc: 'Turn photos into tasks. Auto-plan your week.' },
  ];

  const steps = [
    { n: '01', title: 'Add it', desc: 'Type, speak or snap a photo — Flowist sorts it.' },
    { n: '02', title: 'Plan it', desc: 'Drop tasks on a date. Set a reminder. Done.' },
    { n: '03', title: 'Do it', desc: 'Tick things off. Watch your streak grow.' },
  ];

  const reviews = [
    { name: 'Ayesha K.', role: 'Designer', text: 'The only planner I open every day. Tasks, notes and habits — all sorted.' },
    { name: 'Daniel R.', role: 'Founder', text: 'Calmest planner I’ve used. Streaks keep me consistent without being pushy.' },
    { name: 'Priya S.', role: 'Student', text: 'Replaced 3 apps with Flowist. Cleanest place to write and plan.' },
  ];

  const faqs = [
    { q: 'Is Flowist free?', a: 'Yes — start free. Upgrade anytime for unlimited everything from $1.49/week.' },
    { q: 'Does it work offline?', a: 'Fully. Your tasks and notes are saved on your device and sync when you’re back online.' },
    { q: 'Can I switch devices?', a: 'Yes. Sign in and your tasks, notes and habits follow you across web, Android and iOS.' },
    { q: 'Is my data private?', a: 'Always. You own your data. Export or back it up to Google Drive anytime.' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-[#3c78f0]/20">
      {/* Header */}
      <header
        className={`sticky top-0 z-40 w-full border-b border-slate-200 transition-all ${
          scrolled ? 'bg-white/90 backdrop-blur-xl' : 'bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 sm:py-2.5">
          <a href="#top" className="flex items-center gap-2">
            <AppLogo size="md" />
            <span className="text-xl font-extrabold tracking-tight" style={{ color: BLUE }}>Flowist</span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGetStarted}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-transform active:scale-[0.98] sm:px-5 sm:py-2.5 sm:text-[15px]"
              style={{ backgroundColor: BLUE }}
            >
              Get Flowist Free
            </button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors active:bg-slate-100 md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] max-w-xs border-l border-slate-200 bg-white p-6">
                <div className="mb-8 flex items-center gap-2">
                  <AppLogo size="md" />
                  <span className="text-lg font-extrabold" style={{ color: BLUE }}>Flowist</span>
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
                    onClick={() => { setMenuOpen(false); handleGetStarted(); }}
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
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-[#eaf1ff] via-white to-white" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 md:grid-cols-2">
            <div className="text-center md:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BLUE }} />
                Now on Web, Android & iOS
              </div>
              <h1 className="mb-5 text-[40px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[64px]">
                Organize your day,<br />
                <span style={{ color: BLUE }}>achieve more.</span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg md:mx-0">
                Tasks, notes and habits — all in one calm app. Add anything in seconds. Get gentle reminders. Build streaks that stick.
              </p>
              <div className="mx-auto flex max-w-md flex-col gap-3 md:mx-0">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 text-base font-bold text-white transition-transform active:translate-y-1"
                  style={{ backgroundColor: BLUE, boxShadow: `0 5px 0 0 ${BLUE_DARK}` }}
                >
                  Get Flowist Free <ArrowRight className="h-5 w-5" />
                </button>
                <div className="grid w-full grid-cols-2 gap-2">
                  <a
                    href="https://apps.apple.com/app/flowist"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-md bg-black px-3 text-white transition-transform active:translate-y-0.5"
                    aria-label="Download on the App Store"
                  >
                    <svg viewBox="0 0 384 512" className="h-7 w-7 fill-current shrink-0" aria-hidden="true">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.5 105.7c30.1-35.7 27.4-68.2 26.5-79.9-26.6 1.5-57.4 18.1-74.9 38.5-19.3 21.9-30.6 49-28.2 78.8 28.7 2.2 54.9-12.5 76.6-37.4z"/>
                    </svg>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] font-medium opacity-90">Download on the</span>
                      <span className="text-[17px] font-semibold tracking-tight">App Store</span>
                    </div>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=app.lovable.flowist"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-md bg-black px-3 text-white transition-transform active:translate-y-0.5"
                    aria-label="Get it on Google Play"
                  >
                    <svg viewBox="0 0 512 512" className="h-7 w-7 shrink-0" aria-hidden="true">
                      <path fill="#00d7fe" d="M99.6 14.4C77.7 21.5 64 41.6 64 67.7v376.6c0 26.1 13.7 46.2 35.6 53.3l217.4-251.8L99.6 14.4z"/>
                      <path fill="#ffce00" d="M396.7 314.2l-79.7-58.4 70.9-82.1 105.4 60.7c19.7 11.4 19.7 39.8 0 51.2l-96.6 28.6z"/>
                      <path fill="#ff3a44" d="M396.7 314.2l-79.7-58.4-217.4 242.6c8.7 2.8 18.8 1.9 28.6-3.7l268.5-180.5z"/>
                      <path fill="#48ff48" d="M99.6 14.4c-9.8-5.6-19.9-6.5-28.6-3.7l245.9 244.7 79.7-82.1L99.6 14.4z"/>
                    </svg>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] font-medium opacity-90">GET IT ON</span>
                      <span className="text-[17px] font-semibold tracking-tight">Google Play</span>
                    </div>
                  </a>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">Try it free · Works offline · Cancel anytime</p>
            </div>

            {/* Mock app card */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 rounded-[40px] bg-[#3c78f0]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(60,120,240,0.45)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Today</h3>
                    <p className="text-xs text-slate-500">Wednesday, Apr 29</p>
                  </div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {[
                    { text: '30 min morning yoga', tag: 'Health', done: true, time: '7:00 AM' },
                    { text: 'Reply to Sarah’s email', tag: 'Work', done: false, time: '10:30 AM' },
                    { text: 'Buy groceries', tag: 'Personal', done: false, time: '6:00 PM' },
                    { text: 'Read 20 pages 📚', tag: 'Habit', done: false, time: 'Tonight' },
                  ].map((t, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                          borderColor: t.done ? BLUE : '#cbd5e1',
                          backgroundColor: t.done ? BLUE : 'transparent',
                        }}
                      >
                        {t.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {t.text}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{t.time}</span>
                          <span>·</span>
                          <span style={{ color: BLUE }}># {t.tag}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between bg-slate-50 px-5 py-3 text-xs text-slate-500">
                  <span>🔥 12-day streak</span>
                  <span>3 of 4 done</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-y border-slate-100 bg-slate-50/50 py-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 text-xs font-medium text-slate-500 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><Shield className="h-4 w-4" /> Private & secure</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4" /> Opens instantly</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-current" style={{ color: BLUE }} /> 4.9 average rating</span>
            <span className="inline-flex items-center gap-1.5"><Repeat className="h-4 w-4" /> Sync across devices</span>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: BLUE }}>Features</p>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Everything you need. Nothing you don’t.
              </h2>
              <p className="text-base text-slate-600 sm:text-lg">
                Tasks, notes, habits, reminders and a calendar — all in one calm place.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: BLUE }}>How it works</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Three simple steps to a calmer day.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-7">
                  <span className="text-3xl font-extrabold" style={{ color: BLUE }}>{s.n}</span>
                  <h3 className="mt-3 mb-2 text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: BLUE }}>Reviews</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Loved by people like you
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
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
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
                    >
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: BLUE }}>FAQ</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Quick answers
              </h2>
            </div>
            <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {faqs.map((f) => (
                <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4">
                    <span className="text-base font-semibold text-slate-900">{f.q}</span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-transform group-open:rotate-45"
                      style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-6">
            <div
              className="overflow-hidden rounded-3xl px-8 py-14 text-center text-white sm:px-14 sm:py-20"
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
            >
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Start your day in flow.
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-base text-white/90 sm:text-lg">
                Join people using Flowist to plan smarter, write freely and build habits that stick.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 text-lg font-bold text-slate-900 shadow-[0_6px_0_0_rgba(0,0,0,0.15)] transition-transform active:translate-y-1"
              >
                Get Flowist Free <ArrowRight className="h-5 w-5" />
              </button>
              <p className="mt-4 text-xs text-white/80">Try it free · Works offline</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
          {/* Top: logo + copyright */}
          <div className="mb-10 flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="text-base font-extrabold" style={{ color: BLUE }}>Flowist</span>
          </div>
          <p className="mb-10 text-sm text-slate-500">© {new Date().getFullYear()} Flowist Inc.</p>

          {/* Link grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <h4 className="mb-4 text-base font-bold text-slate-900">Company</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-slate-900">About</a></li>
                <li><a href="#reviews" className="hover:text-slate-900">Reviews</a></li>
                <li><a href="/privacy-policy" className="hover:text-slate-900">Privacy</a></li>
                <li><a href="/terms-and-conditions" className="hover:text-slate-900">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-base font-bold text-slate-900">Download</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="https://apps.apple.com/app/flowist" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">iOS</a></li>
                <li><a href="https://play.google.com/store/apps/details?id=app.lovable.flowist" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Android</a></li>
                <li><button onClick={handleGetStarted} className="hover:text-slate-900">Web App</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-base font-bold text-slate-900">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#how" className="hover:text-slate-900">How it works</a></li>
                <li><a href="#faq" className="hover:text-slate-900">FAQ</a></li>
                <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-base font-bold text-slate-900">Flowist for</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><span>Students</span></li>
                <li><span>Professionals</span></li>
                <li><span>Creators</span></li>
              </ul>
            </div>
          </div>

          {/* Get the app */}
          <div className="mt-14">
            <h4 className="mb-5 text-2xl font-extrabold text-slate-900">Get the app</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://apps.apple.com/app/flowist"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[46px] min-w-[200px] flex-1 items-center justify-center gap-2 rounded-lg bg-black px-6 text-white"
                aria-label="Download on the App Store"
              >
                <svg viewBox="0 0 384 512" className="h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.5 105.7c30.1-35.7 27.4-68.2 26.5-79.9-26.6 1.5-57.4 18.1-74.9 38.5-19.3 21.9-30.6 49-28.2 78.8 28.7 2.2 54.9-12.5 76.6-37.4z"/>
                </svg>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[9px] font-medium opacity-90">Download on the</span>
                  <span className="text-[15px] font-semibold tracking-tight">App Store</span>
                </div>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=app.lovable.flowist"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[46px] min-w-[200px] flex-1 items-center justify-center gap-2 rounded-lg bg-black px-6 text-white"
                aria-label="Get it on Google Play"
              >
                <svg viewBox="0 0 512 512" className="h-6 w-6" aria-hidden="true">
                  <path fill="#00d7fe" d="M99.6 14.4C77.7 21.5 64 41.6 64 67.7v376.6c0 26.1 13.7 46.2 35.6 53.3l217.4-251.8L99.6 14.4z"/>
                  <path fill="#ffce00" d="M396.7 314.2l-79.7-58.4 70.9-82.1 105.4 60.7c19.7 11.4 19.7 39.8 0 51.2l-96.6 28.6z"/>
                  <path fill="#ff3a44" d="M396.7 314.2l-79.7-58.4-217.4 242.6c8.7 2.8 18.8 1.9 28.6-3.7l268.5-180.5z"/>
                  <path fill="#48ff48" d="M99.6 14.4c-9.8-5.6-19.9-6.5-28.6-3.7l245.9 244.7 79.7-82.1L99.6 14.4z"/>
                </svg>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[9px] font-medium opacity-90">GET IT ON</span>
                  <span className="text-[15px] font-semibold tracking-tight">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
