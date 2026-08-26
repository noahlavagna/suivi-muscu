import { db } from './db';

/**
 * Détection générique des écritures en base.
 *
 * Les hooks sont posés sur **toutes** les tables du schéma Dexie, pas sur une
 * liste choisie : une table ajoutée plus tard est surveillée sans rien changer
 * ici, et aucune écriture ne peut passer inaperçue. C'est ce qui permet à la
 * sauvegarde cloud de suivre les badges, les paliers ou les réglages, et pas
 * seulement les séances terminées.
 */

let dirty = false;
let suspended = false;
const listeners = new Set<() => void>();

export const isDirty = (): boolean => dirty;
export const markClean = (): void => {
  dirty = false;
};

/**
 * Écritures qui ne sont pas des changements à re-sauvegarder — typiquement la
 * restauration d'une sauvegarde : la base vient précisément du cloud, la
 * repousser aussitôt serait un aller-retour inutile.
 */
export async function withoutDirtyTracking<T>(fn: () => Promise<T>): Promise<T> {
  suspended = true;
  try {
    return await fn();
  } finally {
    suspended = false;
  }
}

export function onDirty(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function touch(): void {
  if (suspended) return;
  dirty = true;
  for (const fn of listeners) fn();
}

let installed = false;

export function installDirtyTracking(): void {
  if (installed) return;
  installed = true;
  for (const table of db.tables) {
    // Les hooks Dexie peuvent modifier l'écriture via leur valeur de retour :
    // `touch` ne renvoie rien, l'opération passe donc intacte.
    table.hook('creating', touch);
    table.hook('updating', touch);
    table.hook('deleting', touch);
  }
}
