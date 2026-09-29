/**
 * Mode Duo : ce qui se partage entre les deux téléphones, et les moments de
 * séance qui débloquent les mots d'encouragement.
 *
 * Tout est dérivé d'un même instantané (`LivePayload`) : on s'en sert pour
 * publier sa séance, pour afficher celle du binôme, et pour savoir quels mots
 * cachés révéler — chez soi — ou quels encouragements rapides proposer — chez
 * l'autre.
 */

/** Moment de la séance du destinataire où un mot se révèle. */
export type Unlock = 'now' | 'start' | 'first_set' | 'half' | 'last' | 'pr' | 'finish';

export const UNLOCKS: { id: Unlock; label: string; when: string }[] = [
  { id: 'now', label: 'Tout de suite', when: 'tout de suite' },
  { id: 'start', label: 'Début de séance', when: 'au lancement de sa séance' },
  { id: 'first_set', label: '1re série', when: 'à sa première série' },
  { id: 'half', label: 'Mi-séance', when: 'à la moitié de sa séance' },
  { id: 'last', label: 'Dernier exo', when: 'au dernier exercice' },
  { id: 'pr', label: 'Record', when: 'à son prochain record' },
  { id: 'finish', label: 'Fin de séance', when: 'à la fin de sa séance' },
];

export const unlockInfo = (u: string) => UNLOCKS.find((x) => x.id === u) ?? UNLOCKS[0];

/** Instantané de séance publié à chaque série — volontairement plat et léger. */
export interface LivePayload {
  v: 1;
  active: boolean;
  workoutId: string;
  workoutName: string;
  startedAt: number;
  exerciseName: string;
  exerciseIndex: number;
  exerciseCount: number;
  setsDone: number;
  setsTotal: number;
  prCount: number;
  tonnageKg: number;
  restEndsAt?: number;
  lastSet?: { exerciseName: string; weightKg: number; reps?: number; durationSec?: number };
  finishedAt?: number;
}

export const IDLE_PAYLOAD: LivePayload = {
  v: 1,
  active: false,
  workoutId: '',
  workoutName: '',
  startedAt: 0,
  exerciseName: '',
  exerciseIndex: 0,
  exerciseCount: 0,
  setsDone: 0,
  setsTotal: 0,
  prCount: 0,
  tonnageKg: 0,
};

/** Moments atteints dans la séance décrite par l'instantané. */
export function reachedUnlocks(p: LivePayload | null): Set<Unlock> {
  const out = new Set<Unlock>(['now']);
  if (!p || !p.workoutId) return out;
  out.add('start');
  if (p.setsDone >= 1) out.add('first_set');
  if (p.setsTotal > 0 && p.setsDone * 2 >= p.setsTotal) out.add('half');
  if (p.exerciseCount > 0 && p.exerciseIndex >= p.exerciseCount - 1) out.add('last');
  if (p.prCount > 0) out.add('pr');
  if (p.finishedAt) out.add('finish');
  return out;
}

/** Au-delà, une séance « en cours » est une séance oubliée : on ne l'affiche plus en direct. */
const STALE_MS = 4 * 3_600_000;
/** Une séance finie reste affichée un moment — le temps de se retrouver aux vestiaires. */
const FINISHED_VISIBLE_MS = 3 * 3_600_000;

export type PartnerState = 'live' | 'finished' | 'idle';

export function partnerState(p: LivePayload | null, updatedAt: number, now: number): PartnerState {
  if (!p) return 'idle';
  if (p.active && now - updatedAt < STALE_MS) return 'live';
  if (p.finishedAt && now - p.finishedAt < FINISHED_VISIBLE_MS) return 'finished';
  return 'idle';
}

/**
 * Encouragements rapides : chacun attend que le binôme ait atteint le moment
 * qui lui donne du sens — on ne félicite pas une moitié de séance pas encore faite.
 */
export const QUICK_CHEERS: { unlock: Unlock; text: string }[] = [
  { unlock: 'now', text: 'Tu gères 🔥' },
  { unlock: 'now', text: 'Pense à boire 💧' },
  { unlock: 'start', text: 'C’est parti, on lâche rien !' },
  { unlock: 'first_set', text: 'Première série dans la boîte 💪' },
  { unlock: 'half', text: 'La moitié est faite, la suite est à toi' },
  { unlock: 'last', text: 'Dernier exo, tout donner !' },
  { unlock: 'pr', text: 'UN RECORD ?! Monstre 🏆' },
  { unlock: 'finish', text: 'Séance bouclée, trop fier·e de toi 👏' },
];

/** Code de liaison : lisible à voix haute, sans 0/O ni 1/I. */
export function makeDuoCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
