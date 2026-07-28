import type Dexie from 'dexie';
import type { Exercise, TargetSet, WorkoutTemplate } from './types';
import { DEFAULT_SETTINGS } from './types';
import { CATALOGUE } from './catalogue';

const reps = (min: number, max: number, count = 1): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'normal' as const, repsMin: min, repsMax: max }));

const backoff = (min: number, max: number, count = 1): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'backoff' as const, repsMin: min, repsMax: max }));

const holds = (sec: number, count: number): TargetSet[] =>
  Array.from({ length: count }, () => ({ type: 'hold' as const, durationSec: sec }));

/** Le programme d'origine de l'app — proposé comme préfait « Forge 4 jours ». */
export const SEED_TEMPLATES: WorkoutTemplate[] = [
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

/**
 * Aligne la base sur le catalogue livré avec l'app, à chaque lancement.
 *
 * Remplace l'ancien `seedIfEmpty`, qui ne remplissait que les bases vierges :
 * une base déjà installée n'aurait jamais vu les nouveaux exercices.
 *
 * Deux règles, pour ne rien casser chez l'utilisateur :
 *  - un exercice déjà présent n'est jamais réécrit (nom, groupes, incrément,
 *    repos, archivage lui appartiennent) ; on ne complète que les champs
 *    ajoutés depuis, restés `undefined` ;
 *  - un exercice archivé n'est pas ressuscité, puisqu'on ne le réinsère pas.
 */
export async function syncCatalogue(db: Dexie): Promise<void> {
  const table = db.table<Exercise>('exercises');
  const existing = await table.toArray();
  const known = new Map(existing.map((e) => [e.id, e]));

  const toAdd = CATALOGUE.filter((e) => !known.has(e.id));

  // Champs apparus avec le catalogue : on les rétro-remplit sans rien écraser
  const toPatch: Exercise[] = [];
  for (const current of existing) {
    const ref = CATALOGUE.find((c) => c.id === current.id);
    const patch: Partial<Exercise> = {};
    if (current.equipment === undefined) patch.equipment = ref?.equipment ?? 'autre';
    if (current.family === undefined)
      patch.family = ref?.family ?? (current.isTimeBased ? 'mobilité' : 'isolation');
    if (current.aliases === undefined && ref?.aliases) patch.aliases = ref.aliases;
    if (Object.keys(patch).length > 0) toPatch.push({ ...current, ...patch });
  }

  if (toAdd.length === 0 && toPatch.length === 0) {
    const settings = await db.table('meta').get('settings');
    if (!settings) await db.table('meta').put(DEFAULT_SETTINGS);
    return;
  }

  // Les séances ne sont pas seedées : l'onboarding laisse choisir un programme
  await db.transaction('rw', ['exercises', 'meta'], async () => {
    if (toAdd.length > 0) await table.bulkAdd(toAdd);
    if (toPatch.length > 0) await table.bulkPut(toPatch);
    const settings = await db.table('meta').get('settings');
    if (!settings) await db.table('meta').put(DEFAULT_SETTINGS);
  });
}
