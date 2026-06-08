import { Quote } from 'lucide-react';
import { useLang } from './i18n';

// Customer testimonials on cream cards. Quotes are sample placeholders today
// (see t.testimonials.note) — swap for real ones as they come in.
export function Testimonials() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.testimonials.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.testimonials.title}
        </h2>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {t.testimonials.items.map((item) => (
          <figure key={item.name} className="flex flex-col rounded-lp-lg bg-surface-card p-7">
            <Quote className="h-7 w-7 text-brand-pink" fill="currentColor" />
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-lp-body">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-lavender/40 text-sm font-semibold text-lp-ink">
                {item.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-lp-ink">{item.name}</div>
                <div className="text-xs text-lp-muted">{item.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-lp-muted">{t.testimonials.note}</p>
    </section>
  );
}
