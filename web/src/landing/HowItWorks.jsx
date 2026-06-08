import { useLang } from './i18n';

// "How it works" band on a soft cream surface (docs/design.md surface-soft).
export function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="how" className="bg-surface-soft py-20 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.how.label}
          </span>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            {t.how.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {t.how.steps.map((step, i) => (
            <div key={step.name} className="rounded-lp-lg bg-canvas p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lp-ink text-sm font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-lp-ink">{step.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lp-body">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
