import { db } from '../db/db';
import type { BadgeRow, SetLog, Workout } from '../db/types';
import { prEventList } from './xp';
import { computeStreak } from './streak';

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string; // clé d'icône, voir BadgeTile
  secret?: boolean;
  test: (ctx: BadgeCtx) => boolean;
}

export interface BadgeCtx {
  finishedWorkouts: Workout[];
  validLogs: SetLog[];
  tonnageByWorkout: Map<string, number>;
  setsByWorkout: Map<string, number>;
  setsPerExercise: Map<string, number>;
  prEventsByWorkout: Map<string, number>;
  totalTonnage: number;
  totalSets: number;
  streakWeeks: number;
  thisWeekValid: boolean;
  challengesDone: number;
  programExerciseIds: Set<string>;
  loggedExerciseIds: Set<string>;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'premier-feu',
    name: 'Premier feu',
    desc: 'Terminer ta première séance',
    icon: 'flame',
    test: (c) => c.finishedWorkouts.length >= 1,
  },
  {
    id: 'semaine-de-fer',
    name: 'Semaine de fer',
    desc: 'Une semaine complète du programme',
    icon: 'medal',
    test: (c) => c.streakWeeks >= 1 || c.thisWeekValid,
  },
  {
    id: 'braise-eternelle',
    name: 'Braise éternelle',
    desc: '4 semaines de flamme d’affilée',
    icon: 'flame',
    test: (c) => c.streakWeeks >= 4,
  },
  {
    id: 'brasier',
    name: 'Brasier',
    desc: '12 semaines de flamme d’affilée',
    icon: 'flame',
    test: (c) => c.streakWeeks >= 12,
  },
  {
    id: 'pluie-etincelles',
    name: 'Pluie d’étincelles',
    desc: '5 séries record dans une même séance',
    icon: 'zap',
    test: (c) => Math.max(0, ...c.prEventsByWorkout.values()) >= 5,
  },
  {
    id: 'dix-tonnes',
    name: 'Dix tonnes',
    desc: '10 000 kg soulevés en une séance',
    icon: 'anvil',
    test: (c) => Math.max(0, ...c.tonnageByWorkout.values()) >= 10_000,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    desc: '100 tonnes soulevées en cumulé',
    icon: 'anvil',
    test: (c) => c.totalTonnage >= 100_000,
  },
  {
    id: 'millenaire',
    name: 'Millénaire',
    desc: '1 000 tonnes soulevées en cumulé',
    icon: 'crown',
    secret: true,
    test: (c) => c.totalTonnage >= 1_000_000,
  },
  {
    id: 'cent-coups',
    name: 'Cent coups de marteau',
    desc: '100 séries validées',
    icon: 'hammer',
    test: (c) => c.totalSets >= 100,
  },
  {
    id: 'mille-coups',
    name: 'Mille coups de marteau',
    desc: '1 000 séries validées',
    icon: 'hammer',
    test: (c) => c.totalSets >= 1000,
  },
  {
    id: 'fidele-au-poste',
    name: 'Fidèle au poste',
    desc: '50 séries sur un même exercice',
    icon: 'dumbbell',
    test: (c) => Math.max(0, ...c.setsPerExercise.values()) >= 50,
  },
  {
    id: 'aube-de-forge',
    name: 'Aube de forge',
    desc: 'Séance terminée avant 8 h',
    icon: 'sunrise',
    secret: true,
    test: (c) =>
      c.finishedWorkouts.some((w) => w.finishedAt && new Date(w.finishedAt).getHours() < 8),
  },
  {
    id: 'feux-nocturnes',
    name: 'Feux nocturnes',
    desc: 'Séance commencée après 21 h',
    icon: 'moon',
    secret: true,
    test: (c) => c.finishedWorkouts.some((w) => new Date(w.startedAt).getHours() >= 21),
  },
  {
    id: 'marathon',
    name: 'Marathon du fer',
    desc: 'Une séance de plus d’1 h 30',
    icon: 'timer',
    test: (c) =>
      c.finishedWorkouts.some((w) => w.finishedAt && w.finishedAt - w.startedAt > 90 * 60_000),
  },
  {
    id: 'eclair',
    name: 'Éclair',
    desc: '15 séries expédiées en moins de 40 min',
    icon: 'zap',
    secret: true,
    test: (c) =>
      c.finishedWorkouts.some(
        (w) =>
          w.finishedAt &&
          w.finishedAt - w.startedAt < 40 * 60_000 &&
          (c.setsByWorkout.get(w.id) ?? 0) >= 15,
      ),
  },
  {
    id: 'trois-chiffres',
    name: 'Trois chiffres',
    desc: 'Une série à 100 kg ou plus',
    icon: 'star',
    test: (c) => c.validLogs.some((l) => l.weightKg >= 100 && (l.reps ?? 0) > 0),
  },
  {
    id: 'contractuel',
    name: 'Contractuel',
    desc: '5 contrats hebdomadaires remplis',
    icon: 'scroll',
    test: (c) => c.challengesDone >= 5,
  },
  {
    id: 'tour-complet',
    name: 'Tour complet',
    desc: 'Au moins une série sur chaque exercice du programme',
    icon: 'trophy',
    test: (c) =>
      c.programExerciseIds.size > 0 &&
      [...c.programExerciseIds].every((id) => c.loggedExerciseIds.has(id)),
  },
];

export async function buildBadgeCtx(): Promise<BadgeCtx> {
  const [workouts, logs, templates, challenges] = await Promise.all([
    db.workouts.toArray(),
    db.setLogs.orderBy('completedAt').toArray(),
    db.templates.toArray(),
    db.challenges.toArray(),
  ]);
  const finishedWorkouts = workouts.filter((w) => w.finishedAt);
  const finishedIds = new Set(finishedWorkouts.map((w) => w.id));
  const validLogs = logs.filter((l) => finishedIds.has(l.workoutId));

  const tonnageByWorkout = new Map<string, number>();
  const setsByWorkout = new Map<string, number>();
  const setsPerExercise = new Map<string, number>();
  for (const l of validLogs) {
    tonnageByWorkout.set(
      l.workoutId,
      (tonnageByWorkout.get(l.workoutId) ?? 0) + (l.reps ? l.weightKg * l.reps : 0),
    );
    setsByWorkout.set(l.workoutId, (setsByWorkout.get(l.workoutId) ?? 0) + 1);
    setsPerExercise.set(l.exerciseId, (setsPerExercise.get(l.exerciseId) ?? 0) + 1);
  }
  const prEventsByWorkout = new Map<string, number>();
  for (const e of prEventList(validLogs)) {
    prEventsByWorkout.set(e.workoutId, (prEventsByWorkout.get(e.workoutId) ?? 0) + 1);
  }
  const streak = computeStreak(workouts, templates);
  return {
    finishedWorkouts,
    validLogs,
    tonnageByWorkout,
    setsByWorkout,
    setsPerExercise,
    prEventsByWorkout,
    totalTonnage: [...tonnageByWorkout.values()].reduce((a, b) => a + b, 0),
    totalSets: validLogs.length,
    streakWeeks: streak.weeks,
    thisWeekValid: streak.thisWeekValid,
    challengesDone: challenges.filter((c) => c.doneAt).length,
    programExerciseIds: new Set(templates.flatMap((t) => t.items.map((i) => i.exerciseId))),
    loggedExerciseIds: new Set(validLogs.map((l) => l.exerciseId)),
  };
}

/** Évalue tout, débloque les nouveaux badges, retourne leurs définitions. */
export async function evaluateBadges(workoutId?: string): Promise<BadgeDef[]> {
  const ctx = await buildBadgeCtx();
  const unlocked = new Set((await db.badges.toArray()).map((b) => b.id));
  const fresh = BADGES.filter((b) => !unlocked.has(b.id) && b.test(ctx));
  if (fresh.length > 0) {
    const rows: BadgeRow[] = fresh.map((b) => ({
      id: b.id,
      unlockedAt: Date.now(),
      workoutId,
    }));
    await db.badges.bulkPut(rows);
  }
  return fresh;
}
