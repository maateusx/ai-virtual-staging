import { Zap, DollarSign, Layers, ShieldCheck } from 'lucide-react';
import { useLang } from './i18n';

const ICONS = [Zap, DollarSign, Layers, ShieldCheck];

// Differentiators as low-key cream cards (docs/design.md feature-card-cream).
export function Differentials() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.diff.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.diff.title}
        </h2>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {t.diff.items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <div key={item.name} className="rounded-lp-lg bg-surface-card p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-lp-md bg-canvas">
                <Icon className="h-5 w-5 text-brand-pink" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-lp-ink">{item.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lp-body">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
