import { nanoid } from 'nanoid';
import { db } from './db';
import type { TargetSet, TemplateItem, WorkoutTemplate } from './types';

/** Programmes préfaits proposés à l'onboarding et importables depuis Programme. */

const reps = (min: number, max: number, count: number): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'normal' as const, repsMin: min, repsMax: max }));

interface PresetDay {
  name: string;
  weekday: number;
  items: [exerciseId: string, sets: TargetSet[]][];
}

export interface ProgramPreset {
  id: string;
  name: string;
  daysLabel: string;
  desc: string;
  days: PresetDay[];
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: 'fullbody-3',
    name: 'Full-body 3 jours',
    daysLabel: 'Lun · Mer · Ven',
    desc: 'Tout le corps à chaque séance. Idéal pour démarrer ou reprendre.',
    days: [
      {
        name: 'Full-body A',
        weekday: 1,
        items: [
          ['squat-barre', reps(6, 8, 3)],
          ['dev-couche-barre', reps(6, 8, 3)],
          ['rowing-machine', reps(8, 10, 3)],
          ['elev-lat-poulie', reps(12, 15, 2)],
          ['curl-halteres', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Full-body B',
        weekday: 3,
        items: [
          ['souleve-roumain', reps(8, 10, 3)],
          ['dev-militaire-barre', reps(6, 8, 3)],
          ['traction-verticale', reps(6, 10, 3)],
          ['leg-extension', reps(10, 12, 2)],
          ['ext-triceps-corde', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Full-body C',
        weekday: 5,
        items: [
          ['presse-cuisses', reps(8, 10, 3)],
          ['dev-couche-halteres', reps(8, 10, 3)],
          ['rowing-haltere-uni', reps(8, 10, 3)],
          ['hip-thrust', reps(8, 10, 2)],
          ['face-pull', reps(12, 15, 2)],
        ],
      },
    ],
  },
  {
    id: 'upper-lower-4',
    name: 'Upper / Lower 4 jours',
    daysLabel: 'Lun · Mar · Jeu · Ven',
    desc: 'Haut et bas du corps en alternance, deux fois chacun.',
    days: [
      {
        name: 'Haut A',
        weekday: 1,
        items: [
          ['dev-couche-barre', reps(6, 8, 3)],
          ['rowing-machine', reps(8, 10, 3)],
          ['dev-militaire-barre', reps(8, 10, 2)],
          ['curl-halteres', reps(10, 12, 2)],
          ['ext-triceps-corde', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Bas A',
        weekday: 2,
        items: [
          ['squat-barre', reps(6, 8, 3)],
          ['souleve-roumain', reps(8, 10, 3)],
          ['leg-extension', reps(12, 15, 2)],
          ['leg-curl', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Haut B',
        weekday: 4,
        items: [
          ['dev-militaire-barre', reps(6, 8, 3)],
          ['traction-verticale', reps(6, 10, 3)],
          ['dev-couche-halteres', reps(8, 10, 3)],
          ['face-pull', reps(12, 15, 2)],
          ['curl-marteau-cuffs', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Bas B',
        weekday: 5,
        items: [
          ['presse-cuisses', reps(8, 10, 3)],
          ['hip-thrust', reps(8, 10, 3)],
          ['fentes-bulgares', reps(8, 10, 2)],
          ['leg-curl', reps(10, 12, 2)],
        ],
      },
    ],
  },
  {
    id: 'ppl-6',
    name: 'Push / Pull / Legs 6 jours',
    daysLabel: 'Lun → Sam',
    desc: 'Le classique haute fréquence pour pratiquants réguliers.',
    days: [
      {
        name: 'Push A',
        weekday: 1,
        items: [
          ['dev-couche-barre', reps(6, 8, 3)],
          ['dev-incline-smith', reps(8, 10, 2)],
          ['elev-lat-poulie', reps(12, 15, 3)],
          ['ext-triceps-corde', reps(10, 12, 3)],
        ],
      },
      {
        name: 'Pull A',
        weekday: 2,
        items: [
          ['traction-verticale', reps(6, 10, 3)],
          ['rowing-haltere-uni', reps(8, 10, 3)],
          ['face-pull', reps(12, 15, 3)],
          ['curl-halteres', reps(10, 12, 3)],
        ],
      },
      {
        name: 'Legs A',
        weekday: 3,
        items: [
          ['squat-barre', reps(6, 8, 3)],
          ['souleve-roumain', reps(8, 10, 3)],
          ['leg-extension', reps(12, 15, 2)],
          ['leg-curl', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Push B',
        weekday: 4,
        items: [
          ['dev-militaire-barre', reps(6, 8, 3)],
          ['dev-couche-halteres', reps(8, 10, 3)],
          ['pec-fly-vav', reps(10, 12, 2)],
          ['ext-triceps-corde', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Pull B',
        weekday: 5,
        items: [
          ['rowing-smith', reps(6, 8, 3)],
          ['rowing-machine', reps(8, 10, 3)],
          ['oiseau-vav-cuffs', reps(12, 15, 2)],
          ['curl-marteau-cuffs', reps(10, 12, 3)],
        ],
      },
      {
        name: 'Legs B',
        weekday: 6,
        items: [
          ['presse-cuisses', reps(8, 10, 3)],
          ['hip-thrust', reps(8, 10, 3)],
          ['fentes-bulgares', reps(8, 10, 2)],
          ['machine-adducteurs', reps(10, 12, 2)],
        ],
      },
    ],
  },
];

/** Le programme d'origine (4 j, focus épaules) proposé aux côtés des génériques. */
export const FORGE_PRESET_META = {
  id: 'forge-4',
  name: 'Forge 4 jours',
  daysLabel: 'Lun · Mer · Ven · Sam',
  desc: 'Épaules · dos/pec · jambes-bras · pec/dos — le programme maison, top-sets et clusters inclus.',
};

export async function applyForgePreset(): Promise<void> {
  const { SEED_TEMPLATES } = await import('./seed');
  const existing = await db.templates.toArray();
  const orderStart = existing.length > 0 ? Math.max(...existing.map((t) => t.order)) + 1 : 0;
  await db.templates.bulkPut(
    SEED_TEMPLATES.map((t, i) => ({ ...t, id: nanoid(), order: orderStart + i })),
  );
}

/** Ajoute les séances du préfait au programme (les exercices viennent du catalogue). */
export async function applyPreset(preset: ProgramPreset): Promise<void> {
  const existing = await db.templates.toArray();
  const orderStart = existing.length > 0 ? Math.max(...existing.map((t) => t.order)) + 1 : 0;
  const templates: WorkoutTemplate[] = preset.days.map((day, i) => ({
    id: nanoid(),
    name: day.name,
    weekdays: [day.weekday],
    order: orderStart + i,
    items: day.items.map(
      ([exerciseId, sets]): TemplateItem => ({ exerciseId, sets }),
    ),
  }));
  await db.templates.bulkPut(templates);
}
