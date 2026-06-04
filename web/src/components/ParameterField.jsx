import { Palette } from 'lucide-react';
import { CardSelect } from '@/components/ui/CardSelect';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Short, user-facing descriptions for the seeded decoration styles. Keyed by the
// option label (the only handle the public config exposes). Used as a fallback
// when the option itself carries no description — if the backend ever adds a
// `description` field, that takes precedence. New/renamed styles just show no
// description until one is provided.
const OPTION_DESCRIPTIONS = {
  Escandinavo: 'Madeira clara, tons neutros e poucos móveis — clima leve e aconchegante.',
  Moderno: 'Linhas retas, paleta neutra e móveis contemporâneos.',
  Industrial: 'Materiais aparentes, detalhes em metal e tons escuros.',
  Clássico: 'Móveis de madeira elegantes, tons quentes e decoração refinada.',
  Minimalista: 'Poucas peças essenciais e visual limpo, sem excessos.',
};

// Renders one configured parameter on the staging screen.
// single_select -> dropdown; multi_select -> toggle chips.
export function ParameterField({ parameter, value, onChange }) {
  if (parameter.type === 'multi_select') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (id) =>
      onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

    return (
      <div className="space-y-2">
        <Label>{parameter.label}</Label>
        <div className="flex flex-wrap gap-2">
          {parameter.options.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className={cn(
                  'press rounded-pill border px-4 py-2 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border text-foreground hover:bg-secondary'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // single_select
  const options = parameter.options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    description: opt.description ?? OPTION_DESCRIPTIONS[opt.label],
    Icon: Palette,
  }));

  return (
    <div className="space-y-2">
      <Label>{parameter.label}</Label>
      <CardSelect options={options} value={value ?? null} onChange={onChange} />
    </div>
  );
}
