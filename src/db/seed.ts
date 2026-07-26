import type Dexie from 'dexie';
import type { Exercise, TargetSet, WorkoutTemplate } from './types';
import { DEFAULT_SETTINGS } from './types';

const reps = (min: number, max: number, count = 1): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'normal' as const, repsMin: min, repsMax: max }));

const backoff = (min: number, max: number, count = 1): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'backoff' as const, repsMin: min, repsMax: max }));

const holds = (sec: number, count: number): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'hold' as const, durationSec: sec }));

type ExoSeed = [
  id: string,
  name: string,
  groups: Exercise['muscleGroups'],
  incr: number,
  rest: number,
  timeBased?: boolean,
  note?: string,
];

const EXERCISES: ExoSeed[] = [
  ['dev-militaire', 'Développé militaire haltères', ['épaules', 'triceps'], 2, 150],
  ['face-pull', 'Face pull corde assis', ['épaules', 'dos'], 2.5, 90],
  ['elev-lat-poulie', 'Élévations latérales poulie unilatérale', ['épaules'], 1, 90],
  ['elev-front-cuffs', 'Élévations frontales cuffs poulie', ['épaules'], 1, 90],
  ['decompression', 'Décompression articulaire', ['mobilité'], 2.5, 45, true],
  ['deadlift-smith', 'Deadlift Smith', ['ischios', 'fessiers', 'dos'], 2.5, 150, false, 'RIR 2/3'],
  ['rowing-smith', 'Rowing Smith', ['dos'], 2.5, 150],
  ['traction-verticale', 'Traction verticale machine', ['dos', 'biceps'], 2.5, 150],
  ['dev-incline-smith', 'Développé incliné Smith', ['pectoraux', 'épaules', 'triceps'], 2.5, 150],
  ['pec-fly-vav', 'Pec fly poulie vis-à-vis', ['pectoraux'], 1, 90],
  ['ecarte-incline-vav', 'Écarté incliné banc 30° poulie', ['pectoraux'], 1, 90],
  ['leg-extension', 'Leg extension', ['quadriceps'], 2.5, 120],
  ['leg-curl', 'Leg curl allongé', ['ischios'], 2.5, 120],
  ['fentes-bulgares', 'Fentes bulgares', ['quadriceps', 'fessiers'], 2, 120],
  ['machine-adducteurs', 'Machine adducteurs', ['adducteurs'], 2.5, 90, false, 'RIR 2/3'],
  ['ext-triceps-barre', 'Extension triceps barre', ['triceps'], 2.5, 90],
  ['overhead-ext-barre', 'Overhead extension barre', ['triceps'], 2.5, 90],
  ['curl-ez-elastique', 'Curl barre EZ + élastique', ['biceps'], 2.5, 90],
  ['curl-marteau-cuffs', 'Curl marteau poulie basse cuffs', ['biceps'], 1, 90],
  ['dev-couche-halteres', 'Développé couché haltères', ['pectoraux', 'triceps'], 2, 150],
  ['dips-lestees', 'Dips lestés', ['pectoraux', 'triceps'], 2.5, 150],
  ['tirage-gorilla', 'Tirage gorilla poulie', ['dos'], 2.5, 90],
  ['oiseau-vav-cuffs', 'Oiseau poulie vis-à-vis cuffs', ['épaules'], 1, 90],
  ['elev-lat-allonge', 'Élévations latérales allongé', ['épaules'], 2, 90],
];

const TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl-epaules',
    name: 'Épaules (lourd)',
    weekdays: [1],
    order: 0,
    items: [
      { exerciseId: 'dev-militaire', sets: reps(6, 8, 2) },
      { exerciseId: 'face-pull', sets: reps(10, 12, 3) },
      { exerciseId: 'elev-lat-poulie', sets: reps(10, 12, 2) },
      { exerciseId: 'elev-front-cuffs', sets: reps(8, 10, 2) },
      { exerciseId: 'decompression', sets: holds(20, 2) },
    ],
  },
  {
    id: 'tpl-dos-pec',
    name: 'Dos · Pec · Delt post',
    weekdays: [3],
    order: 1,
    items: [
      { exerciseId: 'deadlift-smith', sets: reps(15, 15, 2), note: 'RIR 2/3' },
      { exerciseId: 'rowing-smith', sets: reps(5, 8, 2) },
      { exerciseId: 'traction-verticale', sets: reps(5, 8, 2) },
      { exerciseId: 'dev-incline-smith', sets: [...reps(5, 8, 2), ...backoff(10, 12)] },
      {
        exerciseId: 'pec-fly-vav',
        sets: [{ type: 'superlent', repsMin: 3, repsMax: 5 }, ...reps(10, 12)],
      },
      { exerciseId: 'ecarte-incline-vav', sets: reps(8, 10, 2) },
      { exerciseId: 'face-pull', sets: reps(10, 12, 2) },
      { exerciseId: 'decompression', sets: holds(20, 2) },
    ],
  },
  {
    id: 'tpl-jambes-bras',
    name: 'Jambes · Bras',
    weekdays: [5],
    order: 2,
    items: [
      { exerciseId: 'leg-extension', sets: [...reps(6, 9, 2), ...backoff(12, 15)] },
      { exerciseId: 'leg-curl', sets: [...reps(6, 9), ...backoff(10, 12, 2)] },
      { exerciseId: 'fentes-bulgares', sets: reps(6, 9, 2) },
      { exerciseId: 'machine-adducteurs', sets: reps(10, 12, 2), note: 'RIR 2/3' },
      { exerciseId: 'ext-triceps-barre', sets: reps(6, 9) },
      { exerciseId: 'overhead-ext-barre', sets: reps(10, 12, 2) },
      { exerciseId: 'curl-ez-elastique', sets: reps(10, 12) },
      {
        exerciseId: 'curl-marteau-cuffs',
        sets: [
          { type: 'topset', repsMin: 6, repsMax: 9 },
          { type: 'backoff', repsMin: 12, repsMax: 15 },
        ],
      },
      { exerciseId: 'decompression', sets: holds(20, 2) },
    ],
  },
  {
    id: 'tpl-pec-dos-epaules',
    name: 'Pec · Dos · Épaules',
    weekdays: [6],
    order: 3,
    items: [
      { exerciseId: 'dev-couche-halteres', sets: reps(5, 8, 2) },
      {
        exerciseId: 'dev-incline-smith',
        sets: [
          { type: 'cluster', cluster: { reps: 3, count: 3, restSec: 15 } },
          ...reps(6, 8),
        ],
      },
      { exerciseId: 'dips-lestees', sets: reps(5, 8, 2) },
      {
        exerciseId: 'ecarte-incline-vav',
        sets: [
          { type: 'superlent', repsMin: 3, repsMax: 5 },
          { type: 'superlent', repsMin: 3, repsMax: 5 },
        ],
      },
      { exerciseId: 'tirage-gorilla', sets: reps(10, 12, 2) },
      { exerciseId: 'oiseau-vav-cuffs', sets: reps(12, 15, 2) },
      { exerciseId: 'elev-lat-allonge', sets: reps(12, 15, 2) },
      { exerciseId: 'decompression', sets: holds(20, 2) },
    ],
  },
];

export async function seedIfEmpty(db: Dexie): Promise<void> {
  const count = await db.table('exercises').count();
  if (count > 0) {
    // S'assure que les réglages existent même sur une base déjà seedée
    const settings = await db.table('meta').get('settings');
    if (!settings) await db.table('meta').put(DEFAULT_SETTINGS);
    return;
  }
  const exercises: Exercise[] = EXERCISES.map(
    ([id, name, muscleGroups, weightIncrementKg, defaultRestSec, isTimeBased, note]) => ({
      id,
      name,
      muscleGroups,
      weightIncrementKg,
      defaultRestSec,
      isTimeBased: isTimeBased ?? false,
      ...(note ? { note } : {}),
    }),
  );
  await db.transaction('rw', ['exercises', 'templates', 'meta'], async () => {
    await db.table('exercises').bulkPut(exercises);
    await db.table('templates').bulkPut(TEMPLATES);
    await db.table('meta').put(DEFAULT_SETTINGS);
  });
}
