import { db } from './db';
import type { PersonalRecord, PRKind, SetLog } from './types';

export const epley = (weightKg: number, reps: number): number =>
  reps <= 1 ? weightKg : weightKg * (1 + reps / 30);

export const PR_LABEL: Record<PRKind, string> = {
  charge: 'Charge max',
  reps: 'Reps max',
  volume: 'Volume (série)',
  e1rm: '1RM estimé',
};

export function prCandidates(log: SetLog): Partial<Record<PRKind, number>> {
  if (log.type === 'hold' || log.type === 'échauffement') return {};
  if (log.reps == null || log.reps <= 0 || log.weightKg <= 0) return {};
  return {
    charge: log.weightKg,
    reps: log.reps,
    volume: log.weightKg * log.reps,
    e1rm: epley(log.weightKg, log.reps),
  };
}

/**
 * Compare une série aux records existants et met à jour la table `prs`.
 * Retourne les types de record battus (pour la célébration).
 */
export async function registerSetForPRs(log: SetLog, date: string): Promise<PRKind[]> {
  const values = prCandidates(log);
  const beaten: PRKind[] = [];
  await db.transaction('rw', db.prs, async () => {
    for (const [kind, value] of Object.entries(values) as [PRKind, number][]) {
      const id = `${log.exerciseId}:${kind}`;
      const existing = await db.prs.get(id);
      if (!existing || value > existing.value) {
        await db.prs.put({
          id,
          exerciseId: log.exerciseId,
          kind,
          value,
          weightKg: log.weightKg,
          reps: log.reps,
          workoutId: log.workoutId,
          date,
        });
        // Un record ne « compte » comme battu que s'il existait déjà
        if (existing) beaten.push(kind);
      }
    }
  });
  return beaten;
}

/** Recalcule tous les PR depuis l'historique (après import ou édition d'une séance). */
export async function rebuildAllPRs(): Promise<void> {
  await db.transaction('rw', [db.setLogs, db.workouts, db.prs], async () => {
    await db.prs.clear();
    const workouts = new Map((await db.workouts.toArray()).map((w) => [w.id, w]));
    const logs = await db.setLogs.orderBy('completedAt').toArray();
    const best = new Map<string, PersonalRecord>();
    for (const log of logs) {
      const date = workouts.get(log.workoutId)?.date ?? '';
      for (const [kind, value] of Object.entries(prCandidates(log)) as [PRKind, number][]) {
        const id = `${log.exerciseId}:${kind}`;
        const existing = best.get(id);
        if (!existing || value > existing.value) {
          best.set(id, {
            id,
            exerciseId: log.exerciseId,
            kind,
            value,
            weightKg: log.weightKg,
            reps: log.reps,
            workoutId: log.workoutId,
            date,
          });
        }
      }
    }
    await db.prs.bulkPut([...best.values()]);
  });
}
