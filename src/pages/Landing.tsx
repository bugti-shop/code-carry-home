import { useState, useEffect } from 'react';
import { Menu, X, Star, Download, Apple, Smartphone, Sparkles, Calendar, Mic, Users, Shield, ChevronRight, Play, BookOpen } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';

const BRAND = '#3c78f0';
const BRAND_DARK = '#2b5dbf';
const BG_TINT = '#eef3fe';
const SOFT_TINT = '#f5f8ff';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Capture', href: '#capture' },
  { label: 'Plan', href: '#plan' },
  { label: 'Focus', href: '#focus' },
  { label: 'Teams', href: '#teams' },
  { label: 'Pricing', href: '#pricing' },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-black/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <AppLogo size="md" />
          <span className="text-[22px] font-extrabold tracking-tight text-[#0f172a]">Flowist</span>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[15px] font-medium text-[#0f172a]/80 hover:text-[#0f172a] transition"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#start"
            className="hidden sm:inline-flex items-center justify-center px-5 h-11 rounded-xl text-white font-bold shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:brightness-105 transition"
            style={{ backgroundColor: BRAND }}
          >
            Start for free
          </a>
          <button
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
            className="h-11 w-11 inline-flex items-center justify-center rounded-lg hover:bg-black/5 transition"
          >
            {open ? <X className="h-6 w-6 text-[#0f172a]" /> : <Menu className="h-6 w-6 text-[#0f172a]" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[16px] font-medium text-[#0f172a] border-b border-black/5 last:border-0"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#start"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center h-12 rounded-xl text-white font-bold"
              style={{ backgroundColor: BRAND }}
            >
              Start for free
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

const Placeholder = ({ label, ratio = 'aspect-[4/3]', tint = BG_TINT }: { label: string; ratio?: string; tint?: string }) => (
  <div
    className={`w-full ${ratio} rounded-[28px] overflow-hidden flex items-center justify-center border border-black/5`}
    style={{ background: `linear-gradient(135deg, ${tint} 0%, #ffffff 100%)` }}
  >
    <div className="flex flex-col items-center gap-2 text-[#0f172a]/40">
      <div className="h-10 w-10 rounded-full border-2 border-dashed border-current" />
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
  </div>
);

const Hero = () => (
  <section id="top" className="relative" style={{ backgroundColor: SOFT_TINT }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
      <h1 className="text-[44px] sm:text-[64px] lg:text-[76px] leading-[1.05] font-extrabold tracking-tight text-[#0f172a] max-w-4xl mx-auto">
        Gain calmness and clarity with the world's most thoughtful productivity app
      </h1>
      <p className="mt-7 text-[18px] sm:text-[20px] text-[#0f172a]/70 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold text-[#0f172a]">374,000+</span>
          <span className="inline-flex" style={{ color: BRAND }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </span>
          reviews on Google Play and App Store
        </span>
      </p>
      <div className="mt-10 flex flex-col items-center gap-5">
        <a
          id="start"
          href="#"
          className="inline-flex items-center justify-center px-10 h-14 rounded-2xl text-white text-[18px] font-bold shadow-[0_6px_0_0_var(--brand-dark)] active:translate-y-[3px] active:shadow-[0_3px_0_0_var(--brand-dark)] transition"
          style={{ backgroundColor: BRAND, ['--brand-dark' as any]: BRAND_DARK }}
        >
          Start for free
        </a>
        <a href="#download" className="inline-flex items-center gap-2 text-[#0f172a]/70 hover:text-[#0f172a] font-medium">
          <Download className="h-5 w-5" />
          Download apps
        </a>
      </div>

      <div className="mt-16 max-w-3xl mx-auto">
        <Placeholder label="Hero product preview" ratio="aspect-[3/4] sm:aspect-[4/3]" />
      </div>
    </div>
  </section>
);

const ClarityIntro = () => (
  <section className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 text-center">
      <h2 className="text-[44px] sm:text-[60px] font-extrabold tracking-tight text-[#0f172a]">Clarity, finally.</h2>
      <p className="mt-6 text-[18px] sm:text-[20px] text-[#0f172a]/70 max-w-2xl mx-auto">
        Join 50+ million professionals who simplify work and life with the world's most beloved to-do list & notes app.
      </p>
      <div className="mt-8 inline-flex items-center gap-3 px-5 h-12 rounded-full border border-black/10 bg-white">
        <Apple className="h-5 w-5" />
        <Smartphone className="h-5 w-5" />
        <span className="text-[#0f172a]/70 text-[15px]">374K+ ★★★★★ reviews</span>
      </div>
    </div>
  </section>
);

const FeatureBlock = ({
  eyebrow,
  title,
  body,
  link,
  reverse = false,
  placeholder,
  eyebrowColor,
  id,
}: {
  eyebrow: string;
  title: string;
  body: string;
  link?: string;
  reverse?: boolean;
  placeholder: string;
  eyebrowColor: string;
  id?: string;
}) => (
  <section id={id} className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
      <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div>
          <p className="text-[15px] font-bold uppercase tracking-wide" style={{ color: eyebrowColor }}>
            {eyebrow}
          </p>
          <h3 className="mt-4 text-[36px] sm:text-[48px] font-extrabold tracking-tight text-[#0f172a] leading-[1.1]">
            {title}
          </h3>
          <p className="mt-6 text-[17px] sm:text-[18px] text-[#0f172a]/70 leading-relaxed max-w-lg">{body}</p>
          {link && (
            <a
              href="#"
              className="mt-6 inline-flex items-center gap-1.5 font-semibold hover:underline"
              style={{ color: BRAND }}
            >
              {link} <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
        <Placeholder label={placeholder} />
      </div>
    </div>
  </section>
);

const VideoBlock = () => (
  <section className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 text-center">
      <p className="font-handwritten text-[20px] text-[#0f172a]/70 italic">Take a peek!</p>
      <p className="text-[24px] font-semibold text-[#0f172a] mt-1 italic">Watch Flowist in action.</p>
      <div className="mt-10 max-w-3xl mx-auto relative">
        <Placeholder label="Product video" ratio="aspect-video" />
        <button
          aria-label="Play video"
          className="absolute inset-0 m-auto h-20 w-32 rounded-2xl bg-[#0f172a]/85 text-white inline-flex items-center justify-center gap-2 font-bold backdrop-blur hover:bg-[#0f172a] transition"
        >
          <Play className="h-5 w-5 fill-current" /> Play
        </button>
      </div>
    </div>
  </section>
);

const SmartFeatures = () => (
  <section id="features" className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <h3 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight text-[#0f172a] leading-[1.1]">
            Smart features that feel magical
          </h3>
          <p className="mt-6 text-[17px] sm:text-[18px] text-[#0f172a]/70 max-w-lg leading-relaxed">
            See how Flowist Assist works intelligently behind the scenes to transform scattered tasks and notes into clear action plans.
          </p>
          <a href="#" className="mt-6 inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: BRAND }}>
            Learn about our thoughtful approach to AI <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="relative">
          <Placeholder label="AI in Flowist" ratio="aspect-[5/4]" />
          <button
            aria-label="Play video"
            className="absolute inset-0 m-auto h-16 w-28 rounded-2xl bg-[#0f172a]/85 text-white inline-flex items-center justify-center gap-2 font-bold"
          >
            <Play className="h-4 w-4 fill-current" /> Play
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Security = () => (
  <section className="bg-white">
    <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-12">
      <div className="rounded-3xl p-10 text-center" style={{ backgroundColor: SOFT_TINT }}>
        <Shield className="h-10 w-10 mx-auto" style={{ color: BRAND }} />
        <h3 className="mt-4 text-[24px] sm:text-[28px] font-extrabold text-[#0f172a]">
          Enterprise-grade security with SOC2 Type II certification.
        </h3>
        <p className="mt-3 text-[16px] text-[#0f172a]/70">
          Flowist meets the compliance standards your company requires, without the complexity.
        </p>
      </div>
    </div>
  </section>
);

const LongHaul = () => (
  <section id="pricing" className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-[15px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>
            In it for the long haul
          </p>
          <h3 className="mt-4 text-[36px] sm:text-[48px] font-extrabold tracking-tight text-[#0f172a] leading-[1.1]">
            A productivity app you can trust for life
          </h3>
          <p className="mt-6 text-[17px] sm:text-[18px] text-[#0f172a]/70 max-w-lg leading-relaxed">
            We've been crafting Flowist with care. Rest assured we'll keep building thoughtfully — never selling out to the highest bidder.
          </p>
          <a href="#" className="mt-6 inline-flex items-center gap-1.5 font-semibold hover:underline" style={{ color: BRAND }}>
            Read about our long-term mission <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-3xl p-8 text-center" style={{ backgroundColor: SOFT_TINT }}>
            <div className="text-[32px] font-extrabold" style={{ color: BRAND }}>160+</div>
            <div className="mt-1 text-[14px] text-[#0f172a]/70 font-medium">countries</div>
          </div>
          <div className="rounded-3xl p-8 text-center" style={{ backgroundColor: SOFT_TINT }}>
            <div className="text-[32px] font-extrabold" style={{ color: BRAND }}>1+ mil</div>
            <div className="mt-1 text-[14px] text-[#0f172a]/70 font-medium">active users</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="bg-white">
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-24 text-center">
      <h2 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight text-[#0f172a] leading-[1.1]">
        Join millions who organize work and life with Flowist
      </h2>
      <a
        href="#"
        className="mt-10 inline-flex items-center justify-center px-10 h-14 rounded-2xl text-white text-[18px] font-bold shadow-[0_6px_0_0_var(--brand-dark)] active:translate-y-[3px] active:shadow-[0_3px_0_0_var(--brand-dark)] transition"
        style={{ backgroundColor: BRAND, ['--brand-dark' as any]: BRAND_DARK }}
      >
        Start for free
      </a>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#0f172a] text-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <div>
        <div className="flex items-center gap-2.5">
          <AppLogo size="md" />
          <span className="text-[20px] font-extrabold">Flowist</span>
        </div>
        <p className="mt-4 text-white/60 text-[14px] leading-relaxed">
          Calmness and clarity for your day. Tasks, notes & focus — all in one place.
        </p>
      </div>
      {[
        { title: 'Product', items: ['Features', 'Pricing', 'Download', 'What\'s new'] },
        { title: 'Company', items: ['About', 'Careers', 'Press', 'Contact'] },
        { title: 'Resources', items: ['Help center', 'Community', 'Privacy', 'Terms'] },
      ].map((col) => (
        <div key={col.title}>
          <div className="text-[13px] font-bold uppercase tracking-wider text-white/50">{col.title}</div>
          <ul className="mt-4 space-y-2.5">
            {col.items.map((i) => (
              <li key={i}>
                <a href="#" className="text-white/80 hover:text-white text-[15px]">{i}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 text-[13px] text-white/50 flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Flowist. All rights reserved.</span>
        <span>Made with care.</span>
      </div>
    </div>
  </footer>
);

const Landing = () => {
  useEffect(() => {
    document.title = 'Flowist — Calmness and clarity for your day';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', "Flowist is the world's most thoughtful productivity app. Capture tasks, plan your week, and stay focused — beautifully.");
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif' }}>
      <Header />
      <main>
        <Hero />
        <ClarityIntro />
        <FeatureBlock
          id="capture"
          eyebrow="Capture at the speed of thought"
          title="Capture tasks at the speed of thought"
          body="We've spent years refining Flowist to be an extension of your mind. Capture and organize tasks instantly using easy-flowing, natural language — by typing or by voice."
          placeholder="Capture screen"
          eyebrowColor="#0f172a"
        />
        <FeatureBlock
          id="focus"
          eyebrow="Focus on what's important"
          title="Stay organized and focused"
          body="Achieve mental clarity by sorting tasks into Today, Upcoming, or using custom filters. See only what you need, when you need it."
          reverse
          placeholder="Focus view"
          eyebrowColor="#0d9488"
        />
        <FeatureBlock
          id="plan"
          eyebrow="Plan with confidence"
          title="Simplify your planning"
          body="Make the most of your time. Schedule due dates, visualize your week in calendar view, and set recurring tasks with ease."
          placeholder="Calendar view"
          eyebrowColor={BRAND}
        />
        <FeatureBlock
          id="teams"
          eyebrow="Organize your teamwork, too"
          title="A home for your team's tasks"
          body="Give your team a shared space to collaborate and stay on top of it all — alongside but separate from your personal tasks and projects."
          reverse
          placeholder="Team workspace"
          eyebrowColor="#0d9488"
        />
        <VideoBlock />
        <SmartFeatures />
        <Security />
        <LongHaul />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
