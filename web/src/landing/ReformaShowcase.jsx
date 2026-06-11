import { Link } from 'react-router-dom';
import { Sparkles, Paintbrush, Eye, ArrowRight } from 'lucide-react';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';
import { ProcessTimeline } from './ProcessTimeline';

const BULLET_ICONS = [Sparkles, Paintbrush, Eye];

// Renovation feature band — mirror of VideoShowcase, for the photo→reforma
// capability. Layout is flipped (media on the left on desktop) to give the two
// video bands visual rhythm. The clip gets a slight zoom to crop the pillarbox
// bars baked into the source file.
export function ReformaShowcase() {
  const { t } = useLang();
  return (
    <section id="reforma" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:order-1">
          <ProcessTimeline
            image="/landing/video-reforma-poster.jpg"
            video="/landing/video-reforma.mp4"
            labels={t.video.steps}
            mediaClassName="scale-[1.22]"
            compactPhoto
          />
        </div>

        <div className="lg:order-2">
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.reforma.label}
          </span>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            {t.reforma.title}
          </h2>
          <p className="mt-4 max-w-xl text-[17px] text-lp-body">{t.reforma.subtitle}</p>

          <ul className="mt-8 space-y-5">
            {t.reforma.bullets.map((b, i) => {
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
              {t.reforma.cta}
              <ArrowRight className="h-4 w-4" />
            </LandingButton>
          </div>
        </div>
      </div>
    </section>
  );
}
