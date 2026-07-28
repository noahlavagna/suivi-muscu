import type { Exercise } from '../db/types';

/**
 * Recherche d'exercices tolérante à la saisie.
 *
 * « developpe incline » doit trouver « Développé incliné » : on replie les
 * accents et la casse des deux côtés. Les termes sont cherchés indépendamment,
 * dans n'importe quel ordre, sur le nom, les groupes musculaires, le matériel
 * et les alias (abréviations et noms anglais du catalogue).
 */

/** « Développé incliné » → « developpe incline » */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Champs repliés une fois par exercice, mémorisés tant que l'objet ne change pas */
const haystacks = new WeakMap<Exercise, string>();

function haystack(e: Exercise): string {
  let h = haystacks.get(e);
  if (h === undefined) {
    h = fold(
      [e.name, ...e.muscleGroups, e.equipment ?? '', e.family ?? '', ...(e.aliases ?? [])].join(' '),
    );
    haystacks.set(e, h);
  }
  return h;
}

/** Tous les mots de la requête doivent apparaître, dans n'importe quel ordre. */
export function matches(exercise: Exercise, query: string): boolean {
  const terms = fold(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const h = haystack(exercise);
  return terms.every((t) => h.includes(t));
}

/**
 * Score de pertinence, du plus petit au plus grand : un exercice dont le nom
 * commence par la requête passe devant un simple alias.
 */
export function relevance(exercise: Exercise, query: string): number {
  const q = fold(query);
  if (q === '') return 0;
  const name = fold(exercise.name);
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  if (name.split(' ').some((w) => w.startsWith(q))) return 3;
  return 4;
}
