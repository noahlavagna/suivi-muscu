import { useRef, useState } from 'react';
import { useSettings } from '../state/settings';
import { exportBackup, importBackup } from '../db/backup';
import { Screen, BackHeader, Card } from '../components/Screen';
import { Segmented } from '../components/ui/Segmented';
import { Toggle } from '../components/ui/Toggle';
import { Stepper } from '../components/ui/Stepper';
import { Pressable } from '../components/ui/Pressable';
import { IconDownload, IconUpload } from '../components/ui/Icons';
import { fmtTimer } from '../lib/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-sep py-3 last:border-b-0">
      <span className="text-[15px] font-medium">{label}</span>
      {children}
    </div>
  );
}

import { CloudCard } from '../components/CloudCard';

export function SettingsScreen() {
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const onImportFile = async (file: File) => {
    if (
      !window.confirm(
        'Importer ce fichier REMPLACE toutes les données actuelles. Continuer ?',
      )
    )
      return;
    try {
      const res = await importBackup(file);
      setImportMsg(`Import réussi : ${res.workouts} séances, ${res.sets} séries.`);
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import impossible.');
    }
  };

  return (
    <Screen bottomPadding={40}>
      <BackHeader title="Réglages" />

      <CloudCard />

      <Card className="mb-4 !py-1">
        <Row label="Unité">
          <div className="w-32">
            <Segmented
              ariaLabel="Unité"
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'lb', label: 'lb' },
              ]}
              value={s.unit}
              onChange={(unit) => s.update({ unit })}
            />
          </div>
        </Row>
        <Row label="Thème">
          <div className="w-56">
            <Segmented
              ariaLabel="Thème"
              options={[
                { value: 'system', label: 'Auto' },
                { value: 'dark', label: 'Sombre' },
                { value: 'light', label: 'Clair' },
              ]}
              value={s.theme}
              onChange={(theme) => s.update({ theme })}
            />
          </div>
        </Row>
        <Row label="Son (fin de repos, PR)">
          <Toggle checked={s.sound} onChange={(sound) => s.update({ sound })} ariaLabel="Son" />
        </Row>
        <Row label="Vibrations">
          <Toggle
            checked={s.haptics}
            onChange={(haptics) => s.update({ haptics })}
            ariaLabel="Vibrations"
          />
        </Row>
        <Row label="Repos par défaut">
          <Stepper
            size="sm"
            value={s.defaultRestSec}
            step={15}
            min={15}
            onChange={(defaultRestSec) => s.update({ defaultRestSec })}
            format={(v) => fmtTimer(v)}
            ariaLabel="Repos par défaut"
          />
        </Row>
      </Card>

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">Données</p>
      <Card className="!py-1">
        <Row label="Exporter (JSON)">
          <Pressable
            className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-dim text-accent"
            onClick={() => void exportBackup()}
            aria-label="Exporter les données"
          >
            <IconDownload size={18} />
          </Pressable>
        </Row>
        <Row label="Importer (remplace tout)">
          <Pressable
            className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-raised-2 text-ink-2"
            onClick={() => fileRef.current?.click()}
            aria-label="Importer des données"
          >
            <IconUpload size={18} />
          </Pressable>
        </Row>
      </Card>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onImportFile(f);
          e.target.value = '';
        }}
      />
      {importMsg && <p className="mt-3 text-[13px] text-ink-2">{importMsg}</p>}
      <p className="mt-4 text-[12px] leading-4 text-ink-3">
        iOS peut purger le stockage local d’une app web inutilisée. Exporte régulièrement tes
        données — le fichier JSON se réimporte tel quel.
      </p>
    </Screen>
  );
}
