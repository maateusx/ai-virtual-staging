import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';

// Pay-as-you-go pricing: trial · prepaid credits (featured, deep-teal) · BYOK.
// The featured tier follows the design system's "teal = featured pricing tier".
export function Pricing() {
  const { t } = useLang();
  return (
    <section id="pricing" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.pricing.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.pricing.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] text-lp-body">{t.pricing.subtitle}</p>
      </div>

      <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
        {t.pricing.plans.map((plan) => {
          const f = plan.featured;
          return (
            <div
              key={plan.name}
              className={cn('flex flex-col rounded-lp-xl p-8', f ? 'bg-brand-teal' : 'bg-surface-card')}
            >
              {f && (
                <span className="mb-4 inline-flex w-fit items-center rounded-pill bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[1px] text-white">
                  {t.pricing.mostPopular}
                </span>
              )}
              <h3 className={cn('text-lg font-semibold', f ? 'text-white' : 'text-lp-ink')}>
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    'text-[32px] font-medium leading-none tracking-[-0.02em]',
                    f ? 'text-white' : 'text-lp-ink'
                  )}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={cn('text-sm', f ? 'text-white/70' : 'text-lp-muted')}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p className={cn('mt-3 text-sm leading-relaxed', f ? 'text-white/80' : 'text-lp-body')}>
                {plan.desc}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', f ? 'text-brand-mint' : 'text-brand-teal')} />
                    <span className={cn('text-sm', f ? 'text-white/90' : 'text-lp-body')}>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <LandingButton
                  as={Link}
                  to="/app"
                  variant={f ? 'onColor' : 'primary'}
                  className="w-full"
                >
                  {plan.cta}
                </LandingButton>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-lp-muted">{t.pricing.note}</p>
    </section>
  );
}
