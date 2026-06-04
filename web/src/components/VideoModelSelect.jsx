import { Film } from 'lucide-react';
import { CardSelect } from '@/components/ui/CardSelect';

// Cheapest 720p rate for a model, used as the "from $X/s" hint on each card.
function fromRate(model) {
  const rates = Object.values(model.price_per_second_usd ?? {});
  if (!rates.length) return null;
  return Math.min(...rates);
}

function modelHint(model) {
  const rate = fromRate(model);
  const res = (model.resolutions ?? []).join('/');
  const audio = model.supports_audio ? 'com áudio' : 'sem áudio';
  const price = rate != null ? `a partir de $${rate.toFixed(2)}/s` : '';
  return [res, audio, price].filter(Boolean).join(' · ');
}

// Lists the available video models with their resolution/audio/price hint as the
// card description.
export function VideoModelSelect({ models, value, onChange, disabled }) {
  const options = models.map((m) => ({
    id: m.id,
    label: m.label,
    description: modelHint(m),
    Icon: Film,
  }));

  return <CardSelect options={options} value={value} onChange={onChange} disabled={disabled} />;
}
