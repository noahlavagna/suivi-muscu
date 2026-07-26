import { db } from '../db/db';
import { bestEquivalent } from './equivalents';
import { prEventList } from './xp';

export interface WrappedData {
  month: string; // 'YYYY-MM'
  monthLabel: string; // 'juin 2026'
  sessions: number;
  sets: number;
  tonnageKg: number;
  equivalentText: string | null;
  starExercise: { name: string; sets: number } | null;
  prEvents: number;
  heaviest: { weightKg: number; name: string } | null;
}

export function prevMonthKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function computeWrapped(month: string): Promise<WrappedData | null> {
  const [workouts, allLogs, exercises] = await Promise.all([
    db.workouts.toArray(),
    db.setLogs.orderBy('completedAt').toArray(),
    db.exercises.toArray(),
  ]);
  const monthWorkouts = workouts.filter((w) => w.finishedAt && w.date.startsWith(month));
  if (monthWorkouts.length === 0) return null;
  const ids = new Set(monthWorkouts.map((w) => w.id));
  const logs = allLogs.filter((l) => ids.has(l.workoutId));
  const exMap = new Map(exercises.map((e) => [e.id, e]));

  const tonnageKg = logs.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0);

  const perExercise = new Map<string, number>();
  for (const l of logs)
    perExercise.set(l.exerciseId, (perExercise.get(l.exerciseId) ?? 0) + 1);
  const star = [...perExercise.entries()]
    .filter(([id]) => !exMap.get(id)?.isTimeBased)
    .sort((a, b) => b[1] - a[1])[0];

  const heaviestLog = logs
    .filter((l) => (l.reps ?? 0) > 0)
    .sort((a, b) => b.weightKg - a.weightKg)[0];

  // Records battus DANS le mois (rejoue tout l'historique pour un comptage juste)
  const finishedAll = new Set(workouts.filter((w) => w.finishedAt).map((w) => w.id));
  const prEvents = prEventList(allLogs.filter((l) => finishedAll.has(l.workoutId))).filter((e) =>
    ids.has(e.workoutId),
  ).length;

  const monthLabel = new Date(`${month}-15T12:00:00`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return {
    month,
    monthLabel,
    sessions: monthWorkouts.length,
    sets: logs.length,
    tonnageKg,
    equivalentText: bestEquivalent(tonnageKg)?.text ?? null,
    starExercise: star ? { name: exMap.get(star[0])?.name ?? '—', sets: star[1] } : null,
    prEvents,
    heaviest: heaviestLog
      ? { weightKg: heaviestLog.weightKg, name: exMap.get(heaviestLog.exerciseId)?.name ?? '—' }
      : null,
  };
}
