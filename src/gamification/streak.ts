import type { Workout, WorkoutTemplate } from '../db/types';
import { addDays, startOfWeek, toISODate } from '../lib/dates';

export interface StreakInfo {
  /** Semaines consécutives où le programme a été respecté */
  weeks: number;
  thisWeekDone: number;
  thisWeekPlanned: number;
  /** La semaine courante est déjà validée */
  thisWeekValid: boolean;
  /** La flamme vacille : il reste moins de jours planifiés que de séances manquantes */
  danger: boolean;
}

/**
 * Une semaine est « respectée » si le nombre de séances terminées atteint le
 * nombre de séances planifiées (peu importe lesquelles : une séance décalée compte).
 */
export function computeStreak(
  workouts: Workout[],
  templates: WorkoutTemplate[],
  now = new Date(),
): StreakInfo {
  const planned = templates.reduce((n, t) => n + t.weekdays.length, 0);
  const finished = workouts.filter((w) => w.finishedAt);

  // Séances terminées par lundi de semaine
  const perWeek = new Map<string, number>();
  for (const w of finished) {
    const key = toISODate(startOfWeek(new Date(`${w.date}T12:00:00`)));
    perWeek.set(key, (perWeek.get(key) ?? 0) + 1);
  }

  const thisMonday = startOfWeek(now);
  const thisKey = toISODate(thisMonday);
  const thisWeekDone = perWeek.get(thisKey) ?? 0;
  const thisWeekValid = planned > 0 && thisWeekDone >= planned;

  // Remonte les semaines précédentes tant qu'elles sont validées
  let weeks = thisWeekValid ? 1 : 0;
  for (let i = 1; i <= 260; i++) {
    const key = toISODate(addDays(thisMonday, -7 * i));
    const done = perWeek.get(key) ?? 0;
    if (planned > 0 && done >= planned) weeks += 1;
    else break;
  }

  // Danger : séances manquantes > jours planifiés restants cette semaine
  let danger = false;
  if (planned > 0 && !thisWeekValid && weeks > 0) {
    const todayIdx = (now.getDay() + 6) % 7; // lundi = 0
    const remainingPlannedDays = templates.reduce(
      (n, t) => n + t.weekdays.filter((d) => (d + 6) % 7 >= todayIdx).length,
      0,
    );
    danger = planned - thisWeekDone > remainingPlannedDays;
  }

  return { weeks, thisWeekDone, thisWeekPlanned: planned, thisWeekValid, danger };
}
