import { db } from '../db/db';
import type { Exercise, MuscleGroup } from '../db/types';

/**
 * L'Arsenal : chaque exercice travaillé forge une pièce dont la qualité
 * suit le travail réellement accompli (séries validées en séances terminées).
 * Entièrement dérivé — rien n'est stocké.
 */

export type ArsenalTier = 0 | 1 | 2 | 3 | 4;

export const TIER_NAMES: Record<ArsenalTier, string> = {
  0: 'Ébauche',
  1: 'Fonte',
  2: 'Acier',
  3: 'Damas',
  4: 'Mythril',
};

/** Séries nécessaires pour atteindre chaque palier */
export const TIER_THRESHOLDS = [0, 10, 30, 75, 150];

export function tierForSets(sets: number): ArsenalTier {
  let tier: ArsenalTier = 0;
  for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
    if (sets >= TIER_THRESHOLDS[i]) tier = i as ArsenalTier;
  }
  return tier;
}

const PIECE_BY_GROUP: Partial<Record<MuscleGroup, { label: string; icon: string }>> = {
  épaules: { label: 'Heaume', icon: 'helmet' },
  pectoraux: { label: 'Plastron', icon: 'armor' },
  dos: { label: 'Bouclier', icon: 'shield' },
  quadriceps: { label: 'Jambières', icon: 'boot' },
  ischios: { label: 'Jambières', icon: 'boot' },
  fessiers: { label: 'Jambières', icon: 'boot' },
  adducteurs: { label: 'Jambières', icon: 'boot' },
  biceps: { label: 'Brassard', icon: 'gauntlet' },
  triceps: { label: 'Marteau', icon: 'hammer' },
  mobilité: { label: 'Talisman', icon: 'star' },
};

export interface ArsenalPiece {
  exercise: Exercise;
  pieceLabel: string;
  icon: string;
  sets: number;
  tier: ArsenalTier;
  tierName: string;
  /** Progression vers le palier suivant, null si Mythril */
  next: { at: number; ratio: number } | null;
}

export function pieceFor(exercise: Exercise, sets: number): ArsenalPiece {
  const meta = PIECE_BY_GROUP[exercise.muscleGroups[0]] ?? { label: 'Pièce', icon: 'star' };
  const tier = tierForSets(sets);
  const nextAt = TIER_THRESHOLDS[tier + 1];
  const prevAt = TIER_THRESHOLDS[tier];
  return {
    exercise,
    pieceLabel: meta.label,
    icon: meta.icon,
    sets,
    tier,
    tierName: TIER_NAMES[tier],
    next:
      nextAt === undefined
        ? null
        : { at: nextAt, ratio: (sets - prevAt) / (nextAt - prevAt) },
  };
}

/** Toutes les pièces, exercices travaillés d'abord, triées par qualité. */
export async function buildArsenal(): Promise<ArsenalPiece[]> {
  const [exercises, workouts, logs] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.setLogs.toArray(),
  ]);
  const finished = new Set(workouts.filter((w) => w.finishedAt).map((w) => w.id));
  const counts = new Map<string, number>();
  for (const l of logs) {
    if (finished.has(l.workoutId)) counts.set(l.exerciseId, (counts.get(l.exerciseId) ?? 0) + 1);
  }
  return exercises
    .filter((e) => !e.archivedAt && (counts.get(e.id) ?? 0) > 0)
    .map((e) => pieceFor(e, counts.get(e.id) ?? 0))
    .sort((a, b) => b.tier - a.tier || b.sets - a.sets);
}
