import { db, SCHEMA_VERSION } from './db';
import { rebuildAllPRs } from './prs';

const TABLES = [
  'exercises',
  'templates',
  'workouts',
  'setLogs',
  'prs',
  'meta',
  'badges',
  'challenges',
  'bosses',
] as const;

export interface BackupFile {
  app: 'suivi-muscu';
  schemaVersion: number;
  exportedAt: string;
  data: Record<(typeof TABLES)[number], unknown[]>;
}

/** Dump complet de la base — utilisé par l'export fichier ET la sauvegarde cloud. */
export async function buildBackupData(): Promise<BackupFile> {
  const data = {} as BackupFile['data'];
  for (const t of TABLES) data[t] = await db.table(t).toArray();
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
    throw new Error('Fichier invalide : ce n’est pas un export Suivi Muscu.');
  }
  const backup = parsed as BackupFile;
  if (backup.schemaVersion > SCHEMA_VERSION) {
    throw new Error('Export créé par une version plus récente de l’app.');
  }
  return backup;
}

/** Remplace intégralement les données locales par celles du backup. */
export async function applyBackupData(
  backup: BackupFile,
): Promise<{ workouts: number; sets: number }> {
  await db.transaction('rw', TABLES.slice(), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      const rows = backup.data[t];
      if (Array.isArray(rows) && rows.length > 0) await db.table(t).bulkPut(rows);
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
  a.download = `suivi-muscu-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function importBackup(file: File): Promise<{ workouts: number; sets: number }> {
  const backup = validateBackup(JSON.parse(await file.text()));
  return applyBackupData(backup);
}
