import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { computeWrapped, prevMonthKey, type WrappedData } from '../gamification/wrapped';
import { WrappedStory } from '../components/gami/WrappedStory';
import { IconFlame } from '../components/ui/Icons';
import { PR_LABEL } from '../db/prs';
import type { Exercise, MuscleGroup } from '../db/types';
import { useNav } from '../state/nav';
import { useSettings } from '../state/settings';
import { Screen, LargeTitle, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { BarChart } from '../components/charts/BarChart';
import { Heatmap } from '../components/charts/Heatmap';
import { IconChevronRight, IconTrophy } from '../components/ui/Icons';
import { fmtNumber, fmtTonnage, kgToUnit } from '../lib/format';
import { addDays, fmtDateShort, startOfWeek, toISODate } from '../lib/dates';

interface ProgressData {
  weekSessions: number;
  weekSets: number;
  weekTonnage: number;
  weeklyBars: { label: string; value: number }[];
  heatCounts: Map<string, number>;
  groupSets: { group: MuscleGroup; count: number }[];
  trainedExercises: Exercise[];
  recentPRs: { label: string; exercise: string; value: string; date: string; exerciseId: string }[];
}

async function loadProgress(unit: 'kg' | 'lb'): Promise<ProgressData> {
  const [workouts, logs, exercises, prs] = await Promise.all([
    db.workouts.toArray(),
    db.setLogs.toArray(),
    db.exercises.toArray(),
    db.prs.toArray(),
  ]);
  const finished = new Map(workouts.filter((w) => w.finishedAt).map((w) => [w.id, w]));
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const validLogs = logs.filter((l) => finished.has(l.workoutId));

  const monday = startOfWeek(new Date());
  const weekStartTs = monday.getTime();

  const weekLogs = validLogs.filter((l) => l.completedAt >= weekStartTs);
  const weekSessions = new Set(weekLogs.map((l) => l.workoutId)).size;
  const weekTonnage = weekLogs.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0);

  // Séries par semaine, 8 dernières
  const weeklyBars = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(monday, -7 * (7 - i));
    const end = addDays(start, 7);
    const count = validLogs.filter(
      (l) => l.completedAt >= start.getTime() && l.completedAt < end.getTime(),
    ).length;
    return {
      label: start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
      value: count,
    };
  });

  // Heatmap : séries par jour
  const heatCounts = new Map<string, number>();
  for (const l of validLogs) {
    const iso = toISODate(new Date(l.completedAt));
    heatCounts.set(iso, (heatCounts.get(iso) ?? 0) + 1);
  }

  // Séries par groupe musculaire (4 dernières semaines)
  const fourWeeksAgo = addDays(monday, -21).getTime();
  const groupCounts = new Map<MuscleGroup, number>();
  for (const l of validLogs) {
    if (l.completedAt < fourWeeksAgo) continue;
    const g = exMap.get(l.exerciseId)?.muscleGroups[0];
    if (g && g !== 'mobilité') groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1);
  }
  const groupSets = [...groupCounts.entries()]
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);

  // Exercices avec historique, du plus récent au plus ancien
  const lastByExercise = new Map<string, number>();
  for (const l of validLogs)
    lastByExercise.set(l.exerciseId, Math.max(lastByExercise.get(l.exerciseId) ?? 0, l.completedAt));
  const trainedExercises = [...lastByExercise.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => exMap.get(id))
    .filter((e): e is Exercise => e !== undefined && !e.isTimeBased);

  // PRs récents
  const recentPRs = prs
    .filter((p) => p.kind === 'charge' || p.kind === 'e1rm')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((p) => ({
      label: PR_LABEL[p.kind],
      exercise: exMap.get(p.exerciseId)?.name ?? '—',
      exerciseId: p.exerciseId,
      value:
        p.kind === 'charge'
          ? `${fmtNumber(kgToUnit(p.value, unit))} ${unit} × ${p.reps ?? '—'}`
          : `${fmtNumber(kgToUnit(p.value, unit))} ${unit}`,
      date: p.date,
    }));

  return {
    weekSessions,
    weekSets: weekLogs.length,
    weekTonnage,
    weeklyBars,
    heatCounts,
    groupSets,
    trainedExercises,
    recentPRs,
  };
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-[14px] bg-raised p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="tnum mt-0.5 text-[20px] font-bold leading-6">{value}</p>
      {sub && <p className="text-[11px] text-ink-3">{sub}</p>}
    </div>
  );
}

export function ProgressScreen() {
  const unit = useSettings((s) => s.unit);
  const push = useNav((s) => s.push);
  const data = useLiveQuery(() => loadProgress(unit), [unit]);
  const [wrapped, setWrapped] = useState<WrappedData | null>(null);
  const prevWrapped = useLiveQuery(() => computeWrapped(prevMonthKey()), []);

  if (!data) return <Screen>{null}</Screen>;
  const maxGroup = Math.max(...data.groupSets.map((g) => g.count), 1);
  const hasData = data.trainedExercises.length > 0;

  return (
    <Screen>
      <LargeTitle sub="Volume, régularité, records">Progression</LargeTitle>

      {!hasData && (
        <Card className="py-8 text-center">
          <p className="text-[15px] font-semibold">Pas encore de données</p>
          <p className="mt-1 text-[13px] text-ink-2">
            Les stats apparaîtront après ta première séance.
          </p>
        </Card>
      )}

      {prevWrapped && (
        <Pressable
          className="mb-4 flex w-full items-center gap-3 rounded-[16px] bg-raised p-4 text-left"
          onClick={() => setWrapped(prevWrapped)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-dim text-accent">
            <IconFlame size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">Récap de {prevWrapped.monthLabel}</p>
            <p className="text-[13px] text-ink-2">Revoir le mois en story</p>
          </div>
          <IconChevronRight size={16} className="text-ink-3" />
        </Pressable>
      )}
      {wrapped && <WrappedStory data={wrapped} onClose={() => setWrapped(null)} />}

      {hasData && (
        <>
          <div className="mb-4 flex gap-2">
            <Tile label="Séances" value={`${data.weekSessions}`} sub="cette semaine" />
            <Tile label="Séries" value={`${data.weekSets}`} sub="cette semaine" />
            <Tile label="Tonnage" value={fmtTonnage(data.weekTonnage, unit)} sub="cette semaine" />
          </div>

          <Card className="mb-4">
            <p className="mb-3 text-[13px] font-semibold text-ink-2">Séries par semaine</p>
            <BarChart bars={data.weeklyBars} formatValue={(v) => `${v}`} />
          </Card>

          <Card className="mb-4">
            <p className="mb-3 text-[13px] font-semibold text-ink-2">Régularité</p>
            <Heatmap counts={data.heatCounts} />
          </Card>

          {data.groupSets.length > 0 && (
            <Card className="mb-4">
              <p className="mb-3 text-[13px] font-semibold text-ink-2">
                Séries par groupe · 4 semaines
              </p>
              <div className="flex flex-col gap-2">
                {data.groupSets.map(({ group, count }) => (
                  <div key={group} className="flex items-center gap-2.5">
                    <span className="w-24 shrink-0 text-[13px] capitalize text-ink-2">{group}</span>
                    <div className="h-[18px] flex-1 overflow-hidden rounded-[4px]">
                      <div
                        className="h-full rounded-[4px] bg-accent-dim"
                        style={{ width: `${(count / maxGroup) * 100}%` }}
                      >
                        <div className="h-full w-[3px] rounded-full bg-accent" />
                      </div>
                    </div>
                    <span className="tnum w-7 shrink-0 text-right text-[13px] font-semibold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.recentPRs.length > 0 && (
            <Card className="mb-4 !px-4 !py-1">
              {data.recentPRs.map((pr, i) => (
                <Pressable
                  key={i}
                  className="flex w-full items-center gap-3 border-b border-sep py-3 text-left last:border-b-0"
                  onClick={() => push({ type: 'exercise-detail', exerciseId: pr.exerciseId })}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent">
                    <IconTrophy size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{pr.exercise}</p>
                    <p className="text-[12px] text-ink-3">
                      {pr.label} · {fmtDateShort(pr.date)}
                    </p>
                  </div>
                  <span className="tnum shrink-0 text-[14px] font-semibold">{pr.value}</span>
                </Pressable>
              ))}
            </Card>
          )}

          <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            Par exercice
          </p>
          <Card className="!px-4 !py-1">
            {data.trainedExercises.map((e) => (
              <Pressable
                key={e.id}
                className="flex w-full items-center justify-between gap-3 border-b border-sep py-3 text-left last:border-b-0"
                onClick={() => push({ type: 'exercise-detail', exerciseId: e.id })}
              >
                <span className="min-w-0 truncate text-[15px] font-medium">{e.name}</span>
                <IconChevronRight size={16} className="shrink-0 text-ink-3" />
              </Pressable>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
