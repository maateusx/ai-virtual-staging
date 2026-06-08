import { UserRound, Building2, PencilRuler, BedDouble } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from './i18n';

// Audience segments as saturated cards (pink → teal → lavender → peach) so a
// visitor recognizes their own use case. Pink/teal carry white text; lavender/
// peach carry ink text.
const CARDS = [
  { Icon: UserRound, bg: 'bg-brand-pink', text: 'text-white', sub: 'text-white/80', chip: 'bg-white/15 text-white' },
  { Icon: Building2, bg: 'bg-brand-teal', text: 'text-white', sub: 'text-white/75', chip: 'bg-white/15 text-white' },
  { Icon: PencilRuler, bg: 'bg-brand-lavender', text: 'text-lp-ink', sub: 'text-lp-ink/70', chip: 'bg-lp-ink/10 text-lp-ink' },
  { Icon: BedDouble, bg: 'bg-brand-peach', text: 'text-lp-ink', sub: 'text-lp-ink/70', chip: 'bg-lp-ink/10 text-lp-ink' },
];

export function Audience() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] text-lp-muted">
          {t.audience.label}
        </span>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          {t.audience.title}
        </h2>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {t.audience.items.map((item, i) => {
          const c = CARDS[i % CARDS.length];
          const Icon = c.Icon;
          return (
            <div key={item.name} className={cn('flex flex-col rounded-lp-xl p-7', c.bg)}>
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-lp-md', c.chip)}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className={cn('mt-5 text-lg font-semibold', c.text)}>{item.name}</h3>
              <p className={cn('mt-2 text-sm leading-relaxed', c.sub)}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
