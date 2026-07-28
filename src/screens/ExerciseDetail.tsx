import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { epley, PR_LABEL } from '../db/prs';
import type { PRKind } from '../db/types';
import { useSettings } from '../state/settings';
import { Screen, BackHeader, Card } from '../components/Screen';
import { Segmented } from '../components/ui/Segmented';
import { IconCrown } from '../components/ui/Icons';
import { LineChart, type LinePoint } from '../components/charts/LineChart';
import { fmtNumber, fmtWeight, kgToUnit, type Unit } from '../lib/format';
import { fmtDateShort } from '../lib/dates';
import { loadForReps, REP_MAX_TARGETS } from '../lib/analytics';

type Metric = 'e1rm' | 'charge' | 'volume';
type Period = '8s' | '6m' | '1a' | 'tout';

const PERIOD_MS: Record<Period, number> = {
  '8s': 8 * 7 * 86_400_000,
  '6m': 183 * 86_400_000,
  '1a': 365 * 86_400_000,
  tout: Infinity,
};

export function ExerciseDetailScreen({ exerciseId }: { exerciseId: string }) {
  const unit = useSettings((s) => s.unit);
  const [metric, setMetric] = useState<Metric>('e1rm');
  const [period, setPeriod] = useState<Period>('6m');

  const data = useLiveQuery(async () => {
    const [exercise, logs, prs, workouts] = await Promise.all([
      db.exercises.get(exerciseId),
      db.setLogs
        .where('[exerciseId+completedAt]')
        .between([exerciseId, 0], [exerciseId, Infinity])
        .toArray(),
      db.prs.where('exerciseId').equals(exerciseId).toArray(),
      db.workouts.toArray(),
    ]);
    const finished = new Set(workouts.filter((w) => w.finishedAt).map((w) => w.id));
    return { exercise, logs: logs.filter((l) => finished.has(l.workoutId)), prs };
  }, [exerciseId]);

  if (!data?.exercise) return <Screen>{null}</Screen>;
  const { exercise, logs, prs } = data;

  const since = Date.now() - PERIOD_MS[period];
  const inPeriod = logs.filter((l) => l.completedAt >= since && l.reps != null && l.weightKg > 0);

  // Un point par séance : meilleure valeur de la métrique
  const byWorkout = new Map<string, { ts: number; value: number }>();
  for (const l of inPeriod) {
    const value =
      metric === 'e1rm'
        ? epley(l.weightKg, l.reps!)
        : metric === 'charge'
          ? l.weightKg
          : l.weightKg * l.reps!;
    const cur = byWorkout.get(l.workoutId);
    if (!cur) byWorkout.set(l.workoutId, { ts: l.completedAt, value });
    else {
      cur.value = metric === 'volume' ? cur.value + value : Math.max(cur.value, value);
      cur.ts = Math.min(cur.ts, l.completedAt);
    }
  }
  const points: LinePoint[] = [...byWorkout.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((p) => ({
      x: p.ts,
      y: Math.round(kgToUnit(p.value, unit) * 10) / 10,
      label: new Date(p.ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    }));

  // Historique groupé par séance, récent d'abord
  const sessions = new Map<string, typeof logs>();
  for (const l of [...logs].sort((a, b) => b.completedAt - a.completedAt)) {
    const list = sessions.get(l.workoutId) ?? [];
    list.push(l);
    sessions.set(l.workoutId, list);
  }

  // Meilleur 1RM estimé toutes périodes confondues : base des charges théoriques
  const bestE1rm = prs.find((p) => p.kind === 'e1rm')?.value ?? 0;

  const formatY = (v: number) => `${fmtNumber(v, 0)}${metric === 'volume' ? '' : ` ${unit}`}`;

  return (
    <Screen bottomPadding={40}>
      <BackHeader title={exercise.name} />

      <div className="mb-3 flex flex-col gap-2">
        <Segmented<Metric>
          ariaLabel="Métrique"
          options={[
            { value: 'e1rm', label: '1RM estimé' },
            { value: 'charge', label: 'Charge' },
            { value: 'volume', label: 'Volume' },
          ]}
          value={metric}
          onChange={setMetric}
        />
        <Segmented<Period>
          ariaLabel="Période"
          options={[
            { value: '8s', label: '8 sem' },
            { value: '6m', label: '6 mois' },
            { value: '1a', label: '1 an' },
            { value: 'tout', label: 'Tout' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <Card className="mb-4">
        {points.length >= 2 ? (
          <LineChart points={points} formatY={formatY} />
        ) : (
          <p className="py-10 text-center text-[13px] text-ink-3">
            Pas assez de données sur cette période
          </p>
        )}
      </Card>

      {prs.length > 0 && (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            <IconCrown size={15} className="text-accent" /> Records
          </p>
          <Card className="mb-4 grid grid-cols-2 gap-x-4 !py-2.5">
            {(['charge', 'e1rm', 'reps', 'volume'] as PRKind[]).map((kind) => {
              const pr = prs.find((p) => p.kind === kind);
              if (!pr) return null;
              return (
                <div key={kind} className="py-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
                    {PR_LABEL[kind]}
                  </p>
                  <p className="tnum text-[17px] font-bold">
                    {kind === 'reps'
                      ? `${pr.value} reps`
                      : kind === 'charge'
                        ? `${fmtWeight(pr.value, unit)} × ${pr.reps ?? '—'}`
                        : fmtWeight(pr.value, unit)}
                  </p>
                  <p className="text-[11px] text-ink-3">{fmtDateShort(pr.date)}</p>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {bestE1rm > 0 && (
        <>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            Charges théoriques
          </p>
          <Card className="mb-4">
            <p className="mb-3 text-[12px] leading-4.5 text-ink-2">
              Dérivées de ton 1RM estimé ({fmtWeight(bestE1rm, unit)}) par la formule d’Epley. Un
              repère pour choisir une charge, pas une garantie.
            </p>
            <div className="flex flex-wrap gap-2">
              {REP_MAX_TARGETS.map((reps) => (
                <div key={reps} className="min-w-[68px] flex-1 rounded-[10px] bg-raised-2 px-2 py-2">
                  <p className="tnum text-[11px] font-medium text-ink-3">{reps} reps</p>
                  <p className="tnum text-[15px] font-bold">
                    {fmtNumber(kgToUnit(loadForReps(bestE1rm, reps), unit))}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        Historique
      </p>
      <Card className="!px-4 !py-1">
        {[...sessions.entries()].slice(0, 30).map(([workoutId, list]) => {
          const sorted = [...list].sort((a, b) => a.setIndex - b.setIndex);
          return (
            <div key={workoutId} className="border-b border-sep py-2.5 last:border-b-0">
              <p className="text-[12px] font-medium text-ink-3">
                {new Date(sorted[0].completedAt).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="tnum mt-0.5 text-[14px]">
                {sorted
                  .map((l) =>
                    l.reps != null
                      ? `${fmtNumber(kgToUnit(l.weightKg, unit))}×${l.reps}`
                      : `${l.durationSec ?? 0}s`,
                  )
                  .join(' · ')}
              </p>
            </div>
          );
        })}
      </Card>
    </Screen>
  );
}

export type { Unit };
