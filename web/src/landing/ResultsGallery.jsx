import { useState } from 'react';
import { useLang } from './i18n';
import { LandingBeforeAfter } from './LandingBeforeAfter';
import { cn } from '@/lib/utils';

// Large, tabbed before/after viewer. Complements FeatureCards (which shows a
// small slider per mode in a grid) with one immersive viewer you switch between
// modes — same real assets from /public/landing, keyed by mode.
const MODE_MEDIA = {
  furnish: { before: '/landing/hero-antes.jpg', after: '/landing/hero-depois.jpg' },
  empty: { before: '/landing/bagunca-antes.jpg', after: '/landing/bagunca-depois.jpg' },
  declutter: { before: '/landing/bagunca-antes.jpg', after: '/landing/bagunca-depois.jpg' },
  enhance: { before: '/landing/enhance-before.jpg', after: '/landing/enhance-after.jpg' },
  edit: { before: '/landing/furnish-before.jpg', after: '/landing/furnish-after.jpg' },
};

export function ResultsGallery() {
  const { t } = useLang();
  const modes = t.modes.items;
  const [active, setActive] = useState(modes[0].key);
  const current = modes.find((m) => m.key === active) ?? modes[0];
  const media = MODE_MEDIA[active];

  return (
    <section id="gallery" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.gallery.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.gallery.title}
        </h2>
        <p className="mt-4 text-[17px] text-lp-body">{t.gallery.subtitle}</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActive(m.key)}
            aria-pressed={m.key === active}
            className={cn(
              'rounded-pill px-4 py-2 text-sm font-medium transition-colors',
              m.key === active
                ? 'bg-brand-pink text-white'
                : 'bg-surface-card text-lp-body hover:bg-surface-strong',
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <LandingBeforeAfter
          key={active}
          before={media.before}
          after={media.after}
          beforeLabel={t.hero.before}
          afterLabel={t.hero.after}
          imgClassName="block aspect-[4/3] w-full object-cover"
        />
        <p className="mt-4 text-center text-[15px] text-lp-body">{current.desc}</p>
      </div>
    </section>
  );
}
