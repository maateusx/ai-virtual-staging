import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from './i18n';

// Physical staging vs decorar.ai comparison table on a soft cream surface.
// Closes the cost/time argument the StatsProof band opens.
export function Comparison() {
  const { t } = useLang();
  return (
    <section className="bg-surface-soft py-20 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.compare.label}
          </span>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            {t.compare.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-lp-body">{t.compare.subtitle}</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-lp-xl bg-canvas">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-lp-hairline/70">
            <div className="p-4 sm:p-5" />
            <div className="p-4 text-center text-xs font-semibold text-lp-muted sm:p-5 sm:text-sm">
              {t.compare.traditionalLabel}
            </div>
            <div className="p-4 text-center text-xs font-semibold text-brand-pink sm:p-5 sm:text-sm">
              {t.compare.oursLabel}
            </div>
          </div>

          {t.compare.rows.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                'grid grid-cols-[1.2fr_1fr_1fr] items-center',
                i % 2 === 1 && 'bg-surface-card/40'
              )}
            >
              <div className="p-4 text-xs font-medium text-lp-ink sm:p-5 sm:text-sm">{row.label}</div>
              <div className="flex items-center justify-center gap-2 p-4 text-center text-xs text-lp-body sm:p-5 sm:text-sm">
                <X className="hidden h-4 w-4 shrink-0 text-lp-muted sm:block" />
                <span>{row.traditional}</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-4 text-center text-xs font-medium text-lp-ink sm:p-5 sm:text-sm">
                <Check className="hidden h-4 w-4 shrink-0 text-brand-teal sm:block" />
                <span>{row.ours}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
