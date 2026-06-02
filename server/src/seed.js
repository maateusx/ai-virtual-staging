// Seeds the suggested starter parameters from spec §3.1.
// Run with: npm run seed   (from repo root: npm run seed)

import { connectDb, disconnectDb } from './db/index.js';
import { StagingParameter } from './models/StagingParameter.js';

const SEED = [
  {
    label: 'Estilo de decoração',
    type: 'single_select',
    order: 0,
    active: true,
    options: [
      {
        label: 'Escandinavo',
        prompt_fragment:
          'in a Scandinavian style with light wood, neutral tones and minimal furniture',
        order: 0,
      },
      {
        label: 'Moderno',
        prompt_fragment:
          'in a modern style with clean lines, neutral palette and contemporary furniture',
        order: 1,
      },
      {
        label: 'Industrial',
        prompt_fragment:
          'in an industrial style with exposed materials, metal accents and dark tones',
        order: 2,
      },
      {
        label: 'Clássico',
        prompt_fragment:
          'in a classic style with elegant wood furniture, warm tones and refined decor',
        order: 3,
      },
      {
        label: 'Minimalista',
        prompt_fragment:
          'in a minimalist style with very few essential pieces and an uncluttered look',
        order: 4,
      },
    ],
  },
  {
    label: 'Tipo de cômodo',
    type: 'single_select',
    order: 1,
    active: true,
    options: [
      { label: 'Sala', prompt_fragment: 'as a living room', order: 0 },
      { label: 'Quarto', prompt_fragment: 'as a bedroom', order: 1 },
      { label: 'Cozinha', prompt_fragment: 'as a kitchen', order: 2 },
      { label: 'Escritório', prompt_fragment: 'as a home office', order: 3 },
    ],
  },
  {
    label: 'Densidade de mobília',
    type: 'single_select',
    order: 2,
    active: true,
    options: [
      { label: 'Leve', prompt_fragment: 'with light furniture density', order: 0 },
      { label: 'Média', prompt_fragment: 'with medium furniture density', order: 1 },
      { label: 'Completa', prompt_fragment: 'with full furniture density', order: 2 },
    ],
  },
];

async function main() {
  await connectDb(console);
  await StagingParameter.deleteMany({});
  const created = await StagingParameter.insertMany(SEED);
  console.log(`Seeded ${created.length} parameters.`);
  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
