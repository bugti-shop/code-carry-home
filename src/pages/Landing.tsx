import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, AlarmClock, Repeat, Sparkles, ListFilter, Keyboard, Share2, Calendar, Kanban, GitBranch, LayoutGrid, StickyNote } from 'lucide-react';
import appLogo from '@/assets/app-logo.webp';
import { setSetting } from '@/utils/settingsStorage';

const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleGetStarted = async () => {
    // Mark landing as seen for this browser, then trigger onboarding (language selection)
    try {
      localStorage.setItem('flowist_landing_seen', 'true');
      await setSetting('onboarding_completed', false);
    } catch {}
    // Dispatch event so App resets onboarding state, then navigate to root
    window.dispatchEvent(new Event('flowistOnboardingReset'));
    navigate('/', { replace: true });
  };

  const handleDownload = () => {
    // Smooth scroll to a download / footer area for now
    const el = document.getElementById('download');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#fdf2f0]/90 backdrop-blur-md border-b border-rose-100/50">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src={appLogo} alt="Flowist" className="h-8 w-8 rounded-lg" />
            <span className="text-2xl font-bold text-blue-600 tracking-tight">Flowist</span>
          </a>
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Open menu"
            className="text-blue-600 p-1"
          >
            {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-rose-100/50 bg-white px-5 py-4 flex flex-col gap-3 text-base">
            <a href="#features" onClick={() => setMenuOpen(false)} className="py-2 text-slate-700">Features</a>
            <a href="#views" onClick={() => setMenuOpen(false)} className="py-2 text-slate-700">Views</a>
            <a href="#sync" onClick={() => setMenuOpen(false)} className="py-2 text-slate-700">Sync</a>
            <a href="#download" onClick={() => setMenuOpen(false)} className="py-2 text-slate-700">Download</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative px-5 py-12 sm:py-20 bg-gradient-to-b from-rose-50 via-blue-50 to-blue-100/60">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
            Plan Smarter
            <br />
            Live Better
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Join thousands of people using Flowist to capture ideas, organize tasks, and build the life they want — one focused day at a time.
          </p>
          <div className="mt-10 flex flex-row items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white text-base font-medium shadow-sm min-w-[160px]"
            >
              Get Started
            </button>
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 active:scale-95 transition text-base font-medium min-w-[160px]"
            >
              Download
            </button>
          </div>

          {/* Hero image placeholder */}
          <div className="mt-14 mx-auto max-w-5xl aspect-[16/10] rounded-3xl bg-white/70 border border-white shadow-2xl shadow-blue-200/40 flex items-center justify-center text-slate-400 text-sm">
            Hero preview image
          </div>
        </div>
      </section>

      {/* Section: Organize everything */}
      <section id="features" className="px-5 py-16 sm:py-24 bg-gradient-to-b from-blue-100/60 to-rose-50">
        <div className="mx-auto max-w-5xl">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm">
            <p className="text-blue-600 font-semibold text-base">Tasks & Notes</p>
            <h2 className="mt-2 text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Organize everything in your life
            </h2>
            <p className="mt-5 text-lg text-slate-700 leading-relaxed">
              Whether it's work projects, personal goals, study plans, or quick notes — Flowist helps you organize and confidently tackle everything in one calm space.
            </p>
            <div className="mt-8 aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
              Tasks & Notes preview
            </div>
          </div>

          <div className="mt-8 bg-white rounded-3xl p-8 sm:p-12 shadow-sm">
            <p className="text-blue-600 font-semibold text-base">Calendar Views</p>
            <h2 className="mt-2 text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Easily plan your schedule
            </h2>
            <p className="mt-5 text-lg text-slate-700 leading-relaxed">
              Switch between yearly, monthly, weekly, daily, and agenda views to plan your time the way that works for you.
            </p>
            <div className="mt-8 aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
              Calendar preview
            </div>
          </div>
        </div>
      </section>

      {/* Section: Powerful features tabs */}
      <section id="views" className="px-5 py-16 sm:py-24 bg-rose-50">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-blue-600 leading-tight">
            Powerful and intuitive features
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
            Simplify your daily planning
          </p>

          <div className="mt-10 flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none snap-x">
            {[
              { icon: Calendar, label: 'Calendar', active: true },
              { icon: Kanban, label: 'Kanban' },
              { icon: GitBranch, label: 'Timeline' },
              { icon: LayoutGrid, label: 'Eisenhower Matrix' },
              { icon: StickyNote, label: 'Sticky Note' },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className={`flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap text-base font-medium snap-start transition ${
                  active
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-10 mx-auto max-w-4xl aspect-[4/3] rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 text-sm">
            View preview
          </div>
        </div>
      </section>

      {/* Section: Comprehensive feature grid */}
      <section className="px-5 py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-blue-600 leading-tight">
              A comprehensive suite of features
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
              Meet your unique needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: AlarmClock, title: 'Smart Reminders', body: 'Persistent and gentle nudges keep you on track without overwhelming you.' },
              { icon: Repeat, title: 'Repeat Tasks', body: 'Flexible recurring rules — daily, weekly, monthly, yearly, or custom — so you never miss a beat.' },
              { icon: Sparkles, title: 'Natural Language', body: 'Type "Buy groceries tomorrow at 9am" and Flowist sets the date, time, and reminder for you.' },
              { icon: ListFilter, title: 'Filters & Tags', body: 'Build custom views like "high-priority this week" to focus on what matters now.' },
              { icon: Keyboard, title: 'Quick Capture', body: 'Lightning-fast input from anywhere — keyboard shortcuts, voice notes, or one-tap add.' },
              { icon: Share2, title: 'Share & Collaborate', body: 'Share lists with family and friends to plan trips, chores, or projects together.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100">
                <Icon className="w-7 h-7 text-slate-800" strokeWidth={1.5} />
                <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Sync */}
      <section id="sync" className="px-5 py-16 sm:py-24 bg-blue-600 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight">Sync across all platforms</h2>
          <p className="mt-5 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Phone, tablet, or desktop — Flowist keeps your tasks and notes in real-time sync so you can pick up exactly where you left off.
          </p>
          <button
            onClick={handleGetStarted}
            className="mt-10 px-10 py-4 rounded-full border-2 border-white text-white text-base font-medium hover:bg-white/10 active:scale-95 transition"
          >
            Download
          </button>

          <div className="mt-14 mx-auto max-w-4xl aspect-[16/10] rounded-2xl bg-blue-500/40 border border-white/20 flex items-center justify-center text-blue-100 text-sm">
            Multi-device preview
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="px-5 py-20 bg-rose-50 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-blue-600 leading-tight">
          Ready to be more productive?
        </h2>
        <div className="mt-10 flex flex-row items-center justify-center gap-4 flex-wrap">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white text-base font-medium min-w-[160px]"
          >
            Get Started
          </button>
          <button
            onClick={handleDownload}
            className="px-8 py-4 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 active:scale-95 transition text-base font-medium min-w-[160px]"
          >
            Download
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-12 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-8">
            <img src={appLogo} alt="Flowist" className="h-8 w-8 rounded-lg" />
            <span className="text-2xl font-bold text-blue-600">Flowist</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-3 text-slate-600">
                <li>Get Started</li>
                <li>Premium</li>
                <li>Features</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-3 text-slate-600">
                <li>Help Center</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-3 text-slate-600">
                <li>Blog</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-600">
                <li><a href="/privacy-policy" className="hover:text-blue-600">Privacy</a></li>
                <li><a href="/terms-and-conditions" className="hover:text-blue-600">Terms</a></li>
              </ul>
            </div>
          </div>
          <p className="mt-10 text-xs text-slate-400 text-center">© {new Date().getFullYear()} Flowist. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
