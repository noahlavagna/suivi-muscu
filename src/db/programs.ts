import { nanoid } from 'nanoid';
import { db } from './db';
import type { Exercise, TargetSet, TemplateItem, WorkoutTemplate } from './types';

/** Programmes préfaits proposés à l'onboarding et importables depuis Programme. */

const reps = (min: number, max: number, count: number): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'normal' as const, repsMin: min, repsMax: max }));

type ExoSeed = [
  id: string,
  name: string,
  groups: Exercise['muscleGroups'],
  incr: number,
  rest: number,
];

/** Exercices génériques requis par les préfaits (créés seulement s'ils manquent). */
const PRESET_EXERCISES: ExoSeed[] = [
  ['squat-barre', 'Squat barre', ['quadriceps', 'fessiers'], 2.5, 180],
  ['presse-cuisses', 'Presse à cuisses', ['quadriceps', 'fessiers'], 2.5, 150],
  ['rdl-halteres', 'Soulevé de terre roumain haltères', ['ischios', 'fessiers'], 2, 150],
  ['hip-thrust', 'Hip thrust', ['fessiers', 'ischios'], 2.5, 120],
  ['dev-couche-barre', 'Développé couché barre', ['pectoraux', 'triceps'], 2.5, 150],
  ['ohp-barre', 'Développé militaire barre', ['épaules', 'triceps'], 2.5, 150],
  ['rowing-halteres', 'Rowing haltère unilatéral', ['dos'], 2, 120],
  ['tirage-horizontal', 'Tirage horizontal machine', ['dos', 'biceps'], 2.5, 120],
  ['curl-halteres', 'Curl haltères', ['biceps'], 2, 90],
  ['ext-triceps-poulie', 'Extension triceps poulie', ['triceps'], 2.5, 90],
];

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
          ['tirage-horizontal', reps(8, 10, 3)],
          ['elev-lat-poulie', reps(12, 15, 2)],
          ['curl-halteres', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Full-body B',
        weekday: 3,
        items: [
          ['rdl-halteres', reps(8, 10, 3)],
          ['ohp-barre', reps(6, 8, 3)],
          ['traction-verticale', reps(6, 10, 3)],
          ['leg-extension', reps(10, 12, 2)],
          ['ext-triceps-poulie', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Full-body C',
        weekday: 5,
        items: [
          ['presse-cuisses', reps(8, 10, 3)],
          ['dev-couche-halteres', reps(8, 10, 3)],
          ['rowing-halteres', reps(8, 10, 3)],
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
          ['tirage-horizontal', reps(8, 10, 3)],
          ['ohp-barre', reps(8, 10, 2)],
          ['curl-halteres', reps(10, 12, 2)],
          ['ext-triceps-poulie', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Bas A',
        weekday: 2,
        items: [
          ['squat-barre', reps(6, 8, 3)],
          ['rdl-halteres', reps(8, 10, 3)],
          ['leg-extension', reps(12, 15, 2)],
          ['leg-curl', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Haut B',
        weekday: 4,
        items: [
          ['ohp-barre', reps(6, 8, 3)],
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
          ['ext-triceps-poulie', reps(10, 12, 3)],
        ],
      },
      {
        name: 'Pull A',
        weekday: 2,
        items: [
          ['traction-verticale', reps(6, 10, 3)],
          ['rowing-halteres', reps(8, 10, 3)],
          ['face-pull', reps(12, 15, 3)],
          ['curl-halteres', reps(10, 12, 3)],
        ],
      },
      {
        name: 'Legs A',
        weekday: 3,
        items: [
          ['squat-barre', reps(6, 8, 3)],
          ['rdl-halteres', reps(8, 10, 3)],
          ['leg-extension', reps(12, 15, 2)],
          ['leg-curl', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Push B',
        weekday: 4,
        items: [
          ['ohp-barre', reps(6, 8, 3)],
          ['dev-couche-halteres', reps(8, 10, 3)],
          ['pec-fly-vav', reps(10, 12, 2)],
          ['ext-triceps-poulie', reps(10, 12, 2)],
        ],
      },
      {
        name: 'Pull B',
        weekday: 5,
        items: [
          ['rowing-smith', reps(6, 8, 3)],
          ['tirage-horizontal', reps(8, 10, 3)],
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

/** Crée les exercices manquants puis ajoute les séances du préfait au programme. */
export async function applyPreset(preset: ProgramPreset): Promise<void> {
  const missing: Exercise[] = [];
  for (const [id, name, muscleGroups, weightIncrementKg, defaultRestSec] of PRESET_EXERCISES) {
    if (!(await db.exercises.get(id))) {
      missing.push({ id, name, muscleGroups, weightIncrementKg, defaultRestSec, isTimeBased: false });
    }
  }
  if (missing.length > 0) await db.exercises.bulkPut(missing);

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
