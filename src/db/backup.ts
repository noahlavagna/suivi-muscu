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
] as const;

interface BackupFile {
  app: 'suivi-muscu';
  schemaVersion: number;
  exportedAt: string;
  data: Record<(typeof TABLES)[number], unknown[]>;
}

export async function exportBackup(): Promise<void> {
  const data = {} as BackupFile['data'];
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  const backup: BackupFile = {
    app: 'suivi-muscu',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `suivi-muscu-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Remplace intégralement les données locales par celles du fichier. */
export async function importBackup(file: File): Promise<{ workouts: number; sets: number }> {
  const parsed: unknown = JSON.parse(await file.text());
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
