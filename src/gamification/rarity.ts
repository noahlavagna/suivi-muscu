import { useSettings } from '../state/settings';

/**
 * Rareté de la carte de fin de séance — qualité de forge côté Noah, qualité
 * de floraison côté Océane. Les paliers et leurs conditions sont identiques :
 * seul le nom change, comme pour les badges.
 */
export type RarityTier = 'fonte' | 'acier' | 'damas' | 'mythique';

export interface Rarity {
  tier: RarityTier;
  label: string;
  /** Punchline courte affichée sous le nom */
  line: string;
}

const BLOOM: Record<RarityTier, { label: string; line: string }> = {
  mythique: { label: 'Éclatante', line: 'Une séance comme on en fait peu.' },
  damas: { label: 'Radieuse', line: 'Un record est tombé aujourd’hui.' },
  acier: { label: 'Impeccable', line: 'Travail propre, rien à jeter.' },
  fonte: { label: 'Séance faite', line: 'C’est fait, et c’est ce qui compte.' },
};

/** Applique le vocabulaire du profil courant à une rareté calculée. */
function flavored(r: Rarity): Rarity {
  if (useSettings.getState().profile !== 'oceane') return r;
  return { ...r, ...BLOOM[r.tier] };
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
    return flavored({ tier: 'mythique', label: 'Mythique', line: 'Une pièce de légende sort de la forge.' });
  }
  if (prCount >= 1) {
    return flavored({ tier: 'damas', label: 'Damas', line: 'Le métal a chanté aujourd’hui.' });
  }
  if (completion >= 1 && (deltaPct === null || deltaPct >= 0)) {
    return flavored({ tier: 'acier', label: 'Acier trempé', line: 'Travail propre, rien à jeter.' });
  }
  return flavored({
    tier: 'fonte',
    label: 'Fonte brute',
    line: 'Le feu est entretenu. On refondra mieux.',
  });
}
