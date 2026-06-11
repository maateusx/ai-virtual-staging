import { useLang } from './i18n';
import { LandingBeforeAfter } from './LandingBeforeAfter';
import { cn } from '@/lib/utils';

// Saturated feature cards for the 5 modes (docs/design.md feature-card-*).
// Colors cycle pink → teal → lavender → peach → ochre — never repeating in a
// row. Pink/teal carry white text; lavender/peach/ochre carry ink text.
// Each card carries a draggable before/after slider (like the hero) so the
// transformation for that mode can be revealed in place.
const STYLES = {
  furnish: { bg: 'bg-brand-pink', text: 'text-white', sub: 'text-white/80', before: '/landing/hero-before.jpg', after: '/landing/hero-after.jpg' },
  empty: { bg: 'bg-brand-teal', text: 'text-white', sub: 'text-white/75', before: '/landing/bagunca-antes.jpg', after: '/landing/bagunca-depois.jpg' },
  declutter: { bg: 'bg-brand-lavender', text: 'text-lp-ink', sub: 'text-lp-ink/70', before: '/landing/declutter-before.jpg', after: '/landing/declutter-after.jpg' },
  enhance: { bg: 'bg-brand-peach', text: 'text-lp-ink', sub: 'text-lp-ink/70', before: '/landing/enhance-before.jpg', after: '/landing/enhance-after.jpg' },
  edit: { bg: 'bg-brand-ochre', text: 'text-lp-ink', sub: 'text-lp-ink/70', before: '/landing/hero-before.jpg', after: '/landing/hero-after.jpg' },
  video: { bg: 'bg-brand-pink', text: 'text-white', sub: 'text-white/80', video: '/landing/video-moving.mp4', poster: '/landing/video-moving-poster.jpg' },
};

export function FeatureCards() {
  const { t } = useLang();
  return (
    <section id="features" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.modes.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.modes.title}
        </h2>
        <p className="mt-4 text-[17px] text-lp-body">{t.modes.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.modes.items.map((m) => {
          const s = STYLES[m.key];
          return (
            <div key={m.key} className={cn('flex flex-col rounded-lp-xl p-8', s.bg)}>
              <h3 className={cn('text-xl font-semibold', s.text)}>{m.name}</h3>
              <p className={cn('mt-2 text-sm leading-relaxed', s.sub)}>{m.desc}</p>
              <div className="mt-6">
                {s.video ? (
                  <video
                    className="block aspect-[4/3] w-full rounded-lp-lg bg-surface-strong object-cover"
                    src={s.video}
                    poster={s.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <LandingBeforeAfter
                    before={s.before}
                    after={s.after}
                    beforeLabel={t.hero.before}
                    afterLabel={t.hero.after}
                    imgClassName="block aspect-[4/3] w-full object-cover"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
