import { useState, useEffect } from 'react';
import { Menu, X, Star, ChevronRight, Play, Shield } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';

const BRAND = '#3c78f0';
const BRAND_DARK = '#2b5dbf';
const BG_TINT = '#eef3fe';
const SOFT_TINT = '#f5f8ff';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=nota.npd.com';
const ONBOARDING_URL = '/onboarding';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Capture', href: '#capture' },
  { label: 'Plan', href: '#plan' },
  { label: 'Focus', href: '#focus' },
  { label: 'Teams', href: '#teams' },
  { label: 'Pricing', href: '#pricing' },
];

const FONT_STACK = '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif';

const GooglePlayButton = ({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const h = size === 'lg' ? 'h-14' : size === 'sm' ? 'h-11' : 'h-12';
  const px = size === 'lg' ? 'px-6' : 'px-5';
  const labelSm = size === 'lg' ? 'text-[11px]' : 'text-[10px]';
  const labelLg = size === 'lg' ? 'text-[18px]' : 'text-[15px]';
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 ${px} ${h} rounded-xl bg-black text-white hover:bg-black/85 transition ${className}`}
    >
      <svg viewBox="0 0 512 512" className={size === 'lg' ? 'h-7 w-7' : 'h-6 w-6'} aria-hidden="true">
        <path fill="#34A853" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z"/>
        <path fill="#FBBC04" d="m104.6 13 220.7 221.3-220.7 221.3c-7.5-3.4-13-10.7-13-19.7V32.7c0-9 5.5-16.3 13-19.7z"/>
        <path fill="#EA4335" d="M385.4 337.8 104.6 499 325.3 277.7l60.1 60.1z"/>
        <path fill="#4285F4" d="m475.8 232.6-90.4-58.4-65.5 65.5 65.5 65.5 92.2-58.4c19-12 19-31.2-1.8-14.2z"/>
      </svg>
      <span className="flex flex-col items-start leading-none">
        <span className={`${labelSm} text-white/75`}>GET IT ON</span>
        <span className={`${labelLg} font-bold mt-0.5`}>Google Play</span>
      </span>
    </a>
  );
};

const Header = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-black/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <AppLogo size="md" />
          <span className="text-[18px] font-extrabold tracking-tight text-[#0f172a]">Flowist</span>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[14px] font-medium text-[#0f172a]/80 hover:text-[#0f172a] transition"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={ONBOARDING_URL}
            className="inline-flex items-center justify-center px-4 sm:px-5 h-10 sm:h-11 rounded-xl text-white text-[14px] sm:text-[15px] font-bold shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:brightness-105 transition"
            style={{ backgroundColor: BRAND }}
          >
            Start for free
          </a>
          <button
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-black/5 transition"
          >
            {open ? <X className="h-5 w-5 text-[#0f172a]" /> : <Menu className="h-5 w-5 text-[#0f172a]" />}
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
                className="py-3 text-[15px] font-medium text-[#0f172a] border-b border-black/5 last:border-0"
              >
                {l.label}
              </a>
            ))}
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center h-12 rounded-xl bg-black text-white font-bold gap-2"
            >
              Get it on Google Play
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

const Placeholder = ({ label, ratio = 'aspect-[4/3]', tint = BG_TINT }: { label: string; ratio?: string; tint?: string }) => (
  <div
    className={`w-full ${ratio} rounded-[24px] overflow-hidden flex items-center justify-center border border-black/5`}
    style={{ background: `linear-gradient(135deg, ${tint} 0%, #ffffff 100%)` }}
  >
    <div className="flex flex-col items-center gap-2 text-[#0f172a]/40">
      <div className="h-9 w-9 rounded-full border-2 border-dashed border-current" />
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
  </div>
);

const Hero = () => (
  <section id="top" className="relative" style={{ backgroundColor: SOFT_TINT }}>
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
      <h1 className="text-[30px] sm:text-[44px] lg:text-[52px] leading-[1.1] font-extrabold tracking-tight text-[#0f172a] max-w-3xl mx-auto">
        Gain calmness and clarity
      </h1>
      <p className="mt-5 text-[15px] sm:text-[16px] text-[#0f172a]/70 max-w-xl mx-auto">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex" style={{ color: BRAND }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </span>
          Reviews on Google Play and App Store
        </span>
      </p>
      <div className="mt-8 flex flex-col items-center gap-4">
        <a
          id="start"
          href={ONBOARDING_URL}
          className="inline-flex items-center justify-center px-9 h-12 sm:h-13 rounded-2xl text-white text-[16px] font-bold shadow-[0_5px_0_0_var(--brand-dark)] active:translate-y-[2px] active:shadow-[0_3px_0_0_var(--brand-dark)] transition"
          style={{ backgroundColor: BRAND, ['--brand-dark' as any]: BRAND_DARK }}
        >
          Start for free
        </a>
        <GooglePlayButton />
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <Placeholder label="Hero product preview" ratio="aspect-[3/4] sm:aspect-[4/3]" />
      </div>
    </div>
  </section>
);

const ClarityIntro = () => (
  <section className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
      <h2 className="text-[28px] sm:text-[40px] font-extrabold tracking-tight text-[#0f172a]">Clarity, finally.</h2>
      <p className="mt-5 text-[15px] sm:text-[16px] text-[#0f172a]/70 max-w-xl mx-auto">
        A calm, focused space to organize your work and life — designed to help you think clearly.
      </p>
      <div className="mt-7 inline-flex items-center gap-3 px-5 h-11 rounded-full border border-black/10 bg-white">
        <span className="text-[#0f172a]/70 text-[13px]">★★★★★ Reviews on Google Play & App Store</span>
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
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
      <div className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: eyebrowColor }}>
            {eyebrow}
          </p>
          <h3 className="mt-3 text-[24px] sm:text-[34px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
            {title}
          </h3>
          <p className="mt-5 text-[15px] sm:text-[16px] text-[#0f172a]/70 leading-relaxed max-w-lg">{body}</p>
          {link && (
            <a
              href="#"
              className="mt-5 inline-flex items-center gap-1.5 font-semibold text-[14px] hover:underline"
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
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 text-center">
      <p className="text-[16px] text-[#0f172a]/70 italic">Take a peek!</p>
      <p className="text-[20px] font-semibold text-[#0f172a] mt-1 italic">Watch Flowist in action.</p>
      <div className="mt-8 max-w-3xl mx-auto relative">
        <Placeholder label="Product video" ratio="aspect-video" />
        <button
          aria-label="Play video"
          className="absolute inset-0 m-auto h-16 w-24 rounded-2xl bg-[#0f172a]/85 text-white inline-flex items-center justify-center gap-2 font-bold backdrop-blur hover:bg-[#0f172a] transition"
        >
          <Play className="h-4 w-4 fill-current" /> Play
        </button>
      </div>
    </div>
  </section>
);

const SmartFeatures = () => (
  <section id="features" className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <h3 className="text-[24px] sm:text-[34px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
            Smart features that feel magical
          </h3>
          <p className="mt-5 text-[15px] sm:text-[16px] text-[#0f172a]/70 max-w-lg leading-relaxed">
            See how Flowist Assist works intelligently behind the scenes to transform scattered tasks and notes into clear action plans.
          </p>
          <a href="#" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-[14px] hover:underline" style={{ color: BRAND }}>
            Learn about our thoughtful approach to AI <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="relative">
          <Placeholder label="AI in Flowist" ratio="aspect-[5/4]" />
          <button
            aria-label="Play video"
            className="absolute inset-0 m-auto h-14 w-24 rounded-2xl bg-[#0f172a]/85 text-white inline-flex items-center justify-center gap-2 font-bold"
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
    <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-10">
      <div className="rounded-3xl p-8 text-center" style={{ backgroundColor: SOFT_TINT }}>
        <Shield className="h-9 w-9 mx-auto" style={{ color: BRAND }} />
        <h3 className="mt-3 text-[18px] sm:text-[22px] font-extrabold text-[#0f172a]">
          Enterprise-grade security with SOC2 Type II certification.
        </h3>
        <p className="mt-2 text-[14px] text-[#0f172a]/70">
          Flowist meets the compliance standards your company requires, without the complexity.
        </p>
      </div>
    </div>
  </section>
);

const LongHaul = () => (
  <section id="pricing" className="bg-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>
            In it for the long haul
          </p>
          <h3 className="mt-3 text-[24px] sm:text-[34px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
            A productivity app you can trust for life
          </h3>
          <p className="mt-5 text-[15px] sm:text-[16px] text-[#0f172a]/70 max-w-lg leading-relaxed">
            We've been crafting Flowist with care. Rest assured we'll keep building thoughtfully — never selling out to the highest bidder.
          </p>
          <a href="#" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-[14px] hover:underline" style={{ color: BRAND }}>
            Read about our long-term mission <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-3xl p-7 text-center" style={{ backgroundColor: SOFT_TINT }}>
            <div className="text-[20px] font-extrabold text-[#0f172a]">Built with care</div>
            <div className="mt-1 text-[13px] text-[#0f172a]/70 font-medium">in every detail</div>
          </div>
          <div className="rounded-3xl p-7 text-center" style={{ backgroundColor: SOFT_TINT }}>
            <div className="text-[20px] font-extrabold" style={{ color: BRAND }}>Loved worldwide</div>
            <div className="mt-1 text-[13px] text-[#0f172a]/70 font-medium">by everyday creators</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="bg-white">
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20 text-center">
      <h2 className="text-[26px] sm:text-[40px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
        Organize your work and life with Flowist
      </h2>
      <div className="mt-8 flex flex-col items-center gap-4">
        <a
          href={ONBOARDING_URL}
          className="inline-flex items-center justify-center px-9 h-12 sm:h-13 rounded-2xl text-white text-[16px] font-bold shadow-[0_5px_0_0_var(--brand-dark)] active:translate-y-[2px] active:shadow-[0_3px_0_0_var(--brand-dark)] transition"
          style={{ backgroundColor: BRAND, ['--brand-dark' as any]: BRAND_DARK }}
        >
          Start for free
        </a>
        <GooglePlayButton />
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#0f172a] text-white">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2.5">
          <AppLogo size="md" />
          <span className="text-[17px] font-extrabold">Flowist</span>
        </div>
        <p className="mt-3 text-white/60 text-[13px] leading-relaxed max-w-sm">
          Calmness and clarity for your day. Tasks, notes & focus — all in one place.
        </p>
      </div>
      {[
        { title: 'Product', items: ['Features', 'Pricing', 'What\'s new'] },
        { title: 'Company', items: ['About', 'Careers', 'Contact'] },
        { title: 'Resources', items: ['Help center', 'Privacy', 'Terms'] },
      ].map((col) => (
        <div key={col.title}>
          <div className="text-[12px] font-bold uppercase tracking-wider text-white/50">{col.title}</div>
          <ul className="mt-3 space-y-2">
            {col.items.map((i) => (
              <li key={i}>
                <a href="#" className="text-white/80 hover:text-white text-[14px]">{i}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <div className="text-[12px] font-bold uppercase tracking-wider text-white/50">Get the app</div>
        <div className="mt-3">
          <GooglePlayButton size="sm" />
        </div>
        <p className="mt-3 text-white/50 text-[12px] leading-relaxed">
          Available now on Android.
        </p>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 text-[12px] text-white/50 flex flex-wrap items-center justify-between gap-3">
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

    // Inject Plus Jakarta Sans
    const id = 'plus-jakarta-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]" style={{ fontFamily: FONT_STACK }}>
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
