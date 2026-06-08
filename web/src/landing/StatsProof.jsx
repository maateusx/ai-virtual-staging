import { useLang } from './i18n';

// Social-proof stats band — market data showing staging sells faster and lifts
// interest, views and showings. Numbers sourced from Exame and NAR (see note).
export function StatsProof() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.stats.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.stats.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] text-lp-body">{t.stats.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {t.stats.items.map((item) => (
          <div key={item.label} className="rounded-lp-lg bg-surface-card p-7 text-center">
            <div className="text-[40px] font-medium leading-none tracking-[-0.02em] text-brand-pink sm:text-[44px]">
              {item.value}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-lp-body">{item.label}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[1px] text-lp-muted">
              {item.source}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-lp-muted">{t.stats.note}</p>
    </section>
  );
}
