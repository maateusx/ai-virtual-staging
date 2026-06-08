import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';

// Pre-footer CTA band (docs/design.md cta-band-illustrated).
export function CtaBand() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-20 md:pb-24">
      <div className="rounded-lp-xl bg-surface-soft px-8 py-16 text-center md:py-20">
        <h2 className="mx-auto max-w-2xl text-[28px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.cta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] text-lp-body">{t.cta.subtitle}</p>
        <div className="mt-8 flex justify-center">
          <LandingButton as={Link} to="/app" size="lg">
            {t.cta.button}
            <ArrowRight className="h-4 w-4" />
          </LandingButton>
        </div>
      </div>
    </section>
  );
}
