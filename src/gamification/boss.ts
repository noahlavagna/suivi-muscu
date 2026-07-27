import { db } from '../db/db';
import type { BossRow } from '../db/types';

/**
 * Le Colosse du mois : ses PV = un objectif de tonnage calibré sur ton
 * historique (+5 % vs le mois précédent). Chaque kg soulevé lui inflige
 * des dégâts. Tout est dérivé des setLogs — seule la fiche du boss est stockée.
 */

const BOSS_NAMES = [
  'Golem de Fonte',
  'Taureau d’Airain',
  'Cerbère d’Acier',
  'Titan de Grès',
  'Béhémoth de Bronze',
  'Wyrm de Tungstène',
  'Colosse d’Obsidienne',
  'Gardien de Chrome',
  'Minotaure de Magnétite',
  'Léviathan d’Étain',
  'Ogre de Gueuse',
  'Sphinx de Vanadium',
];

const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

export const BOSS_XP = 300;

export const monthKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

async function monthTonnage(month: string): Promise<number> {
  const start = new Date(`${month}-01T00:00:00`).getTime();
  const d = new Date(`${month}-01T12:00:00`);
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  const end = d.getTime();
  const logs = await db.setLogs.where('completedAt').between(start, end).toArray();
  return logs.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0);
}

function prevMonthKey(month: string): string {
  const d = new Date(`${month}-15T12:00:00`);
  d.setMonth(d.getMonth() - 1);
  return monthKey(d);
}

/** Invoque le Colosse du mois s'il n'existe pas encore. */
export async function ensureMonthlyBoss(now = new Date()): Promise<BossRow> {
  const id = monthKey(now);
  const existing = await db.bosses.get(id);
  if (existing) return existing;

  const prevTonnage = await monthTonnage(prevMonthKey(id));
  // Premier boss volontairement abordable ; ensuite +5 % vs le mois passé
  const hpTotal =
    prevTonnage > 0
      ? Math.max(10_000, Math.round((prevTonnage * 1.05) / 500) * 500)
      : 25_000;

  // Index depuis janvier 2026 : le cycle des noms recommence avec un numéral romain
  const d = new Date(`${id}-15T12:00:00`);
  const monthIndex = Math.max(0, (d.getFullYear() - 2026) * 12 + d.getMonth());
  const cycle = Math.floor(monthIndex / BOSS_NAMES.length) % ROMAN.length;
  const name = BOSS_NAMES[monthIndex % BOSS_NAMES.length] + ROMAN[cycle];

  const row: BossRow = { id, name, hpTotal, createdAt: Date.now() };
  await db.bosses.put(row);
  return row;
}

export interface BossState extends BossRow {
  damage: number;
  hpLeft: number;
  /** 0 → 1, part de vie restante */
  hpRatio: number;
  daysLeft: number;
}

export async function bossState(row: BossRow, now = new Date()): Promise<BossState> {
  const damage = Math.min(await monthTonnage(row.id), row.hpTotal);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysLeft = Math.max(
    0,
    Math.ceil((endOfMonth.getTime() - now.getTime()) / 86_400_000),
  );
  return {
    ...row,
    damage,
    hpLeft: Math.max(0, row.hpTotal - damage),
    hpRatio: row.hpTotal > 0 ? Math.max(0, 1 - damage / row.hpTotal) : 0,
    daysLeft,
  };
}

/** Marque le boss du mois comme terrassé si ses PV sont à zéro. */
export async function checkBoss(now = new Date()): Promise<BossRow | null> {
  const row = await db.bosses.get(monthKey(now));
  if (!row || row.slainAt) return null;
  const damage = await monthTonnage(row.id);
  if (damage >= row.hpTotal) {
    const slain = { ...row, slainAt: Date.now() };
    await db.bosses.put(slain);
    return slain;
  }
  return null;
}

/** Historique des colosses passés (hors mois courant), récent d'abord. */
export async function pastBosses(now = new Date()): Promise<BossRow[]> {
  const current = monthKey(now);
  return (await db.bosses.toArray())
    .filter((b) => b.id !== current)
    .sort((a, b) => b.id.localeCompare(a.id));
}
