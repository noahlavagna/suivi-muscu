import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { computeWrapped, prevMonthKey, type WrappedData } from '../gamification/wrapped';
import { WrappedStory } from '../components/gami/WrappedStory';
import { PR_LABEL } from '../db/prs';
import type { Exercise, PersonalRecord, SetLog, Workout } from '../db/types';
import { useNav } from '../state/nav';
import { useSettings } from '../state/settings';
import { Screen, LargeTitle, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { Segmented } from '../components/ui/Segmented';
import { BarChart } from '../components/charts/BarChart';
import { Heatmap } from '../components/charts/Heatmap';
import { IconChevronRight, IconFlame, IconTrophy } from '../components/ui/Icons';
import { fmtNumber, fmtTimer, fmtTonnage, kgToUnit } from '../lib/format';
import { addDays, fmtDateShort, startOfWeek, toISODate, WEEKDAY_LABELS } from '../lib/dates';
import {
  balances,
  consistency,
  delta,
  exerciseTrends,
  PERIOD_DAYS,
  PERIOD_LABEL,
  summarize,
  volumePerWeek,
  WEEKLY_SETS_HIGH,
  WEEKLY_SETS_LOW,
  type Period,
} from '../lib/analytics';

const PERIODS: Period[] = ['4s', '3m', '6m', '1a', 'tout'];

/* ————————————————— Chargement ————————————————— */

interface Raw {
  logs: SetLog[];
  workouts: Map<string, Workout>;
  exMap: Map<string, Exercise>;
  prs: PersonalRecord[];
  firstTs: number;
}

async function loadRaw(): Promise<Raw> {
  const [workouts, logs, exercises, prs] = await Promise.all([
    db.workouts.toArray(),
    db.setLogs.toArray(),
    db.exercises.toArray(),
    db.prs.toArray(),
  ]);
  const finished = new Map(workouts.filter((w) => w.finishedAt).map((w) => [w.id, w]));
  const valid = logs.filter((l) => finished.has(l.workoutId));
  return {
    logs: valid,
    workouts: finished,
    exMap: new Map(exercises.map((e) => [e.id, e])),
    prs,
    firstTs: valid.reduce((min, l) => Math.min(min, l.completedAt), Date.now()),
  };
}

/* ————————————————— Blocs d'affichage ————————————————— */

function Tile({
  label,
  value,
  sub,
  change,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number | null;
}) {
  return (
    <div className="flex-1 rounded-[14px] bg-raised p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="tnum mt-0.5 text-[20px] font-bold leading-6">{value}</p>
      {change != null ? (
        <p
          className={`tnum text-[11px] font-semibold ${
            change >= 0 ? 'text-positive' : 'text-negative'
          }`}
        >
          {change >= 0 ? '+' : ''}
          {Math.round(change * 100)} %
        </p>
      ) : (
        sub && <p className="text-[11px] text-ink-3">{sub}</p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">{children}</p>
  );
}

/* ————————————————— Écran ————————————————— */

export function ProgressScreen() {
  const unit = useSettings((s) => s.unit);
  const push = useNav((s) => s.push);
  const [period, setPeriod] = useState<Period>('3m');
  const [wrapped, setWrapped] = useState<WrappedData | null>(null);
  const [allPRs, setAllPRs] = useState(false);

  const raw = useLiveQuery(() => loadRaw(), []);
  const prevWrapped = useLiveQuery(() => computeWrapped(prevMonthKey()), []);

  const view = useMemo(() => {
    if (!raw) return null;
    const now = Date.now();
    const days = PERIOD_DAYS[period];
    const spanMs = days === Number.POSITIVE_INFINITY ? now - raw.firstTs : days * 86_400_000;
    const since = now - spanMs;
    const current = raw.logs.filter((l) => l.completedAt >= since);
    const previous = raw.logs.filter((l) => l.completedAt >= since - spanMs && l.completedAt < since);
    const weeks = Math.max(1, spanMs / (7 * 86_400_000));

    return {
      weeks,
      cur: summarize(current, raw.workouts),
      prev: summarize(previous, raw.workouts),
      volume: volumePerWeek(current, raw.exMap, weeks),
      balance: balances(current, raw.exMap),
      trends: exerciseTrends(current, raw.exMap),
      steadiness: consistency(current, raw.workouts, weeks),
      typeSplit: (() => {
        const counts = new Map<string, number>();
        for (const l of current) counts.set(l.type, (counts.get(l.type) ?? 0) + 1);
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
      })(),
    };
  }, [raw, period]);

  const weeklyBars = useMemo(() => {
    if (!raw) return [];
    const monday = startOfWeek(new Date());
    return Array.from({ length: 10 }, (_, i) => {
      const start = addDays(monday, -7 * (9 - i));
      const end = addDays(start, 7);
      const inWeek = raw.logs.filter(
        (l) => l.completedAt >= start.getTime() && l.completedAt < end.getTime(),
      );
      return {
        label: start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
        value: inWeek.length,
        tonnage: inWeek.reduce((s, l) => s + (l.reps ? l.weightKg * l.reps : 0), 0),
      };
    });
  }, [raw]);

  const heatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of raw?.logs ?? []) {
      const iso = toISODate(new Date(l.completedAt));
      counts.set(iso, (counts.get(iso) ?? 0) + 1);
    }
    return counts;
  }, [raw]);

  const [barMetric, setBarMetric] = useState<'séries' | 'tonnage'>('séries');

  if (!raw || !view) return <Screen>{null}</Screen>;

  const hasData = raw.logs.length > 0;
  const { cur, prev } = view;
  const maxVolume = Math.max(...view.volume.map((v) => v.setsPerWeek), WEEKLY_SETS_HIGH);
  const stalling = view.trends.filter((t) => t.changePct <= 0.005).slice(0, 5);
  const prsByExercise = raw.prs
    .filter((p) => p.kind === 'e1rm')
    .sort((a, b) => b.date.localeCompare(a.date));

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
          <div className="scroll-x mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {PERIODS.map((p) => (
              <Pressable
                key={p}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  period === p ? 'bg-accent text-canvas' : 'bg-raised text-ink-2'
                }`}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABEL[p]}
              </Pressable>
            ))}
          </div>

          {/* Les deltas comparent à la période équivalente qui précède */}
          <div className="mb-2 flex gap-2">
            <Tile
              label="Séances"
              value={`${cur.sessions}`}
              change={delta(cur.sessions, prev.sessions)}
              sub="sur la période"
            />
            <Tile
              label="Séries"
              value={`${cur.sets}`}
              change={delta(cur.sets, prev.sets)}
              sub="sur la période"
            />
            <Tile
              label="Tonnage"
              value={fmtTonnage(cur.tonnage, unit)}
              change={delta(cur.tonnage, prev.tonnage)}
              sub="sur la période"
            />
          </div>
          <p className="mb-4 text-[11px] text-ink-3">
            Variation par rapport aux {PERIOD_LABEL[period].toLowerCase()} précédents.
          </p>

          <Card className="mb-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-ink-2">Par semaine</p>
              <div className="w-[168px]">
                <Segmented
                  options={[
                    { value: 'séries', label: 'Séries' },
                    { value: 'tonnage', label: 'Tonnage' },
                  ]}
                  value={barMetric}
                  onChange={setBarMetric}
                  ariaLabel="Métrique hebdomadaire"
                />
              </div>
            </div>
            <BarChart
              bars={weeklyBars.map((b) => ({
                label: b.label,
                value: barMetric === 'séries' ? b.value : b.tonnage,
              }))}
              formatValue={(v) =>
                barMetric === 'séries' ? `${Math.round(v)}` : fmtTonnage(v, unit)
              }
            />
          </Card>

          <Card className="mb-4">
            <p className="mb-3 text-[13px] font-semibold text-ink-2">Régularité</p>
            <Heatmap counts={heatCounts} />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-sep pt-3">
              <span className="text-[12px] text-ink-2">
                Série :{' '}
                <span className="tnum font-semibold text-ink">
                  {view.steadiness.weeksStreak} sem.
                </span>
              </span>
              <span className="text-[12px] text-ink-2">
                Moyenne :{' '}
                <span className="tnum font-semibold text-ink">
                  {fmtNumber(view.steadiness.sessionsPerWeek, 1)} séances/sem.
                </span>
              </span>
              {view.steadiness.avgDurationSec > 0 && (
                <span className="text-[12px] text-ink-2">
                  Durée :{' '}
                  <span className="tnum font-semibold text-ink">
                    {fmtTimer(view.steadiness.avgDurationSec)}
                  </span>
                </span>
              )}
              {view.steadiness.favouriteWeekday != null && (
                <span className="text-[12px] text-ink-2">
                  Jour fort :{' '}
                  <span className="font-semibold text-ink">
                    {WEEKDAY_LABELS[view.steadiness.favouriteWeekday]}
                  </span>
                </span>
              )}
            </div>
          </Card>

          {view.volume.length > 0 && (
            <Card className="mb-4">
              <p className="mb-1 text-[13px] font-semibold text-ink-2">
                Séries par semaine et par groupe
              </p>
              <p className="mb-3 text-[11px] text-ink-3">
                Repère usuel en hypertrophie : {WEEKLY_SETS_LOW} à {WEEKLY_SETS_HIGH} séries
                hebdomadaires. Ordre de grandeur, pas une règle.
              </p>
              <div className="flex flex-col gap-2">
                {view.volume.map(({ group, setsPerWeek, verdict }) => (
                  <div key={group} className="flex items-center gap-2.5">
                    <span className="w-[92px] shrink-0 text-[13px] capitalize text-ink-2">
                      {group}
                    </span>
                    <div className="relative h-[18px] flex-1 overflow-hidden rounded-[4px] bg-raised-2">
                      {/* Bornes de la zone conseillée */}
                      <div
                        className="absolute inset-y-0 bg-accent-dim/40"
                        style={{
                          left: `${(WEEKLY_SETS_LOW / maxVolume) * 100}%`,
                          width: `${((WEEKLY_SETS_HIGH - WEEKLY_SETS_LOW) / maxVolume) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-[4px] bg-accent-dim"
                        style={{ width: `${Math.min(100, (setsPerWeek / maxVolume) * 100)}%` }}
                      >
                        <div className="h-full w-[3px] rounded-full bg-accent" />
                      </div>
                    </div>
                    <span
                      className={`tnum w-9 shrink-0 text-right text-[13px] font-semibold ${
                        verdict === 'bon' ? 'text-ink' : 'text-ink-3'
                      }`}
                    >
                      {fmtNumber(setsPerWeek, 1)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="mb-4">
            <p className="mb-3 text-[13px] font-semibold text-ink-2">Équilibre</p>
            <div className="flex flex-col gap-3">
              {view.balance.map((b) => {
                const total = b.left + b.right;
                const pct = total > 0 ? (b.left / total) * 100 : 50;
                return (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="text-ink-2">
                        {b.leftLabel} <span className="tnum font-semibold text-ink">{b.left}</span>
                      </span>
                      <span className="text-ink-2">
                        <span className="tnum font-semibold text-ink">{b.right}</span>{' '}
                        {b.rightLabel}
                      </span>
                    </div>
                    <div className="flex h-[10px] overflow-hidden rounded-full bg-raised-2">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      <div className="h-full flex-1 bg-accent-dim" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {view.trends.length > 0 && (
            <>
              <SectionTitle>Progression du 1RM estimé</SectionTitle>
              <Card className="mb-4 !px-4 !py-1">
                {view.trends.slice(0, 8).map((t) => (
                  <Pressable
                    key={t.exercise.id}
                    className="flex w-full items-center gap-3 border-b border-sep py-3 text-left last:border-b-0"
                    onClick={() => push({ type: 'exercise-detail', exerciseId: t.exercise.id })}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{t.exercise.name}</p>
                      <p className="tnum text-[12px] text-ink-3">
                        {fmtNumber(kgToUnit(t.first, unit))} → {fmtNumber(kgToUnit(t.last, unit))}{' '}
                        {unit} · {t.sessions} séances
                      </p>
                    </div>
                    <span
                      className={`tnum shrink-0 text-[14px] font-bold ${
                        t.changePct > 0.005
                          ? 'text-positive'
                          : t.changePct < -0.005
                            ? 'text-negative'
                            : 'text-ink-3'
                      }`}
                    >
                      {t.changePct >= 0 ? '+' : ''}
                      {Math.round(t.changePct * 100)} %
                    </span>
                  </Pressable>
                ))}
              </Card>
            </>
          )}

          {stalling.length > 0 && (
            <>
              <SectionTitle>Ça stagne</SectionTitle>
              <Card className="mb-4 !px-4 !py-1">
                {stalling.map((t) => (
                  <Pressable
                    key={t.exercise.id}
                    className="flex w-full items-center justify-between gap-3 border-b border-sep py-3 text-left last:border-b-0"
                    onClick={() => push({ type: 'exercise-detail', exerciseId: t.exercise.id })}
                  >
                    <span className="min-w-0 truncate text-[14px] font-medium">
                      {t.exercise.name}
                    </span>
                    <span className="tnum shrink-0 text-[12px] text-ink-3">
                      {t.daysSince === 0 ? 'aujourd’hui' : `il y a ${t.daysSince} j`}
                    </span>
                  </Pressable>
                ))}
              </Card>
            </>
          )}

          {view.typeSplit.length > 1 && (
            <Card className="mb-4">
              <p className="mb-3 text-[13px] font-semibold text-ink-2">Séries par type</p>
              <div className="flex flex-col gap-1.5">
                {view.typeSplit.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2.5">
                    <span className="w-[92px] shrink-0 text-[12px] capitalize text-ink-2">
                      {type}
                    </span>
                    <div className="h-[12px] flex-1 overflow-hidden rounded-[4px] bg-raised-2">
                      <div
                        className="h-full rounded-[4px] bg-accent-dim"
                        style={{ width: `${(count / view.cur.sets) * 100}%` }}
                      />
                    </div>
                    <span className="tnum w-8 shrink-0 text-right text-[12px] font-semibold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {prsByExercise.length > 0 && (
            <>
              <SectionTitle>Records</SectionTitle>
              <Card className="mb-4 !px-4 !py-1">
                {(allPRs ? prsByExercise : prsByExercise.slice(0, 5)).map((pr) => (
                  <Pressable
                    key={pr.id}
                    className="flex w-full items-center gap-3 border-b border-sep py-3 text-left last:border-b-0"
                    onClick={() => push({ type: 'exercise-detail', exerciseId: pr.exerciseId })}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent">
                      <IconTrophy size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">
                        {raw.exMap.get(pr.exerciseId)?.name ?? '—'}
                      </p>
                      <p className="text-[12px] text-ink-3">
                        {PR_LABEL[pr.kind]} · {fmtDateShort(pr.date)}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-[14px] font-semibold">
                      {fmtNumber(kgToUnit(pr.value, unit))} {unit}
                    </span>
                  </Pressable>
                ))}
                {prsByExercise.length > 5 && (
                  <Pressable
                    className="w-full py-3 text-[13px] font-semibold text-accent"
                    onClick={() => setAllPRs((v) => !v)}
                  >
                    {allPRs ? 'Réduire' : `Voir les ${prsByExercise.length} records`}
                  </Pressable>
                )}
              </Card>
            </>
          )}

          <SectionTitle>Par exercice</SectionTitle>
          <Card className="!px-4 !py-1">
            {[...raw.exMap.values()]
              .filter((e) => raw.logs.some((l) => l.exerciseId === e.id))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e) => (
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
