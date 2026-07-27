import type { TargetSet } from '../db/types';
import type { LastPerf } from '../state/session';

/**
 * Coach de progression — double progression classique :
 * haut de fourchette atteint partout → on monte la charge ;
 * sous le bas de fourchette → on consolide ; sinon on vise plus de reps.
 * C'est une suggestion : jamais imposée, juste pré-remplie et affichée.
 */

export interface CoachAdvice {
  kind: 'increase' | 'reps' | 'consolidate';
  /** Delta de charge suggéré (0 sauf pour increase) */
  deltaKg: number;
  text: string;
}

export function coachAdvice(
  targets: TargetSet[],
  last: LastPerf | undefined,
  incrementKg: number,
): CoachAdvice | null {
  if (!last) return null;
  // Séries de travail comparables : cibles avec fourchette + perf mesurée en reps
  const pairs = targets
    .map((t, i) => ({ t, perf: last.sets[i] }))
    .filter(
      (p) =>
        p.t.repsMin != null &&
        p.t.repsMax != null &&
        p.t.type !== 'échauffement' &&
        !p.t.cluster &&
        p.perf?.reps != null &&
        p.perf.weightKg > 0,
    );
  if (pairs.length === 0) return null;

  const allTop = pairs.every((p) => p.perf!.reps! >= p.t.repsMax!);
  const anyUnder = pairs.some((p) => p.perf!.reps! < p.t.repsMin!);

  if (allTop) {
    return {
      kind: 'increase',
      deltaKg: incrementKg,
      text: `Fourchette maîtrisée — passe à +${incrementKg} kg`,
    };
  }
  if (anyUnder) {
    return {
      kind: 'consolidate',
      deltaKg: 0,
      text: 'Consolide la charge actuelle avant de monter',
    };
  }
  return {
    kind: 'reps',
    deltaKg: 0,
    text: 'Même charge — vise le haut de la fourchette',
  };
}
