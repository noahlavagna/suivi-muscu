import { db } from '../db/db';
import type { ChallengeKind, ChallengeRow } from '../db/types';
import { addDays, startOfWeek, toISODate } from '../lib/dates';
import { prEventList } from './xp';

export const CHALLENGE_XP = 150;

export const weekKey = (d: Date): string => toISODate(startOfWeek(d));

async function weekStats(monday: Date): Promise<{ tonnage: number; sets: number }> {
  const start = monday.getTime();
  const end = addDays(monday, 7).getTime();
  const logs = await db.setLogs.where('completedAt').between(start, end).toArray();
  return {
    tonnage: logs.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0),
    sets: logs.length,
  };
}

function makeDesc(kind: ChallengeKind, target: number): string {
  switch (kind) {
    case 'tonnage':
      return `Forge ${target.toLocaleString('fr-FR')} kg cette semaine`;
    case 'series':
      return `Frappe ${target} séries cette semaine`;
    case 'pr':
      return 'Bats au moins un record cette semaine';
  }
}

/** Crée le contrat de la semaine s'il n'existe pas encore, et le retourne. */
export async function ensureWeeklyChallenge(now = new Date()): Promise<ChallengeRow> {
  const id = weekKey(now);
  const existing = await db.challenges.get(id);
  if (existing) return existing;

  const prev = await weekStats(addDays(startOfWeek(now), -7));
  // Rotation déterministe par semaine ; replis si pas de données de référence
  const weekIndex = Math.floor(startOfWeek(now).getTime() / (7 * 86_400_000));
  let kind: ChallengeKind = (['tonnage', 'series', 'pr'] as const)[weekIndex % 3];
  if (kind === 'tonnage' && prev.tonnage <= 0) kind = 'series';
  if (kind === 'series' && prev.sets <= 0) kind = prev.tonnage > 0 ? 'tonnage' : 'series';

  let target: number;
  if (kind === 'tonnage') target = Math.ceil((prev.tonnage * 1.02) / 50) * 50;
  else if (kind === 'series') target = Math.max(12, prev.sets + 2);
  else target = 1;

  const row: ChallengeRow = {
    id,
    kind,
    target,
    desc: makeDesc(kind, target),
    xp: CHALLENGE_XP,
    createdAt: Date.now(),
  };
  await db.challenges.put(row);
  return row;
}

/** Progression du contrat sur la semaine courante. */
export async function challengeProgress(ch: ChallengeRow): Promise<number> {
  const monday = new Date(`${ch.id}T12:00:00`);
  const start = startOfWeek(monday).getTime();
  const end = addDays(startOfWeek(monday), 7).getTime();
  if (ch.kind === 'pr') {
    const logs = await db.setLogs.orderBy('completedAt').toArray();
    return prEventList(logs).filter((e) => e.ts >= start && e.ts < end).length;
  }
  const stats = await weekStats(startOfWeek(monday));
  return ch.kind === 'tonnage' ? stats.tonnage : stats.sets;
}

/** Marque le contrat rempli si l'objectif est atteint. Retourne la ligne si fraîchement rempli. */
export async function checkChallenge(now = new Date()): Promise<ChallengeRow | null> {
  const ch = await db.challenges.get(weekKey(now));
  if (!ch || ch.doneAt) return null;
  const value = await challengeProgress(ch);
  if (value >= ch.target) {
    const done = { ...ch, doneAt: Date.now() };
    await db.challenges.put(done);
    return done;
  }
  return null;
}
