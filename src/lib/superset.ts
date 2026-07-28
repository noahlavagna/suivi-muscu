/**
 * Repérage des blocs de superset.
 *
 * Un bloc n'existe que si des entrées **consécutives** partagent la même clé :
 * réordonner un exercice hors du groupe le défait naturellement, sans laisser
 * de clé orpheline à nettoyer dans les données.
 */

interface Keyed {
  supersetKey?: string;
}

/** Bornes du bloc contenant `i`. Renvoie `[i, i]` pour un exercice seul. */
export function supersetRange(entries: Keyed[], i: number): [number, number] {
  const key = entries[i]?.supersetKey;
  if (!key) return [i, i];
  let start = i;
  while (start > 0 && entries[start - 1].supersetKey === key) start -= 1;
  let end = i;
  while (end < entries.length - 1 && entries[end + 1].supersetKey === key) end += 1;
  return [start, end];
}

/**
 * Prochaine entrée à attaquer dans un bloc après avoir validé une série sur
 * `from`. On finit le tour en cours avant de revenir au début du bloc ;
 * `null` signifie que le bloc est bouclé.
 */
export function nextInSuperset(
  entries: Keyed[],
  from: number,
  hasPendingSets: (index: number) => boolean,
): { index: number; newRound: boolean } | null {
  const [start, end] = supersetRange(entries, from);
  if (end === start) return null;
  for (let i = from + 1; i <= end; i++) if (hasPendingSets(i)) return { index: i, newRound: false };
  for (let i = start; i <= from; i++) if (hasPendingSets(i)) return { index: i, newRound: true };
  return null;
}

/**
 * Étiquettes « Superset A / B… » par ligne, `null` hors bloc. Sert à l'éditeur
 * comme au récapitulatif de séance.
 */
export function supersetLabels(entries: Keyed[]): (string | null)[] {
  const labels: (string | null)[] = entries.map(() => null);
  let letter = 0;
  let i = 0;
  while (i < entries.length) {
    const key = entries[i].supersetKey;
    if (!key) {
      i += 1;
      continue;
    }
    const [, end] = supersetRange(entries, i);
    if (end > i) {
      const name = `Superset ${String.fromCharCode(65 + letter)}`;
      for (let k = i; k <= end; k++) labels[k] = name;
      letter += 1;
    }
    i = end + 1;
  }
  return labels;
}
