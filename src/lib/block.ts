import type {
  BlockRow,
  BlockWeek,
  ItemVariant,
  TemplateItem,
  WorkoutTemplate,
} from '../db/types';

/**
 * Blocs d'entraînement (mésocycles).
 *
 * Le palier en cours est une donnée explicite (`currentWeek`), pas un calcul
 * de dates : on monte d'un cran quand les séances du palier sont faites, pas
 * parce qu'un lundi est passé. Une semaine ratée ne fait sauter aucun palier.
 */

/**
 * Palier en vigueur, borné aux paliers réellement définis.
 *
 * Le `?? 1` couvre les blocs enregistrés avant que le palier ne devienne une
 * donnée explicite : sans lui, un `undefined` se propagerait en NaN et plus
 * aucune séance ne serait planifiée.
 */
export function currentWeek(block: BlockRow): number {
  return Math.min(Math.max(block.currentWeek ?? 1, 1), Math.max(block.weeks.length, 1));
}

/** Un palier de plus reste-t-il à débloquer ? */
export function hasNextWeek(block: BlockRow): boolean {
  return currentWeek(block) < block.weeks.length;
}

/** Récup d'une semaine, dans la notation du programme papier — « 1'30 », « 3'00 à 3'30 ». */
export function restLabel(restSec: number, restSecMax?: number): string {
  const one = (s: number) => `${Math.floor(s / 60)}'${String(s % 60).padStart(2, '0')}`;
  return restSecMax ? `${one(restSec)} à ${one(restSecMax)}` : one(restSec);
}

export function weekConfig(block: BlockRow, week: number): BlockWeek | undefined {
  return block.weeks.find((w) => w.week === week);
}

export interface BlockView {
  block: BlockRow;
  week: number;
  config?: BlockWeek;
}

export function blockView(block: BlockRow): BlockView {
  const week = currentWeek(block);
  return { block, week, config: weekConfig(block, week) };
}

/** Vue des blocs, indexée par id. */
export function blockViews(blocks: BlockRow[]): Map<string, BlockView> {
  return new Map(blocks.map((block) => [block.id, blockView(block)]));
}

/** La séance appartient-elle au palier en vigueur ? */
export function inCurrentWeek(t: WorkoutTemplate, views: Map<string, BlockView>): boolean {
  if (!t.blockId || t.week == null) return true;
  const view = views.get(t.blockId);
  return view === undefined || view.week === t.week;
}

/** …et est-elle réellement planifiée (les séances facultatives peuvent être coupées) ? */
export function isScheduled(t: WorkoutTemplate, views: Map<string, BlockView>): boolean {
  if (!inCurrentWeek(t, views)) return false;
  if (!t.optionalDay) return true;
  const view = t.blockId ? views.get(t.blockId) : undefined;
  return view?.block.optionalEnabled ?? true;
}

/** Les options « OU » d'un exercice, la principale en tête. */
export function itemOptions(item: TemplateItem): ItemVariant[] {
  return [
    { exerciseId: item.exerciseId, sets: item.sets, ...(item.note ? { note: item.note } : {}) },
    ...(item.variants ?? []),
  ];
}

/**
 * Option retenue par défaut. La règle « 1 semaine sur 2 » ne s'applique que si
 * les séances facultatives sont coupées : une fois l'Upper au planning, les
 * mouvements alternés y sont déjà couverts, et la principale reste en place.
 */
export function defaultOptionIndex(
  item: TemplateItem,
  week: number,
  optionalEnabled: boolean,
): number {
  const count = itemOptions(item).length;
  if (count < 2 || !item.alternateByWeek || optionalEnabled) return 0;
  return (week - 1) % count;
}

/** Choix par défaut pour toute une séance. */
export function defaultOptionIndexes(
  template: WorkoutTemplate,
  view: BlockView | undefined,
): number[] {
  return template.items.map((item) =>
    defaultOptionIndex(item, view?.week ?? 1, view?.block.optionalEnabled ?? false),
  );
}

export function optionAt(item: TemplateItem, index: number): ItemVariant {
  const options = itemOptions(item);
  return options[Math.min(Math.max(index, 0), options.length - 1)];
}
