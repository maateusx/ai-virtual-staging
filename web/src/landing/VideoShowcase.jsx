import { Link } from 'react-router-dom';
import { Play, Camera, Film, Share2, ArrowRight } from 'lucide-react';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';

const BULLET_ICONS = [Camera, Film, Share2];

// Video feature band — sells the photo→video capability (the /app/video page),
// which the rest of the landing doesn't surface. Deep-teal media card on the
// right per the design system; the poster is a decorative stand-in (no asset).
export function VideoShowcase() {
  const { t } = useLang();
  return (
    <section id="video" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.video.label}
          </span>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            {t.video.title}
          </h2>
          <p className="mt-4 max-w-xl text-[17px] text-lp-body">{t.video.subtitle}</p>

          <ul className="mt-8 space-y-5">
            {t.video.bullets.map((b, i) => {
              const Icon = BULLET_ICONS[i];
              return (
                <li key={b.name} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lp-md bg-surface-card">
                    <Icon className="h-5 w-5 text-brand-pink" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-lp-ink">{b.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-lp-body">{b.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8">
            <LandingButton as={Link} to="/app/video" size="lg">
              {t.video.cta}
              <ArrowRight className="h-4 w-4" />
            </LandingButton>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-lp-xl bg-brand-teal">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.18), transparent 60%)',
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-popover">
              <Play className="h-6 w-6 translate-x-0.5 text-brand-teal" fill="currentColor" />
            </div>
            <p className="text-sm font-medium text-white/80">{t.video.caption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
