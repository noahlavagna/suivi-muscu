import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { BadgeRow, ChallengeRow } from '../db/types';
import { computeXP, type XPBreakdown } from './xp';
import { computeStreak, type StreakInfo } from './streak';
import { challengeProgress, weekKey } from './challenges';
import { startOfWeek } from '../lib/dates';

export interface GamiState {
  xp: XPBreakdown;
  streak: StreakInfo;
  challenge: (ChallengeRow & { progress: number }) | null;
  unlocked: BadgeRow[];
  weekTonnage: number;
  lifetimeTonnage: number;
}

/** État de gamification complet, recalculé en live depuis Dexie. */
export function useGami(): GamiState | undefined {
  return useLiveQuery(async () => {
    const now = new Date();
    const [xp, workouts, templates, badges, ch, logs] = await Promise.all([
      computeXP(),
      db.workouts.toArray(),
      db.templates.toArray(),
      db.badges.toArray(),
      db.challenges.get(weekKey(now)),
      db.setLogs.toArray(),
    ]);
    const streak = computeStreak(workouts, templates, now);
    const challenge = ch ? { ...ch, progress: await challengeProgress(ch) } : null;
    const weekStart = startOfWeek(now).getTime();
    const finishedIds = new Set(workouts.filter((w) => w.finishedAt).map((w) => w.id));
    let weekTonnage = 0;
    let lifetimeTonnage = 0;
    for (const l of logs) {
      const t = l.reps ? l.weightKg * l.reps : 0;
      if (l.completedAt >= weekStart) weekTonnage += t;
      if (finishedIds.has(l.workoutId)) lifetimeTonnage += t;
    }
    return {
      xp,
      streak,
      challenge,
      unlocked: badges.sort((a, b) => b.unlockedAt - a.unlockedAt),
      weekTonnage,
      lifetimeTonnage,
    };
  }, []);
}
