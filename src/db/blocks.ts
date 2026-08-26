import { db } from './db';
import type { BlockRow } from './types';
import { blockView, currentWeek, hasNextWeek, isScheduled, weekConfig } from '../lib/block';

/** Avancement du palier en cours : ce qui déclenche la montée de niveau. */
export interface WeekProgress {
  week: number;
  done: number;
  total: number;
  /** Toutes les séances du palier sont faites — la montée peut être proposée */
  complete: boolean;
  /** …et il reste un palier au-dessus */
  canLevelUp: boolean;
}

/**
 * Compte les séances du palier déjà bouclées.
 *
 * Le décompte part de `weekStartedAt` et non du lundi : entrer dans un palier
 * un vendredi ne doit pas obliger à tout enchaîner en deux jours, et les
 * séances faites au palier précédent ne comptent pas pour celui-ci.
 */
export async function weekProgress(block: BlockRow): Promise<WeekProgress> {
  const week = currentWeek(block);
  const views = new Map([[block.id, blockView(block)]]);
  const templates = (await db.templates.toArray()).filter(
    (t) => t.blockId === block.id && isScheduled(t, views),
  );
  let done = 0;
  for (const t of templates) {
    const workouts = await db.workouts.where('templateId').equals(t.id).toArray();
    const since = block.weekStartedAt ?? 0;
    if (workouts.some((w) => w.finishedAt && w.startedAt >= since)) done += 1;
  }
  const complete = templates.length > 0 && done === templates.length;
  return {
    week,
    done,
    total: templates.length,
    complete,
    canLevelUp: complete && hasNextWeek(block),
  };
}

/** Passe le bloc au palier `week` et repart à zéro pour le décompte. */
export async function setBlockWeek(blockId: string, week: number): Promise<void> {
  await db.blocks.update(blockId, { currentWeek: week, weekStartedAt: Date.now() });
}

export interface LevelUp {
  blockId: string;
  blockName: string;
  from: number;
  to: number;
  total: number;
  fromRir?: string;
  toRir?: string;
  fromRestSec?: number;
  toRestSec?: number;
  toRestSecMax?: number;
  /** Le palier visé est le dernier : c'est le programme à conserver */
  toIsFinal: boolean;
}

/**
 * Y a-t-il une montée de palier à célébrer ? Appelé en fin de séance ;
 * renvoie `null` tant que le palier n'est pas complet.
 */
export async function pendingLevelUp(templateId?: string): Promise<LevelUp | null> {
  if (!templateId) return null;
  const template = await db.templates.get(templateId);
  if (!template?.blockId) return null;
  const block = await db.blocks.get(template.blockId);
  if (!block) return null;
  const progress = await weekProgress(block);
  if (!progress.canLevelUp) return null;
  const from = progress.week;
  const to = from + 1;
  const a = weekConfig(block, from);
  const b = weekConfig(block, to);
  return {
    blockId: block.id,
    blockName: block.name,
    from,
    to,
    total: block.weeks.length,
    fromRir: a?.rir,
    toRir: b?.rir,
    fromRestSec: a?.restSec,
    toRestSec: b?.restSec,
    toRestSecMax: b?.restSecMax,
    toIsFinal: to === block.weeks.length,
  };
}
