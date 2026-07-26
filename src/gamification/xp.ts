import { db } from '../db/db';
import { prCandidates } from '../db/prs';
import type { PRKind, SetLog } from '../db/types';

/**
 * L'XP (« métal forgé ») est DÉRIVÉ de l'historique à chaque calcul,
 * jamais accumulé dans un compteur : impossible de dériver ou de désynchroniser.
 */
export const XP_PER_SET = 10;
export const XP_PER_WORKOUT = 50;
export const XP_PER_PR = 40;
export const XP_PER_BADGE = 100;

export interface XPBreakdown {
  total: number;
  level: number;
  title: string;
  /** XP accumulé dans le niveau courant */
  xpInLevel: number;
  /** XP nécessaire pour passer au niveau suivant */
  xpForNext: number;
  sets: number;
  workouts: number;
  prEvents: number;
  challengesXp: number;
  badgesXp: number;
}

/** Coût pour passer du niveau n au niveau n+1 */
export const levelCost = (n: number): number =>
  Math.round((400 * Math.pow(n, 1.1)) / 50) * 50;

export function levelFromXP(total: number): { level: number; xpInLevel: number; xpForNext: number } {
  let level = 1;
  let rest = total;
  while (rest >= levelCost(level) && level < 99) {
    rest -= levelCost(level);
    level += 1;
  }
  return { level, xpInLevel: rest, xpForNext: levelCost(level) };
}

const TITLES: [number, string][] = [
  [1, 'Apprenti de la forge'],
  [3, 'Batteur d’enclume'],
  [6, 'Forgeron'],
  [10, 'Compagnon du fer'],
  [15, 'Maître forgeron'],
  [21, 'Forgeron d’acier'],
  [28, 'Maître des enclumes'],
  [36, 'Seigneur de la fonte'],
  [50, 'Légende de la forge'],
];

export function titleForLevel(level: number): string {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return title;
}

/** Prochain rang : niveau à atteindre et nom (null si dernier rang) */
export function nextTitle(level: number): { level: number; title: string } | null {
  for (const [min, t] of TITLES) if (min > level) return { level: min, title: t };
  return null;
}

export interface PREvent {
  ts: number;
  workoutId: string;
}

/** Rejoue l'historique et liste les records BATTUS (un record initial ne compte pas) */
export function prEventList(sortedLogs: SetLog[]): PREvent[] {
  const best = new Map<string, number>();
  const events: PREvent[] = [];
  for (const log of sortedLogs) {
    let beaten = false;
    for (const [kind, value] of Object.entries(prCandidates(log)) as [PRKind, number][]) {
      const key = `${log.exerciseId}:${kind}`;
      const prev = best.get(key);
      if (prev === undefined) best.set(key, value);
      else if (value > prev) {
        best.set(key, value);
        beaten = true;
      }
    }
    // Une série qui bat plusieurs records = UN événement (sinon l'XP triple sur la même série)
    if (beaten) events.push({ ts: log.completedAt, workoutId: log.workoutId });
  }
  return events;
}

export const countPREvents = (sortedLogs: SetLog[]): number => prEventList(sortedLogs).length;

export async function computeXP(): Promise<XPBreakdown> {
  const [workouts, logs, badges, challenges] = await Promise.all([
    db.workouts.toArray(),
    db.setLogs.orderBy('completedAt').toArray(),
    db.badges.toArray(),
    db.challenges.toArray(),
  ]);
  const finishedIds = new Set(workouts.filter((w) => w.finishedAt).map((w) => w.id));
  const validLogs = logs.filter((l) => finishedIds.has(l.workoutId));
  const prEvents = countPREvents(validLogs);
  const challengesXp = challenges.filter((c) => c.doneAt).reduce((s, c) => s + c.xp, 0);
  const badgesXp = badges.length * XP_PER_BADGE;
  const total =
    validLogs.length * XP_PER_SET +
    finishedIds.size * XP_PER_WORKOUT +
    prEvents * XP_PER_PR +
    challengesXp +
    badgesXp;
  const { level, xpInLevel, xpForNext } = levelFromXP(total);
  return {
    total,
    level,
    title: titleForLevel(level),
    xpInLevel,
    xpForNext,
    sets: validLogs.length,
    workouts: finishedIds.size,
    prEvents,
    challengesXp,
    badgesXp,
  };
}
