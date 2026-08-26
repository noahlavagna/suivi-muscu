import { db, SCHEMA_VERSION } from './db';
import { rebuildAllPRs } from './prs';

/**
 * Sauvegarde complète — export fichier ET sauvegarde cloud.
 *
 * Les tables ne sont pas listées ici mais lues dans le schéma Dexie : une
 * table ajoutée à la base entre automatiquement dans la sauvegarde. La liste
 * écrite à la main qui précédait était un piège — elle avait déjà failli
 * laisser les blocs d'entraînement hors des sauvegardes, sans la moindre
 * erreur visible.
 */
function tableNames(): string[] {
  return db.tables.map((t) => t.name);
}

export interface BackupFile {
  app: 'suivi-muscu';
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

/** Dump complet de la base. */
export async function buildBackupData(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  for (const name of tableNames()) data[name] = await db.table(name).toArray();
  return {
    app: 'suivi-muscu',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function validateBackup(parsed: unknown): BackupFile {
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as BackupFile).app !== 'suivi-muscu' ||
    typeof (parsed as BackupFile).data !== 'object'
  ) {
    throw new Error('Fichier invalide : ce n’est pas un export La Forge.');
  }
  const backup = parsed as BackupFile;
  if (backup.schemaVersion > SCHEMA_VERSION) {
    throw new Error('Export créé par une version plus récente de l’app.');
  }
  return backup;
}

/**
 * Remplace intégralement les données locales par celles du backup.
 *
 * Une table absente du backup est vidée, pas laissée en l'état : restaurer,
 * c'est revenir exactement à l'instantané, y compris pour ce qui n'existait
 * pas encore quand il a été pris.
 */
export async function applyBackupData(
  backup: BackupFile,
): Promise<{ workouts: number; sets: number }> {
  const names = tableNames();
  await db.transaction('rw', names, async () => {
    for (const name of names) {
      await db.table(name).clear();
      const rows = backup.data[name];
      if (Array.isArray(rows) && rows.length > 0) await db.table(name).bulkPut(rows);
    }
  });
  await rebuildAllPRs();
  return {
    workouts: (backup.data.workouts ?? []).length,
    sets: (backup.data.setLogs ?? []).length,
  };
}

export async function exportBackup(): Promise<void> {
  const backup = await buildBackupData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `la-forge-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function importBackup(file: File): Promise<{ workouts: number; sets: number }> {
  const backup = validateBackup(JSON.parse(await file.text()));
  return applyBackupData(backup);
}
