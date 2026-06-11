import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLang } from './i18n';
import { LandingButton } from './LandingButton';

// Interactive savings calculator: outsourced virtual staging (per photo) vs
// decorar.ai. Reference costs live in i18n (roi.legacyPerPhoto / ourPerPhoto)
// so they stay tunable per locale/currency.
export function RoiCalculator() {
  const { t } = useLang();
  const r = t.roi;
  const [photos, setPhotos] = useState(r.defaultPhotos);

  const fmt = (n) =>
    `${r.currency} ${new Intl.NumberFormat(r.locale).format(Math.round(n))}`;

  const legacy = photos * r.legacyPerPhoto;
  const ours = photos * r.ourPerPhoto;
  const savings = legacy - ours;
  const pct = legacy > 0 ? Math.round((savings / legacy) * 100) : 0;

  return (
    <section id="roi" className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="overflow-hidden rounded-lp-xl bg-surface-card">
        <div className="grid gap-10 p-8 md:grid-cols-2 md:gap-12 md:p-12">
          {/* Controls */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
              {r.label}
            </span>
            <h2 className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[36px]">
              {r.title}
            </h2>
            <p className="mt-4 text-[17px] text-lp-body">{r.subtitle}</p>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <label htmlFor="roi-photos" className="text-sm font-medium text-lp-ink">
                  {r.sliderLabel}
                </label>
                <span className="text-2xl font-semibold text-lp-ink">{photos}</span>
              </div>
              <input
                id="roi-photos"
                type="range"
                min={r.minPhotos}
                max={r.maxPhotos}
                step={5}
                value={photos}
                onChange={(e) => setPhotos(Number(e.target.value))}
                className="mt-3 w-full accent-brand-pink"
              />
              <div className="mt-1 flex justify-between text-xs text-lp-muted">
                <span>{r.minPhotos}</span>
                <span>{r.maxPhotos}</span>
              </div>
            </div>

            <div className="mt-8">
              <LandingButton as={Link} to="/app" size="lg">
                {r.cta}
                <ArrowRight className="h-4 w-4" />
              </LandingButton>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col justify-center gap-4">
            <CostRow label={r.legacyLabel} value={fmt(legacy)} suffix={r.perMonth} muted />
            <CostRow label={r.oursLabel} value={fmt(ours)} suffix={r.perMonth} highlight />

            <div className="mt-2 rounded-lp-lg bg-brand-teal p-6 text-white">
              <p className="text-sm font-medium text-white/80">{r.savingsLabel}</p>
              <p className="mt-1 text-[40px] font-semibold leading-none">
                {fmt(savings)}
                <span className="ml-2 align-middle text-base font-medium text-white/80">
                  {r.perMonth} · −{pct}%
                </span>
              </p>
              <p className="mt-3 text-sm text-white/80">
                {r.perYearLabel}: <strong className="text-white">{fmt(savings * 12)}</strong>
              </p>
            </div>

            <p className="mt-1 text-xs text-lp-muted">{r.disclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CostRow({ label, value, suffix, muted, highlight }) {
  return (
    <div className="flex items-center justify-between rounded-lp-md bg-canvas px-5 py-4">
      <span className="text-sm font-medium text-lp-body">{label}</span>
      <span
        className={
          highlight
            ? 'text-xl font-semibold text-brand-pink'
            : muted
              ? 'text-xl font-semibold text-lp-muted line-through'
              : 'text-xl font-semibold text-lp-ink'
        }
      >
        {value}
        <span className="ml-1 text-sm font-normal text-lp-muted">{suffix}</span>
      </span>
    </div>
  );
}
