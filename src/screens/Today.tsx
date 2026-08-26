import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '../db/db';
import { fetchLastPerf, useSession, type LastPerf } from '../state/session';
import { useSettings } from '../state/settings';
import { Screen, LargeTitle, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { IconCheck, IconGear, IconMoon } from '../components/ui/Icons';
import { Sheet } from '../components/ui/Sheet';
import { useNav } from '../state/nav';
import { useGami } from '../gamification/useGami';
import { HeroForge } from '../components/gami/HeroForge';
import { ChallengeCard } from '../components/gami/ChallengeCard';
import { EquivalentCard } from '../components/gami/EquivalentCard';
import { BadgesStrip } from '../components/gami/BadgesStrip';
import { BossCard } from '../components/gami/BossCard';
import { fmtNumber, kgToUnit } from '../lib/format';
import { addDays, fmtDateLong, todayISO, WEEKDAY_LABELS } from '../lib/dates';
import { springList, staggerDelay } from '../lib/springs';
import {
  blockViews,
  defaultOptionIndexes,
  inCurrentWeek,
  isScheduled,
  optionAt,
  type BlockView,
} from '../lib/block';
import { isDurationSet, isWarmupSets } from '../db/types';
import { weekProgress, type WeekProgress } from '../db/blocks';
import type { Exercise, ItemVariant, TargetSet, WorkoutTemplate } from '../db/types';

interface TodayData {
  template?: WorkoutTemplate;
  /** Options « OU » résolues pour la semaine en cours */
  items: ItemVariant[];
  view?: BlockView;
  /** Rappel du bloc en cours, affiché aussi les jours de repos */
  blockLine?: string;
  progress?: WeekProgress;
  launchable: WorkoutTemplate[];
  exercises: Map<string, Exercise>;
  lastPerfs: Map<string, LastPerf | undefined>;
  doneToday: boolean;
  next?: { template: WorkoutTemplate; inDays: number };
}

/** Objectif d'une série, en une poignée de caractères. */
function targetShort(set?: TargetSet): string {
  if (!set) return '—';
  if (set.cluster) return `${set.cluster.count}×${set.cluster.reps}`;
  if (isDurationSet(set)) {
    const sec = set.durationSec ?? 20;
    return set.durationSecMax && set.durationSecMax !== sec
      ? `${sec}–${set.durationSecMax} s`
      : `${sec} s`;
  }
  if (set.repsMin == null) return '—';
  return set.repsMax && set.repsMax !== set.repsMin
    ? `${set.repsMin}–${set.repsMax}`
    : `${set.repsMin}`;
}

async function loadToday(): Promise<TodayData> {
  const [templates, blocks] = await Promise.all([
    db.templates.orderBy('order').toArray(),
    db.blocks.toArray(),
  ]);
  const now = new Date();
  const views = blockViews(blocks);
  const weekday = now.getDay();
  const template = templates
    .filter((t) => isScheduled(t, views))
    .find((t) => t.weekdays.includes(weekday));
  const doneToday =
    (await db.workouts.where('date').equals(todayISO()).toArray()).filter(
      (w) => w.finishedAt && (!template || w.templateId === template.id),
    ).length > 0;

  const scheduled = templates.filter((t) => isScheduled(t, views));
  let next: TodayData['next'];
  for (let d = 1; d <= 7 && !next; d++) {
    const date = addDays(now, d);
    const t = scheduled.find((tt) => tt.weekdays.includes(date.getDay()));
    if (t) next = { template: t, inDays: d };
  }

  const view = template?.blockId ? views.get(template.blockId) : undefined;
  const main = views.values().next().value as BlockView | undefined;
  const progress = main ? await weekProgress(main.block) : undefined;
  const blockLine = main
    ? `${main.block.name} · semaine ${main.week}/${main.block.weeks.length}${
        main.config ? ` · ${main.config.rir}` : ''
      }`
    : undefined;
  const items = template
    ? defaultOptionIndexes(template, view).map((choice, i) => optionAt(template.items[i], choice))
    : [];
  const exercises = new Map<string, Exercise>();
  const lastPerfs = new Map<string, LastPerf | undefined>();
  const list = await db.exercises.bulkGet(items.map((i) => i.exerciseId));
  for (const e of list) if (e) exercises.set(e.id, e);
  for (const item of items)
    if (!isWarmupSets(item.sets))
      lastPerfs.set(item.exerciseId, await fetchLastPerf(item.exerciseId));

  return {
    template,
    items,
    view,
    blockLine,
    progress,
    launchable: templates.filter((t) => inCurrentWeek(t, views)),
    exercises,
    lastPerfs,
    doneToday,
    next,
  };
}

export function TodayScreen() {
  const data = useLiveQuery(loadToday, []);
  const start = useSession((s) => s.start);
  const unit = useSettings((s) => s.unit);
  const push = useNav((s) => s.push);
  const [otherOpen, setOtherOpen] = useState(false);
  const gami = useGami();

  if (!data) return <Screen>{null}</Screen>;
  const { template, items, view, blockLine, progress, launchable, exercises, lastPerfs, doneToday, next } =
    data;
  const warmups = items.filter((i) => isWarmupSets(i.sets));
  const working = items.filter((i) => !isWarmupSets(i.sets));
  const isThursday = new Date().getDay() === 4;

  return (
    <Screen>
      <LargeTitle
        sub={fmtDateLong(todayISO())}
        right={
          <Pressable
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-raised text-ink-2"
            onClick={() => push({ type: 'settings' })}
            aria-label="Réglages"
          >
            <IconGear size={20} />
          </Pressable>
        }
      >
        Aujourd’hui
      </LargeTitle>

      {gami && <HeroForge gami={gami} />}

      <BossCard />

      {!template && (
        <Card className="flex flex-col items-center py-10 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-raised-2 text-ink-3">
            <IconMoon size={22} />
          </span>
          <p className="text-[17px] font-semibold">
            {isThursday ? 'Repos ou demi-fond' : 'Jour de repos'}
          </p>
          <p className="mt-1 text-[14px] text-ink-2">
            {next
              ? `Prochaine séance : ${next.template.name} · ${
                  next.inDays === 1 ? 'demain' : WEEKDAY_LABELS[(new Date().getDay() + next.inDays) % 7]
                }`
              : 'Aucune séance programmée'}
          </p>
          {blockLine && (
            <p className="tnum mt-2 text-[13px] text-accent">
              {blockLine}
              {progress && progress.total > 0 && ` · ${progress.done}/${progress.total} séances`}
            </p>
          )}
        </Card>
      )}

      {template && doneToday && (
        <Card className="flex items-center gap-3 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-dim text-accent">
            <IconCheck size={22} />
          </span>
          <div>
            <p className="text-[17px] font-semibold">{template.name} — faite</p>
            <p className="text-[13px] text-ink-2">Bien joué. Le détail est dans l’historique.</p>
          </div>
        </Card>
      )}

      {template && !doneToday && (
        <>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            Séance du jour
          </p>
          <Card className="mb-4 !p-0">
            <div className="border-b border-sep px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[20px] font-bold tracking-[-0.01em]">{template.name}</h2>
                {view && (
                  <span className="tnum shrink-0 text-[12px] font-semibold text-accent">
                    Semaine {view.week}/{view.block.weeks.length}
                  </span>
                )}
              </div>
              {template.note && (
                <p className="tnum mt-0.5 text-[13px] font-medium text-accent">{template.note}</p>
              )}
              {progress && progress.total > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: progress.total }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < progress.done ? 'bg-accent' : 'bg-raised-2'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="tnum text-[12px] text-ink-3">
                    {progress.done}/{progress.total} du palier
                  </span>
                </div>
              )}
              <p className="tnum mt-0.5 text-[13px] text-ink-2">
                {working.length} exercices · {working.reduce((n, i) => n + i.sets.length, 0)} séries
                {warmups.length > 0 && ` · échauffement ${warmups.length} mouvements`}
              </p>
            </div>
            <ul>
              {working.map((item, i) => {
                const ex = exercises.get(item.exerciseId);
                const last = lastPerfs.get(item.exerciseId);
                const lastLine = last?.sets
                  .slice(0, 4)
                  .map((s) =>
                    s.reps != null
                      ? `${fmtNumber(kgToUnit(s.weightKg, unit))}×${s.reps}`
                      : `${s.durationSec ?? 0}s`,
                  )
                  .join(' · ');
                return (
                  <motion.li
                    key={i}
                    className="flex items-baseline justify-between gap-3 border-b border-sep px-4 py-2.5 last:border-b-0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springList, delay: staggerDelay(i) }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{ex?.name ?? '—'}</p>
                      {lastLine && (
                        <p className="tnum truncate text-[12px] text-ink-3">{lastLine}</p>
                      )}
                    </div>
                    <span className="tnum shrink-0 text-[13px] text-ink-2">
                      {item.sets.length} × {targetShort(item.sets[0])}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </Card>
          <Pressable
            className="w-full rounded-[16px] bg-accent py-4 text-[17px] font-bold text-canvas"
            onClick={() => void start(template.id)}
          >
            Démarrer la séance
          </Pressable>
        </>
      )}

      <Pressable
        className="mb-4 mt-3 w-full py-2.5 text-center text-[14px] font-semibold text-ink-2"
        onClick={() => setOtherOpen(true)}
      >
        Lancer une autre séance…
      </Pressable>

      {gami?.challenge && <ChallengeCard challenge={gami.challenge} />}
      {gami && (
        <EquivalentCard
          weekTonnage={gami.weekTonnage}
          lifetimeTonnage={gami.lifetimeTonnage}
        />
      )}
      {gami && <BadgesStrip unlocked={gami.unlocked} />}

      <Sheet open={otherOpen} onClose={() => setOtherOpen(false)} ariaLabel="Choisir une séance">
        <div className="pb-3 pt-1">
          <h2 className="mb-3 text-[20px] font-bold">Lancer une séance</h2>
          {launchable.map((t) => (
            <Pressable
              key={t.id}
              className="flex w-full items-baseline justify-between gap-3 border-b border-sep py-3.5 text-left last:border-b-0"
              onClick={() => {
                setOtherOpen(false);
                void start(t.id);
              }}
            >
              <span className="min-w-0 truncate text-[16px] font-medium">
                {t.name}
                {t.optionalDay && (
                  <span className="ml-1.5 text-[12px] font-normal text-ink-3">optionnel</span>
                )}
              </span>
              <span className="tnum shrink-0 text-[13px] text-ink-3">
                {t.items.filter((i) => !isWarmupSets(i.sets)).length} exercices
              </span>
            </Pressable>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
