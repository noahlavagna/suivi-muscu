import { epley } from '../db/prs';
import type { Exercise, MuscleGroup, SetLog, Workout } from '../db/types';
import { addDays, startOfWeek, toISODate } from './dates';

/**
 * Calculs de l'onglet Progression. Fonctions pures prenant l'historique déjà
 * chargé : la lecture Dexie reste dans l'écran, ce qui rend ces règles
 * lisibles et vérifiables isolément.
 */

export type Period = '4s' | '3m' | '6m' | '1a' | 'tout';

export const PERIOD_LABEL: Record<Period, string> = {
  '4s': '4 sem.',
  '3m': '3 mois',
  '6m': '6 mois',
  '1a': '1 an',
  tout: 'Tout',
};

export const PERIOD_DAYS: Record<Period, number> = {
  '4s': 28,
  '3m': 91,
  '6m': 183,
  '1a': 365,
  tout: Number.POSITIVE_INFINITY,
};

export interface Slice {
  sessions: number;
  sets: number;
  tonnage: number;
  /** Somme des durées de séance, en secondes */
  durationSec: number;
}

export function summarize(logs: SetLog[], workouts: Map<string, Workout>): Slice {
  const ids = new Set(logs.map((l) => l.workoutId));
  let durationSec = 0;
  for (const id of ids) {
    const w = workouts.get(id);
    if (w?.finishedAt) durationSec += (w.finishedAt - w.startedAt) / 1000;
  }
  return {
    sessions: ids.size,
    sets: logs.length,
    tonnage: logs.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0),
    durationSec,
  };
}

/** Variation relative, ou null quand la période précédente est vide (pas de repère). */
export function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

/* ————————————————— Volume par groupe ————————————————— */

/**
 * Repères de séries hebdomadaires par groupe musculaire. Fourchette
 * communément citée en hypertrophie : sous 10 le stimulus est faible, au-delà
 * de 20 la récupération devient limitante. Ce sont des ordres de grandeur,
 * volontairement affichés comme tels.
 */
export const WEEKLY_SETS_LOW = 10;
export const WEEKLY_SETS_HIGH = 20;

export type VolumeVerdict = 'bas' | 'bon' | 'élevé';

export interface GroupVolume {
  group: MuscleGroup;
  setsPerWeek: number;
  verdict: VolumeVerdict;
}

export function volumePerWeek(
  logs: SetLog[],
  exMap: Map<string, Exercise>,
  weeks: number,
): GroupVolume[] {
  const counts = new Map<MuscleGroup, number>();
  for (const l of logs) {
    if (l.type === 'échauffement') continue;
    const ex = exMap.get(l.exerciseId);
    if (!ex) continue;
    ex.muscleGroups.forEach((g, i) => {
      if (g === 'mobilité' || g === 'cardio') return;
      counts.set(g, (counts.get(g) ?? 0) + (i === 0 ? 1 : 0.5));
    });
  }
  const span = Math.max(1, weeks);
  return [...counts.entries()]
    .map(([group, total]) => {
      const setsPerWeek = total / span;
      return {
        group,
        setsPerWeek,
        verdict: (setsPerWeek < WEEKLY_SETS_LOW
          ? 'bas'
          : setsPerWeek > WEEKLY_SETS_HIGH
            ? 'élevé'
            : 'bon') as VolumeVerdict,
      };
    })
    .sort((a, b) => b.setsPerWeek - a.setsPerWeek);
}

/* ————————————————— Équilibres ————————————————— */

const PUSH: MuscleGroup[] = ['pectoraux', 'épaules', 'triceps'];
const PULL: MuscleGroup[] = ['dos', 'biceps', 'trapèzes', 'avant-bras'];
const UPPER: MuscleGroup[] = [...PUSH, ...PULL];
const LOWER: MuscleGroup[] = ['quadriceps', 'ischios', 'fessiers', 'adducteurs', 'mollets'];

function countIn(logs: SetLog[], exMap: Map<string, Exercise>, groups: MuscleGroup[]): number {
  return logs.filter((l) => {
    if (l.type === 'échauffement') return false;
    const g = exMap.get(l.exerciseId)?.muscleGroups[0];
    return g !== undefined && groups.includes(g);
  }).length;
}

export interface Balance {
  label: string;
  leftLabel: string;
  rightLabel: string;
  left: number;
  right: number;
}

export function balances(logs: SetLog[], exMap: Map<string, Exercise>): Balance[] {
  return [
    {
      label: 'Poussée / tirage',
      leftLabel: 'Poussée',
      rightLabel: 'Tirage',
      left: countIn(logs, exMap, PUSH),
      right: countIn(logs, exMap, PULL),
    },
    {
      label: 'Haut / bas du corps',
      leftLabel: 'Haut',
      rightLabel: 'Bas',
      left: countIn(logs, exMap, UPPER),
      right: countIn(logs, exMap, LOWER),
    },
  ];
}

/* ————————————————— Progression par exercice ————————————————— */

export interface ExerciseTrend {
  exercise: Exercise;
  /** 1RM estimé au début et à la fin de la période */
  first: number;
  last: number;
  changePct: number;
  sessions: number;
  /** Jours depuis la dernière pratique */
  daysSince: number;
}

/**
 * Évolution du 1RM estimé sur la période. On prend la meilleure série de
 * chaque séance, puis on compare la moyenne des deux premières séances à celle
 * des deux dernières : une seule séance exceptionnelle ne fausse pas la pente.
 */
export function exerciseTrends(
  logs: SetLog[],
  exMap: Map<string, Exercise>,
  minSessions = 3,
): ExerciseTrend[] {
  const byExercise = new Map<string, Map<string, { ts: number; e1rm: number }>>();
  for (const l of logs) {
    if (l.reps == null || l.reps <= 0 || l.weightKg <= 0) continue;
    if (l.type === 'échauffement') continue;
    let perWorkout = byExercise.get(l.exerciseId);
    if (!perWorkout) byExercise.set(l.exerciseId, (perWorkout = new Map()));
    const value = epley(l.weightKg, l.reps);
    const cur = perWorkout.get(l.workoutId);
    if (!cur || value > cur.e1rm) perWorkout.set(l.workoutId, { ts: l.completedAt, e1rm: value });
  }

  const now = Date.now();
  const out: ExerciseTrend[] = [];
  for (const [exerciseId, perWorkout] of byExercise) {
    const ex = exMap.get(exerciseId);
    if (!ex || perWorkout.size < minSessions) continue;
    const points = [...perWorkout.values()].sort((a, b) => a.ts - b.ts);
    const avg = (xs: { e1rm: number }[]) => xs.reduce((s, p) => s + p.e1rm, 0) / xs.length;
    const first = avg(points.slice(0, 2));
    const last = avg(points.slice(-2));
    out.push({
      exercise: ex,
      first,
      last,
      changePct: first > 0 ? (last - first) / first : 0,
      sessions: points.length,
      daysSince: Math.floor((now - points[points.length - 1].ts) / 86_400_000),
    });
  }
  return out.sort((a, b) => b.changePct - a.changePct);
}

/* ————————————————— Régularité ————————————————— */

export interface Consistency {
  weeksStreak: number;
  sessionsPerWeek: number;
  /** 0 = dimanche, convention JS Date */
  favouriteWeekday: number | null;
  avgDurationSec: number;
}

export function consistency(
  logs: SetLog[],
  workouts: Map<string, Workout>,
  weeks: number,
): Consistency {
  const ids = new Set(logs.map((l) => l.workoutId));
  const dates = [...ids].map((id) => workouts.get(id)).filter((w): w is Workout => !!w);

  // Série de semaines consécutives avec au moins une séance, en remontant
  const trained = new Set(dates.map((w) => toISODate(startOfWeek(new Date(`${w.date}T12:00:00`)))));
  let weeksStreak = 0;
  let cursor = startOfWeek(new Date());
  // La semaine en cours ne casse pas la série si elle est encore vide
  if (!trained.has(toISODate(cursor))) cursor = addDays(cursor, -7);
  while (trained.has(toISODate(cursor))) {
    weeksStreak += 1;
    cursor = addDays(cursor, -7);
  }

  const byWeekday = new Map<number, number>();
  for (const w of dates) {
    const d = new Date(`${w.date}T12:00:00`).getDay();
    byWeekday.set(d, (byWeekday.get(d) ?? 0) + 1);
  }
  const favourite = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0];

  const durations = dates.filter((w) => w.finishedAt).map((w) => (w.finishedAt! - w.startedAt) / 1000);

  return {
    weeksStreak,
    sessionsPerWeek: dates.length / Math.max(1, weeks),
    favouriteWeekday: favourite?.[0] ?? null,
    avgDurationSec:
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
  };
}

/* ————————————————— Rep-max estimés ————————————————— */

/** Charge théorique pour `reps` répétitions, dérivée d'un 1RM (Epley inversé). */
export const loadForReps = (oneRm: number, reps: number): number => oneRm / (1 + reps / 30);

export const REP_MAX_TARGETS = [1, 3, 5, 8, 10, 12];
