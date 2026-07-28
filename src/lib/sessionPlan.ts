import type { Exercise, MuscleGroup, TargetSet, TemplateItem } from '../db/types';

/**
 * Estimations affichées dans l'éditeur de séance : durée et répartition du
 * volume. Ce sont des ordres de grandeur destinés à équilibrer un programme,
 * pas des mesures — la durée réelle dépend surtout du temps passé entre les
 * séries.
 */

/** Secondes d'effort pour une série, hors repos. */
function workSeconds(set: TargetSet): number {
  if (set.cluster) {
    const { reps, count, restSec } = set.cluster;
    return count * reps * 3 + (count - 1) * restSec;
  }
  if (set.type === 'hold') return set.durationSec ?? 20;
  const reps = set.repsMax ?? set.repsMin ?? 10;
  // ~3 s par répétition, doublé en superlent
  return reps * (set.type === 'superlent' ? 6 : 3);
}

export function estimateDurationSec(
  items: TemplateItem[],
  exMap: Map<string, Exercise>,
): number {
  let total = 0;
  for (const item of items) {
    const rest = item.restSecOverride ?? exMap.get(item.exerciseId)?.defaultRestSec ?? 90;
    for (const set of item.sets) total += workSeconds(set) + rest;
    // Le dernier repos d'un exercice se confond avec la mise en place du suivant
    if (item.sets.length > 0) total -= rest / 2;
  }
  return Math.max(0, Math.round(total));
}

/**
 * Séries par groupe musculaire. Le groupe principal compte pour une série
 * pleine, les secondaires pour une demie — un développé couché travaille les
 * triceps, mais moins que les pectoraux.
 */
export function volumeByGroup(
  items: TemplateItem[],
  exMap: Map<string, Exercise>,
): { group: MuscleGroup; sets: number }[] {
  const counts = new Map<MuscleGroup, number>();
  for (const item of items) {
    const ex = exMap.get(item.exerciseId);
    if (!ex) continue;
    const working = item.sets.filter((s) => s.type !== 'échauffement').length;
    if (working === 0) continue;
    ex.muscleGroups.forEach((g, i) => {
      counts.set(g, (counts.get(g) ?? 0) + working * (i === 0 ? 1 : 0.5));
    });
  }
  return [...counts.entries()]
    .map(([group, sets]) => ({ group, sets }))
    .sort((a, b) => b.sets - a.sets);
}

/** Modèles de séries proposés dans l'éditeur, pour éviter le réglage un à un. */
export const SET_PRESETS: { label: string; hint: string; build: () => TargetSet[] }[] = [
  {
    label: '3 × 8-12',
    hint: 'Hypertrophie',
    build: () => rep(3, 8, 12),
  },
  {
    label: '4 × 8-12',
    hint: 'Hypertrophie',
    build: () => rep(4, 8, 12),
  },
  {
    label: '5 × 5',
    hint: 'Force',
    build: () => rep(5, 5, 5),
  },
  {
    label: '4 × 6-8',
    hint: 'Force-volume',
    build: () => rep(4, 6, 8),
  },
  {
    label: '3 × 12-15',
    hint: 'Endurance',
    build: () => rep(3, 12, 15),
  },
  {
    label: 'Top set + 2 back-off',
    hint: 'Intensité',
    build: () => [
      { type: 'topset', repsMin: 5, repsMax: 8 },
      { type: 'backoff', repsMin: 10, repsMax: 12 },
      { type: 'backoff', repsMin: 10, repsMax: 12 },
    ],
  },
  {
    label: 'Pyramide 12/10/8/6',
    hint: 'Charge croissante',
    build: () => [
      { type: 'normal', repsMin: 12, repsMax: 12 },
      { type: 'normal', repsMin: 10, repsMax: 10 },
      { type: 'normal', repsMin: 8, repsMax: 8 },
      { type: 'normal', repsMin: 6, repsMax: 6 },
    ],
  },
  {
    label: '3 × 30 s',
    hint: 'Gainage · mobilité',
    build: () => Array.from({ length: 3 }, () => ({ type: 'hold' as const, durationSec: 30 })),
  },
];

function rep(count: number, min: number, max: number): TargetSet[] {
  return Array.from({ length: count }, () => ({
    type: 'normal' as const,
    repsMin: min,
    repsMax: max,
  }));
}
