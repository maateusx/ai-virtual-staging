import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
  return (
    <div className="space-y-2">
      <Label>{parameter.label}</Label>
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione…" />
        </SelectTrigger>
        <SelectContent>
          {parameter.options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
