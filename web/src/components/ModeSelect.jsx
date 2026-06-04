import { Sofa, Eraser, PackageOpen, Sparkles, Paintbrush } from 'lucide-react';
import { CardSelect } from '@/components/ui/CardSelect';

// Icon + short description shown on each mode card. Keyed by mode id; falls back
// to a generic icon / the mode label when a mode isn't mapped here.
const MODE_META = {
  furnish: {
    Icon: Sofa,
    description: 'Adiciona móveis e decoração ao ambiente vazio.',
  },
  empty: {
    Icon: Eraser,
    description: 'Remove todos os móveis e decoração, deixando o ambiente vazio e limpo.',
  },
  declutter: {
    Icon: PackageOpen,
    description: 'Mantém apenas o mínimo dos móveis originais, removendo o excesso.',
  },
  enhance: {
    Icon: Sparkles,
    description:
      'Mantém a foto como está e devolve em maior nitidez e resolução — sem alterar o conteúdo.',
  },
  edit: {
    Icon: Paintbrush,
    description: 'Pinte uma área da foto e descreva a alteração — só ela muda, o resto fica intacto.',
  },
};

export function ModeSelect({ modes, value, onChange, disabled }) {
  const options = modes.map((m) => ({
    id: m.id,
    label: m.label,
    Icon: MODE_META[m.id]?.Icon ?? Sofa,
    description: MODE_META[m.id]?.description,
  }));

  return <CardSelect options={options} value={value} onChange={onChange} disabled={disabled} />;
}
