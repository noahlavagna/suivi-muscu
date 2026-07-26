import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNav } from '../state/nav';
import { useSettings } from '../state/settings';
import { Screen, LargeTitle, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { IconChevronRight, IconSearch } from '../components/ui/Icons';
import { fmtDurationLong, fmtTonnage } from '../lib/format';
import { relativeDay } from '../lib/dates';

interface HistoryRow {
  id: string;
  name: string;
  date: string;
  durationSec: number;
  sets: number;
  tonnageKg: number;
}

async function loadHistory(query: string): Promise<HistoryRow[]> {
  const q = query.trim().toLowerCase();
  let workouts = (await db.workouts.toArray()).filter((w) => w.finishedAt);
  const logs = await db.setLogs.toArray();

  if (q !== '') {
    const matching = new Set(
      (await db.exercises.toArray())
        .filter((e) => e.name.toLowerCase().includes(q))
        .map((e) => e.id),
    );
    const workoutIds = new Set(
      logs.filter((l) => matching.has(l.exerciseId)).map((l) => l.workoutId),
    );
    workouts = workouts.filter(
      (w) => workoutIds.has(w.id) || w.name.toLowerCase().includes(q),
    );
  }

  const byWorkout = new Map<string, { sets: number; tonnage: number }>();
  for (const l of logs) {
    const agg = byWorkout.get(l.workoutId) ?? { sets: 0, tonnage: 0 };
    agg.sets += 1;
    agg.tonnage += l.reps ? l.weightKg * l.reps : 0;
    byWorkout.set(l.workoutId, agg);
  }

  return workouts
    .sort((a, b) => b.startedAt - a.startedAt)
    .map((w) => ({
      id: w.id,
      name: w.name,
      date: w.date,
      durationSec: ((w.finishedAt ?? w.startedAt) - w.startedAt) / 1000,
      sets: byWorkout.get(w.id)?.sets ?? 0,
      tonnageKg: byWorkout.get(w.id)?.tonnage ?? 0,
    }));
}

export function HistoryScreen() {
  const [query, setQuery] = useState('');
  const rows = useLiveQuery(() => loadHistory(query), [query]);
  const push = useNav((s) => s.push);
  const unit = useSettings((s) => s.unit);

  return (
    <Screen>
      <LargeTitle sub={rows ? `${rows.length} séance${rows.length > 1 ? 's' : ''}` : ' '}>
        Historique
      </LargeTitle>

      <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-raised px-3">
        <IconSearch size={17} className="shrink-0 text-ink-3" />
        <input
          type="text"
          className="w-full bg-transparent py-2.5 text-[16px] text-ink placeholder:text-ink-3"
          placeholder="Filtrer par exercice ou séance…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {rows && rows.length === 0 && (
        <Card className="py-8 text-center">
          <p className="text-[15px] font-semibold">Aucune séance</p>
          <p className="mt-1 text-[13px] text-ink-2">
            {query ? 'Rien ne correspond à cette recherche.' : 'Ta première séance apparaîtra ici.'}
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {rows?.map((r) => (
          <Pressable
            key={r.id}
            className="text-left"
            onClick={() => push({ type: 'workout-detail', workoutId: r.id })}
          >
            <Card className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{r.name}</p>
                <p className="tnum mt-0.5 text-[13px] text-ink-2">
                  {relativeDay(r.date)} · {r.sets} série{r.sets > 1 ? 's' : ''} ·{' '}
                  {fmtTonnage(r.tonnageKg, unit)} · {fmtDurationLong(r.durationSec)}
                </p>
              </div>
              <IconChevronRight size={16} className="shrink-0 text-ink-3" />
            </Card>
          </Pressable>
        ))}
      </div>
    </Screen>
  );
}
