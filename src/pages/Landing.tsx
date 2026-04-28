import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, CheckCircle2, Calendar, Bell, Repeat, StickyNote, ListTodo, Cloud, Lock, Sparkles, Mic, Folder, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { setSetting } from '@/utils/settingsStorage';

const features = [
  { icon: ListTodo, title: 'Smart Tasks', desc: 'Capture tasks instantly with priorities, due dates and reminders that actually work.' },
  { icon: StickyNote, title: 'Rich Notes', desc: 'Write notes, sketches, checklists, code snippets and receipts — all in one place.' },
  { icon: Calendar, title: 'Calendar View', desc: 'See your day, week or month at a glance. Plan ahead without the chaos.' },
  { icon: Bell, title: 'Smart Reminders', desc: 'Get nudged at the right time so nothing important slips through.' },
  { icon: Repeat, title: 'Habits & Streaks', desc: 'Build daily habits, keep streaks alive and celebrate every milestone.' },
  { icon: BarChart3, title: 'Progress Insights', desc: 'Track your productivity score and weekly review at a glance.' },
  { icon: Folder, title: 'Folders & Tags', desc: 'Organize everything your way with custom folders, colors and tags.' },
  { icon: Cloud, title: 'Cloud Sync', desc: 'Sync securely across devices with Google Drive backup. Never lose a thing.' },
  { icon: Lock, title: 'Private & Secure', desc: 'App lock, biometrics and end-to-end privacy. Your data stays yours.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleGetStarted = async () => {
    // Force onboarding to show after redirect
    await setSetting('onboarding_completed', false);
    try {
      // Persist landing dismissal across refresh & background resume
      sessionStorage.setItem('flowist_landing_acknowledged', 'true');
      localStorage.setItem('flowist_landing_acknowledged', 'true');
    } catch {}
    window.dispatchEvent(new Event('flowistLandingDismissed'));
    navigate('/');
  };

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Why Flowist', href: '#why' },
    { label: 'Get Started', onClick: handleGetStarted },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <AppLogo size="md" />
            <span className="text-xl font-bold tracking-tight">Flowist</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) =>
              item.href ? (
                <a key={item.label} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </a>
              ) : (
                <Button key={item.label} onClick={item.onClick} className="rounded-full px-6">
                  {item.label}
                </Button>
              )
            )}
          </nav>

          {/* Hamburger - mobile */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-2">
                {navItems.map((item) =>
                  item.href ? (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Button
                      key={item.label}
                      onClick={() => {
                        setMenuOpen(false);
                        item.onClick?.();
                      }}
                      className="mt-4 rounded-full"
                    >
                      {item.label}
                    </Button>
                  )
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            All your tasks, notes & habits in one calm place
          </div>
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Stay organized.<br />
            <span className="text-primary">Stay in flow.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Flowist helps you capture tasks, take beautiful notes, build daily habits and plan your time — without the noise. Simple, fast and made for real life.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={handleGetStarted} className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto">
              Get Started — It's Free
            </Button>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 w-full rounded-full px-8 text-base sm:w-auto">
                See Features
              </Button>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Works offline</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Private by default</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card to try</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/50 bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Everything you need to get things done</h2>
            <p className="text-muted-foreground">A complete toolkit for tasks, notes, habits and reminders — without juggling 5 apps.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Built to keep your day simple</h2>
          <p className="mx-auto mb-10 max-w-2xl text-muted-foreground">
            No clutter. No endless menus. Just a clean space to plan, write and finish what matters most.
          </p>
          <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {[
              { t: 'Fast & lightweight', d: 'Opens instantly. Works even when your internet doesn\'t.' },
              { t: 'Designed to feel calm', d: 'A minimal interface that helps you focus instead of getting distracted.' },
              { t: 'Yours forever', d: 'Export, backup and own your data. No lock-in, ever.' },
            ].map(({ t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-2 text-lg font-semibold">{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-primary/5 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to take back your day?</h2>
          <p className="mb-8 text-muted-foreground">Join people using Flowist to plan smarter, write freely and build habits that stick.</p>
          <Button size="lg" onClick={handleGetStarted} className="h-12 rounded-full px-10 text-base font-semibold">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="text-sm font-semibold">Flowist</span>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="/privacy-policy" className="hover:text-foreground">Privacy</a>
            <a href="/terms-and-conditions" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
