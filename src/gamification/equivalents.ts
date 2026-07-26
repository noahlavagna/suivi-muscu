/** Équivalents concrets du tonnage soulevé. Poids en kg, du plus léger au plus lourd. */
export interface Equivalent {
  kg: number;
  singular: string;
  plural: string;
}

export const EQUIVALENTS: Equivalent[] = [
  { kg: 70, singular: 'humain', plural: 'humains' },
  { kg: 350, singular: 'grizzly', plural: 'grizzlys' },
  { kg: 480, singular: 'piano à queue', plural: 'pianos à queue' },
  { kg: 700, singular: 'vache', plural: 'vaches' },
  { kg: 1500, singular: 'citadine', plural: 'citadines' },
  { kg: 2300, singular: 'rhinocéros', plural: 'rhinocéros' },
  { kg: 6000, singular: 'éléphant d’Afrique', plural: 'éléphants d’Afrique' },
  { kg: 9000, singular: 'T-Rex', plural: 'T-Rex' },
  { kg: 40000, singular: 'semi-remorque chargé', plural: 'semi-remorques chargés' },
  { kg: 73000, singular: 'char Leclerc', plural: 'chars Leclerc' },
  { kg: 150000, singular: 'baleine bleue', plural: 'baleines bleues' },
  { kg: 575000, singular: 'A380 au décollage', plural: 'A380 au décollage' },
  { kg: 10100000, singular: 'tour Eiffel', plural: 'tours Eiffel' },
];

export interface EquivalentResult {
  count: number;
  label: string;
  /** "2,3 vaches" */
  text: string;
}

const fmtCount = (n: number): string =>
  n >= 10 ? `${Math.round(n)}` : n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** La plus grosse unité dont on a soulevé au moins un exemplaire. */
export function bestEquivalent(kg: number): EquivalentResult | null {
  if (kg < EQUIVALENTS[0].kg) return null;
  let chosen = EQUIVALENTS[0];
  for (const e of EQUIVALENTS) if (kg >= e.kg) chosen = e;
  const count = kg / chosen.kg;
  const label = count >= 2 ? chosen.plural : chosen.singular;
  return { count, label, text: `${fmtCount(count)} ${label}` };
}

/** Progression vers le prochain palier (pour le cumul depuis le début). */
export function nextLandmark(kg: number): { label: string; percent: number } | null {
  for (const e of EQUIVALENTS) {
    if (kg < e.kg) return { label: e.singular, percent: (kg / e.kg) * 100 };
  }
  return null;
}
