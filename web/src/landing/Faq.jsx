import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useLang } from './i18n';

// FAQ accordion on a soft cream surface (docs/design.md surface-soft).
// One item open at a time; first item open by default.
export function Faq() {
  const { t } = useLang();
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-surface-soft py-20 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.faq.label}
          </span>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            {t.faq.title}
          </h2>
        </div>

        <div className="mt-12 grid items-start gap-3 md:grid-cols-2">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            const Icon = isOpen ? Minus : Plus;
            return (
              <div key={item.q} className="rounded-lp-lg bg-canvas">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-base font-semibold text-lp-ink">{item.q}</span>
                  <Icon className="h-5 w-5 shrink-0 text-brand-pink" />
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-lp-body">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
