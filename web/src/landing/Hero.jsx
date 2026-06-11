import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Hammer,
  Ruler,
  PaintRoller,
  Sofa,
  Lamp,
  HardHat,
  PencilRuler,
} from 'lucide-react';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';
import { LandingBeforeAfter } from './LandingBeforeAfter';

// Decorative renovation/planning icons floating over the hero grid. Each sits
// in a soft brand-tinted chip with a staggered float animation. Hidden on
// small screens to keep the mobile hero uncluttered.
const HERO_ICONS = [
  { Icon: PaintRoller, color: 'bg-brand-pink/15 text-brand-pink', pos: 'left-[1%] top-[14%]', rotate: '-8deg', anim: 'animate-drift', delay: '0s' },
  { Icon: Ruler, color: 'bg-brand-teal/10 text-brand-teal', pos: 'left-[3%] top-[58%]', rotate: '6deg', anim: 'animate-sway', delay: '1.2s' },
  { Icon: Hammer, color: 'bg-brand-ochre/15 text-brand-ochre', pos: 'left-[10%] bottom-[10%]', rotate: '-5deg', anim: 'animate-bob', delay: '2.1s' },
  { Icon: HardHat, color: 'bg-brand-coral/15 text-brand-coral', pos: 'right-[2%] top-[10%]', rotate: '7deg', anim: 'animate-float', delay: '0.6s' },
  { Icon: PencilRuler, color: 'bg-brand-lavender/20 text-brand-lavender', pos: 'right-[1%] top-[46%]', rotate: '-6deg', anim: 'animate-drift', delay: '1.8s' },
  { Icon: Sofa, color: 'bg-brand-mint/20 text-brand-teal', pos: 'right-[9%] bottom-[8%]', rotate: '5deg', anim: 'animate-float-slow', delay: '2.6s' },
  { Icon: Lamp, color: 'bg-brand-peach/20 text-brand-peach', pos: 'left-[46%] bottom-[9%]', rotate: '4deg', anim: 'animate-sway', delay: '3.1s' },
];

const GRID_LINES =
  'linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px)';
const GRID_LINES_STRONG =
  'linear-gradient(to right, rgba(255,77,139,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,77,139,0.45) 1px, transparent 1px)';

// Hero band (docs/design.md `hero-band`): 7/5 grid — copy + CTAs left,
// before/after artifact right. Stacks on mobile.
export function Hero() {
  const { t } = useLang();
  const spotlightRef = useRef(null);

  // Track the cursor as CSS variables on the spotlight layer so the highlight
  // follows the mouse without triggering React re-renders.
  function handlePointerMove(e) {
    const el = spotlightRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    el.style.opacity = '1';
  }

  function handlePointerLeave() {
    const el = spotlightRef.current;
    if (el) el.style.opacity = '0';
  }

  return (
    <section
      id="top"
      className="relative -mt-16 overflow-hidden pt-16"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Checkered grid background — subtle hairline cells, faded toward the
          edges so it sits quietly behind the hero content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: GRID_LINES,
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 35%, #000 50%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 35%, #000 50%, transparent 100%)',
        }}
      />
      {/* Interactive spotlight — brighter grid lines revealed in a radial
          pool around the cursor. Driven by --mx/--my set on pointer move. */}
      <div
        ref={spotlightRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          backgroundImage: GRID_LINES_STRONG,
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(circle 180px at var(--mx, -1000px) var(--my, -1000px), #000 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(circle 180px at var(--mx, -1000px) var(--my, -1000px), #000 0%, transparent 70%)',
        }}
      />
      {/* Floating renovation/planning icons (decorative). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {HERO_ICONS.map(({ Icon, color, pos, rotate, anim, delay }, i) => (
          <div key={i} className={`absolute ${pos}`} style={{ transform: `rotate(${rotate})` }}>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lp-lg shadow-popover backdrop-blur-sm ${anim} ${color}`}
              style={{ animationDelay: delay }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </div>
        ))}
      </div>
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-6 pb-16 pt-12 md:pb-24 md:pt-20 lg:grid-cols-[9fr_12fr] lg:gap-10">
        <div>
          <span className="inline-flex items-center rounded-pill bg-surface-card px-3 py-1 text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.hero.badge}
          </span>
          <h1 className="mt-5 text-[40px] font-medium leading-[1.05] tracking-[-0.025em] text-lp-ink sm:text-[56px] lg:text-[64px]">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-lp-body">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LandingButton as={Link} to="/app" size="lg">
              {t.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </LandingButton>
            <LandingButton as="a" href="#how" variant="secondary" size="lg">
              {t.hero.ctaSecondary}
            </LandingButton>
          </div>
        </div>

        <div className="rounded-lp-xl bg-surface-soft p-3 sm:p-4">
          <LandingBeforeAfter
            before="/landing/hero-antes.jpg"
            after="/landing/hero-depois.jpg"
            beforeLabel={t.hero.before}
            afterLabel={t.hero.after}
          />
          <p className="mt-3 text-center text-xs text-lp-muted">{t.hero.caption}</p>
        </div>
      </div>
    </section>
  );
}
