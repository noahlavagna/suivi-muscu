export type MuscleGroup =
  | 'épaules'
  | 'dos'
  | 'pectoraux'
  | 'trapèzes'
  | 'quadriceps'
  | 'ischios'
  | 'fessiers'
  | 'adducteurs'
  | 'mollets'
  | 'biceps'
  | 'triceps'
  | 'avant-bras'
  | 'abdos'
  | 'lombaires'
  | 'cardio'
  | 'mobilité';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'pectoraux',
  'dos',
  'épaules',
  'trapèzes',
  'biceps',
  'triceps',
  'avant-bras',
  'quadriceps',
  'ischios',
  'fessiers',
  'adducteurs',
  'mollets',
  'abdos',
  'lombaires',
  'cardio',
  'mobilité',
];

/** Groupes qui comptent dans le volume de musculation (hors cardio et mobilité) */
export const LIFTING_GROUPS: MuscleGroup[] = MUSCLE_GROUPS.filter(
  (g) => g !== 'cardio' && g !== 'mobilité',
);

export type Equipment =
  | 'barre'
  | 'haltères'
  | 'poulie'
  | 'machine'
  | 'smith'
  | 'poids du corps'
  | 'kettlebell'
  | 'élastique'
  | 'autre';

export const EQUIPMENTS: Equipment[] = [
  'barre',
  'haltères',
  'poulie',
  'machine',
  'smith',
  'poids du corps',
  'kettlebell',
  'élastique',
  'autre',
];

/** Nature du mouvement — sert au filtrage, pas au calcul */
export type ExerciseFamily =
  | 'polyarticulaire'
  | 'isolation'
  | 'gainage'
  | 'mobilité'
  | 'explosif'
  | 'cardio';

export const FAMILIES: ExerciseFamily[] = [
  'polyarticulaire',
  'isolation',
  'gainage',
  'explosif',
  'cardio',
  'mobilité',
];

export type SetType =
  | 'normal'
  | 'topset'
  | 'backoff'
  | 'cluster'
  | 'superlent'
  | 'hold'
  | 'échauffement';

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: '',
  topset: 'Top set',
  backoff: 'Back-off',
  cluster: 'Cluster',
  superlent: 'Superlent',
  hold: 'Hold',
  échauffement: 'Échauff.',
};

export interface Exercise {
  id: string;
  name: string;
  /** Le premier est le groupe principal, les suivants sont secondaires */
  muscleGroups: MuscleGroup[];
  weightIncrementKg: number;
  defaultRestSec: number;
  isTimeBased: boolean;
  /** Complétés à la volée pour les bases antérieures au catalogue (voir catalogue.ts) */
  equipment?: Equipment;
  family?: ExerciseFamily;
  /** Termes de recherche alternatifs : abréviations, noms anglais */
  aliases?: string[];
  note?: string;
  archivedAt?: number;
}

export interface TargetSet {
  type: SetType;
  repsMin?: number;
  repsMax?: number;
  durationSec?: number;
  /** Borne haute quand la consigne est un intervalle (« 45 à 60 sec ») */
  durationSecMax?: number;
  cluster?: { reps: number; count: number; restSec: number };
}

/**
 * Une série se saisit en durée dès qu'elle en porte une — gainage, mobilité,
 * échauffement chronométré. Le type `hold` reste reconnu pour les bases
 * antérieures, où la durée pouvait manquer.
 */
export const isDurationSet = (t: TargetSet): boolean =>
  t.type === 'hold' || t.durationSec != null;

/**
 * Série sans consigne : on la valide quand la sensation est là. Les postures
 * d'échauffement n'ont ni durée ni répétitions à tenir — les chiffrer
 * inventerait une contrainte que le programme ne pose pas.
 */
export const isFreeSet = (t: TargetSet): boolean =>
  t.type === 'échauffement' && t.repsMin == null && t.durationSec == null && !t.cluster;

/** Un exercice d'échauffement : toutes ses séries sont de ce type. */
export const isWarmupSets = (sets: TargetSet[]): boolean =>
  sets.length > 0 && sets.every((s) => s.type === 'échauffement');

/** Option « OU » d'un exercice : autre mouvement et/ou autre schéma de séries. */
export interface ItemVariant {
  exerciseId: string;
  sets: TargetSet[];
  note?: string;
}

export interface TemplateItem {
  exerciseId: string;
  sets: TargetSet[];
  restSecOverride?: number;
  note?: string;
  /**
   * Superset : les items **consécutifs** partageant cette clé s'enchaînent sans
   * repos, le repos ne s'appliquant qu'en fin de tour. Absent = exercice seul.
   */
  supersetKey?: string;
  /**
   * Options « OU » qui suivent la principale (`exerciseId` + `sets`). L'option
   * retenue est choisie au lancement de la séance, puis modifiable tant
   * qu'aucune série n'est validée.
   */
  variants?: ItemVariant[];
  /**
   * « 1 semaine sur 2 » : l'option suit la parité de la semaine de bloc, sauf
   * si les séances facultatives du bloc sont activées (voir `optionalEnabled`).
   */
  alternateByWeek?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  weekdays: number[]; // 0 = dimanche … 6 = samedi (convention JS Date)
  order: number;
  items: TemplateItem[];
  /** Bloc (mésocycle) auquel la séance appartient — voir `BlockRow` */
  blockId?: string;
  /** Semaine du bloc, 1-indexée. Seule celle en cours est planifiée. */
  week?: number;
  /** Séance facultative : planifiée seulement si le bloc l'active */
  optionalDay?: boolean;
  /** Consigne de la séance (RIR, récup…) affichée en tête de séance */
  note?: string;
}

/** Réglages d'intensité d'une semaine de bloc. */
export interface BlockWeek {
  week: number;
  /** Ex. « RIR 3/4 » — affiché tel quel */
  rir: string;
  restSec: number;
  /** Borne haute quand la récup est donnée en intervalle (« 3'00 à 3'30 ») */
  restSecMax?: number;
}

/**
 * Bloc d'entraînement : une même trame de séances déclinée sur plusieurs
 * semaines d'intensité croissante.
 *
 * Le palier n'avance pas au calendrier mais à l'effort : il monte quand toutes
 * les séances du palier ont été faites, sur confirmation. Une semaine où il
 * manque une séance ne fait donc pas sauter un cran d'intensité.
 */
export interface BlockRow {
  id: string;
  name: string;
  desc?: string;
  /** Jour d'installation du bloc (YYYY-MM-DD), informatif */
  startDate: string;
  weeks: BlockWeek[];
  /** Palier en cours, 1-indexé */
  currentWeek: number;
  /** Entrée dans le palier courant (ms) — sert à compter les séances faites depuis */
  weekStartedAt: number;
  /** Le dernier palier est un point d'arrivée : aucune montée n'est proposée après */
  holdLastWeek: boolean;
  /** Les séances `optionalDay` sont-elles planifiées ? */
  optionalEnabled: boolean;
}

export interface Workout {
  id: string;
  templateId?: string;
  name: string;
  date: string; // YYYY-MM-DD
  startedAt: number;
  finishedAt?: number;
  note?: string;
  /** Notes rapides par exercice, saisies pendant la séance */
  exerciseNotes?: Record<string, string>;
}

export interface SetLog {
  id: string;
  workoutId: string;
  exerciseId: string;
  completedAt: number;
  weightKg: number;
  reps?: number;
  durationSec?: number;
  type: SetType;
  setIndex: number;
}

export type PRKind = 'charge' | 'reps' | 'volume' | 'e1rm';

export interface PersonalRecord {
  id: string; // `${exerciseId}:${kind}`
  exerciseId: string;
  kind: PRKind;
  value: number;
  weightKg?: number;
  reps?: number;
  workoutId: string;
  date: string;
}

export interface ActiveSessionMeta {
  id: 'activeSession';
  workoutId: string;
  templateId?: string;
  currentExerciseIndex: number;
  restEndsAt?: number;
  restTotalSec?: number;
  restExerciseId?: string;
  /** Option « OU » retenue par exercice, dans l'ordre des items de la séance */
  variantChoices?: number[];
}

/**
 * Deux personnes, deux applications dans la même app : le profil décide du
 * programme installé, du vocabulaire, de la direction artistique et des écrans.
 * C'est un réglage d'appareil — chacune installe la PWA sur son téléphone.
 */
export type Profile = 'noah' | 'oceane';

export interface Settings {
  id: 'settings';
  profile: Profile;
  unit: 'kg' | 'lb';
  theme: 'system' | 'dark' | 'light';
  sound: boolean;
  haptics: boolean;
  defaultRestSec: number;
}

/** Badge débloqué (les définitions vivent dans le code, ici seulement l'état) */
export interface BadgeRow {
  id: string; // id de la définition
  unlockedAt: number;
  workoutId?: string;
}

export type ChallengeKind = 'tonnage' | 'series' | 'pr';

/** Contrat hebdomadaire généré le lundi */
export interface ChallengeRow {
  id: string; // clé de semaine 'YYYY-MM-DD' (lundi)
  kind: ChallengeKind;
  target: number;
  desc: string;
  xp: number;
  createdAt: number;
  doneAt?: number;
}

/** Dernier récap mensuel affiché */
export interface WrappedMeta {
  id: 'wrapped';
  lastMonth: string; // 'YYYY-MM'
}

/** L'onboarding a été passé (même en partant de zéro) */
export interface OnboardedMeta {
  id: 'onboarded';
  at: number;
}

/** Le Colosse du mois : boss dont les PV = objectif de tonnage mensuel */
export interface BossRow {
  id: string; // 'YYYY-MM'
  name: string;
  hpTotal: number; // kg
  createdAt: number;
  slainAt?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  profile: 'noah',
  unit: 'kg',
  theme: 'system',
  sound: true,
  haptics: true,
  defaultRestSec: 90,
};

export type MetaRecord = ActiveSessionMeta | Settings | WrappedMeta | OnboardedMeta;
