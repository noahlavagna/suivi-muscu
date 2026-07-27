export type MuscleGroup =
  | 'épaules'
  | 'dos'
  | 'pectoraux'
  | 'quadriceps'
  | 'ischios'
  | 'fessiers'
  | 'adducteurs'
  | 'biceps'
  | 'triceps'
  | 'mobilité';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'épaules',
  'dos',
  'pectoraux',
  'quadriceps',
  'ischios',
  'fessiers',
  'adducteurs',
  'biceps',
  'triceps',
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
  muscleGroups: MuscleGroup[];
  weightIncrementKg: number;
  defaultRestSec: number;
  isTimeBased: boolean;
  note?: string;
  archivedAt?: number;
}

export interface TargetSet {
  type: SetType;
  repsMin?: number;
  repsMax?: number;
  durationSec?: number;
  cluster?: { reps: number; count: number; restSec: number };
}

export interface TemplateItem {
  exerciseId: string;
  sets: TargetSet[];
  restSecOverride?: number;
  note?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  weekdays: number[]; // 0 = dimanche … 6 = samedi (convention JS Date)
  order: number;
  items: TemplateItem[];
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
}

export interface Settings {
  id: 'settings';
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
  unit: 'kg',
  theme: 'system',
  sound: true,
  haptics: true,
  defaultRestSec: 90,
};

export type MetaRecord = ActiveSessionMeta | Settings | WrappedMeta | OnboardedMeta;
