import Dexie, { type EntityTable } from 'dexie';
import type {
  BadgeRow,
  BossRow,
  ChallengeRow,
  Exercise,
  MetaRecord,
  PersonalRecord,
  SetLog,
  Workout,
  WorkoutTemplate,
} from './types';
import { syncCatalogue } from './seed';

export const SCHEMA_VERSION = 3;

export const db = new Dexie('suivi-muscu') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  templates: EntityTable<WorkoutTemplate, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  setLogs: EntityTable<SetLog, 'id'>;
  prs: EntityTable<PersonalRecord, 'id'>;
  meta: EntityTable<MetaRecord, 'id'>;
  badges: EntityTable<BadgeRow, 'id'>;
  challenges: EntityTable<ChallengeRow, 'id'>;
  bosses: EntityTable<BossRow, 'id'>;
};

db.version(1).stores({
  exercises: 'id, name, *muscleGroups',
  templates: 'id, order',
  workouts: 'id, date, templateId, startedAt',
  setLogs: 'id, workoutId, exerciseId, completedAt, [exerciseId+completedAt]',
  prs: 'id, exerciseId',
  meta: 'id',
});

db.version(2).stores({
  badges: 'id',
  challenges: 'id',
});

db.version(SCHEMA_VERSION).stores({
  bosses: 'id',
});

export const dbReady = syncCatalogue(db).then(async () => {
  // Demande le stockage persistant : réduit fortement le risque d'éviction iOS
  if (navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      /* non supporté : l'export JSON reste le filet de sécurité */
    }
  }
});
