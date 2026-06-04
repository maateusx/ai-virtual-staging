import { Move, Footprints, MoveHorizontal, Orbit, ZoomOut } from 'lucide-react';
import { CardSelect } from '@/components/ui/CardSelect';

// Icon + short description per camera-motion preset. Keyed by motion id; falls
// back to a generic icon / the motion label when a preset isn't mapped here.
const MOTION_META = {
  still: {
    Icon: Move,
    description: 'Movimento mínimo, como se a foto ganhasse vida suavemente.',
  },
  walk: {
    Icon: Footprints,
    description: 'A câmera avança devagar, como alguém caminhando pelo ambiente.',
  },
  pan: {
    Icon: MoveHorizontal,
    description: 'A câmera percorre o ambiente na horizontal, de um lado ao outro.',
  },
  orbit: {
    Icon: Orbit,
    description: 'Um leve arco lateral que dá profundidade e dimensão à cena.',
  },
  pullback: {
    Icon: ZoomOut,
    description: 'A câmera se afasta aos poucos, revelando mais do ambiente.',
  },
};

// Every preset keeps the room unchanged — only the camera moves — so there's no
// free-form "describe the scene" here.
export function MotionSelect({ motions, value, onChange, disabled }) {
  const options = motions.map((m) => ({
    id: m.id,
    label: m.label,
    Icon: MOTION_META[m.id]?.Icon ?? Move,
    description: MOTION_META[m.id]?.description,
  }));

  return <CardSelect options={options} value={value} onChange={onChange} disabled={disabled} />;
}
