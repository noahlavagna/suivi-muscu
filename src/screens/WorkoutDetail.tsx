import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { rebuildAllPRs } from '../db/prs';
import type { SetLog } from '../db/types';
import { useNav } from '../state/nav';
import { useSettings } from '../state/settings';
import { Screen, BackHeader, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { Sheet } from '../components/ui/Sheet';
import { Stepper } from '../components/ui/Stepper';
import { IconTrash } from '../components/ui/Icons';
import { fmtDurationLong, fmtNumber, fmtTonnage, kgToUnit } from '../lib/format';
import { fmtDateLong } from '../lib/dates';

export function WorkoutDetailScreen({ workoutId }: { workoutId: string }) {
  const pop = useNav((s) => s.pop);
  const unit = useSettings((s) => s.unit);
  const [editLog, setEditLog] = useState<SetLog | null>(null);

  const data = useLiveQuery(async () => {
    const workout = await db.workouts.get(workoutId);
    const logs = await db.setLogs.where('workoutId').equals(workoutId).toArray();
    const exercises = new Map(
      (await db.exercises.bulkGet([...new Set(logs.map((l) => l.exerciseId))])).map((e) => [
        e?.id,
        e,
      ]),
    );
    return { workout, logs, exercises };
  }, [workoutId]);

  if (!data?.workout) return <Screen>{null}</Screen>;
  const { workout, logs, exercises } = data;

  // Groupes par exercice, dans l'ordre d'exécution
  const order: string[] = [];
  const groups = new Map<string, SetLog[]>();
  for (const l of [...logs].sort((a, b) => a.completedAt - b.completedAt)) {
    if (!groups.has(l.exerciseId)) {
      groups.set(l.exerciseId, []);
      order.push(l.exerciseId);
    }
    groups.get(l.exerciseId)!.push(l);
  }

  const tonnage = logs.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0);

  const saveEdit = async () => {
    if (!editLog) return;
    await db.setLogs.put(editLog);
    setEditLog(null);
    await rebuildAllPRs();
  };

  const deleteSet = async () => {
    if (!editLog) return;
    await db.setLogs.delete(editLog.id);
    setEditLog(null);
    await rebuildAllPRs();
  };

  return (
    <Screen bottomPadding={40}>
      <BackHeader
        title={workout.name}
        right={
          <Pressable
            className="flex h-10 w-10 items-center justify-center text-negative"
            aria-label="Supprimer la séance"
            onClick={() => {
              if (window.confirm('Supprimer définitivement cette séance ?')) {
                void (async () => {
                  await db.setLogs.where('workoutId').equals(workoutId).delete();
                  await db.workouts.delete(workoutId);
                  await rebuildAllPRs();
                  pop();
                })();
              }
            }}
          >
            <IconTrash size={20} />
          </Pressable>
        }
      />

      <p className="tnum mb-4 text-[14px] text-ink-2">
        {fmtDateLong(workout.date)}
        {workout.finishedAt &&
          ` · ${fmtDurationLong((workout.finishedAt - workout.startedAt) / 1000)}`}{' '}
        · {logs.length} séries · {fmtTonnage(tonnage, unit)}
      </p>

      {order.map((exId) => {
        const ex = exercises.get(exId);
        const list = groups.get(exId)!.sort((a, b) => a.setIndex - b.setIndex);
        const note = workout.exerciseNotes?.[exId];
        return (
          <Card key={exId} className="mb-3 !px-4 !py-2">
            <p className="border-b border-sep pb-2 pt-1 text-[15px] font-semibold">
              {ex?.name ?? '—'}
            </p>
            {note && <p className="border-b border-sep py-2 text-[13px] italic text-ink-2">{note}</p>}
            {list.map((l) => (
              <Pressable
                key={l.id}
                className="flex w-full items-center justify-between border-b border-sep py-2.5 text-left last:border-b-0"
                onClick={() => setEditLog({ ...l })}
              >
                <span className="text-[13px] text-ink-3">Série {l.setIndex + 1}</span>
                <span className="tnum text-[15px] font-medium">
                  {l.reps != null
                    ? `${fmtNumber(kgToUnit(l.weightKg, unit))} ${unit} × ${l.reps}`
                    : `${l.durationSec ?? 0} s`}
                </span>
              </Pressable>
            ))}
          </Card>
        );
      })}

      <textarea
        className="mt-1 w-full rounded-[12px] bg-raised p-3 text-[15px] text-ink placeholder:text-ink-3"
        rows={2}
        placeholder="Note de séance…"
        value={workout.note ?? ''}
        onChange={(e) => void db.workouts.update(workoutId, { note: e.target.value })}
      />

      <Sheet open={editLog !== null} onClose={() => setEditLog(null)} ariaLabel="Modifier la série">
        {editLog && (
          <div className="pb-3 pt-1">
            <h2 className="mb-4 text-[20px] font-bold">
              {exercises.get(editLog.exerciseId)?.name} — série {editLog.setIndex + 1}
            </h2>
            <div className="flex items-center justify-center gap-6">
              {editLog.reps != null ? (
                <>
                  <Stepper
                    label={`Poids (${unit})`}
                    value={editLog.weightKg}
                    step={exercises.get(editLog.exerciseId)?.weightIncrementKg ?? 2.5}
                    onChange={(v) => setEditLog({ ...editLog, weightKg: v })}
                    format={(v) => fmtNumber(kgToUnit(v, unit))}
                    ariaLabel="Poids"
                  />
                  <Stepper
                    label="Reps"
                    value={editLog.reps}
                    step={1}
                    onChange={(v) => setEditLog({ ...editLog, reps: v })}
                    ariaLabel="Répétitions"
                  />
                </>
              ) : (
                <Stepper
                  label="Durée"
                  value={editLog.durationSec ?? 0}
                  step={5}
                  onChange={(v) => setEditLog({ ...editLog, durationSec: v })}
                  format={(v) => `${Math.round(v)} s`}
                  ariaLabel="Durée"
                />
              )}
            </div>
            <Pressable
              className="mt-6 w-full rounded-[14px] bg-accent py-3.5 text-[17px] font-semibold text-canvas"
              onClick={() => void saveEdit()}
            >
              Enregistrer
            </Pressable>
            <Pressable
              className="mt-2 w-full rounded-[14px] py-3 text-[15px] font-semibold text-negative"
              onClick={() => void deleteSet()}
            >
              Supprimer la série
            </Pressable>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
