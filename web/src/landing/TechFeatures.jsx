import { Crop, Maximize2, Stamp, Brush, FileText, Images } from 'lucide-react';
import { useLang } from './i18n';

// Technical-capabilities grid (output formats, resolution, watermark, mask
// editing, prompt preview, variations) on cream cards — the pro controls that
// the five-mode section doesn't cover.
const ICONS = [Crop, Maximize2, Stamp, Brush, FileText, Images];

export function TechFeatures() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.tech.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.tech.title}
        </h2>
        <p className="mt-4 text-[17px] text-lp-body">{t.tech.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.tech.items.map((item, i) => {
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
