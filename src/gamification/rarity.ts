/** Rareté de la carte de fin de séance, façon qualité de forge. */
export type RarityTier = 'fonte' | 'acier' | 'damas' | 'mythique';

export interface Rarity {
  tier: RarityTier;
  label: string;
  /** Punchline courte affichée sous le nom */
  line: string;
}

export function computeRarity(input: {
  prCount: number;
  /** Delta de tonnage vs même séance précédente, en %, null si première */
  deltaPct: number | null;
  /** Séries validées / séries prévues */
  completion: number;
}): Rarity {
  const { prCount, deltaPct, completion } = input;
  if (prCount >= 3 || (prCount >= 2 && (deltaPct ?? 0) >= 5)) {
    return { tier: 'mythique', label: 'Mythique', line: 'Une pièce de légende sort de la forge.' };
  }
  if (prCount >= 1) {
    return { tier: 'damas', label: 'Damas', line: 'Le métal a chanté aujourd’hui.' };
  }
  if (completion >= 1 && (deltaPct === null || deltaPct >= 0)) {
    return { tier: 'acier', label: 'Acier trempé', line: 'Travail propre, rien à jeter.' };
  }
  return { tier: 'fonte', label: 'Fonte brute', line: 'Le feu est entretenu. On refondra mieux.' };
}
