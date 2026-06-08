import { ShieldCheck, KeyRound, UserCheck, Zap } from 'lucide-react';
import { useLang } from './i18n';

// Trust / privacy band on a soft cream surface — no-training, BYOK key locality,
// no-signup trial, instant delivery. Teal icons signal "safe".
const ICONS = [ShieldCheck, KeyRound, UserCheck, Zap];

export function TrustPrivacy() {
  const { t } = useLang();
  return (
    <section className="bg-surface-soft py-20 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
            {t.privacy.label}
          </span>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            {t.privacy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-lp-body">{t.privacy.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.privacy.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={item.name} className="rounded-lp-lg bg-canvas p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-lp-md bg-surface-card">
                  <Icon className="h-5 w-5 text-brand-teal" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-lp-ink">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-lp-body">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
