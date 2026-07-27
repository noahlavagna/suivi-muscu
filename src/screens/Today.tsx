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
import { fmtDateLong, todayISO, WEEKDAY_LABELS } from '../lib/dates';
import { springList, staggerDelay } from '../lib/springs';
import type { Exercise, WorkoutTemplate } from '../db/types';

interface TodayData {
  template?: WorkoutTemplate;
  allTemplates: WorkoutTemplate[];
  exercises: Map<string, Exercise>;
  lastPerfs: Map<string, LastPerf | undefined>;
  doneToday: boolean;
  next?: { template: WorkoutTemplate; inDays: number };
}

async function loadToday(): Promise<TodayData> {
  const templates = await db.templates.orderBy('order').toArray();
  const weekday = new Date().getDay();
  const template = templates.find((t) => t.weekdays.includes(weekday));
  const doneToday =
    (await db.workouts.where('date').equals(todayISO()).toArray()).filter(
      (w) => w.finishedAt && (!template || w.templateId === template.id),
    ).length > 0;
  let next: TodayData['next'];
  for (let d = 1; d <= 7 && !next; d++) {
    const wd = (weekday + d) % 7;
    const t = templates.find((tt) => tt.weekdays.includes(wd));
    if (t) next = { template: t, inDays: d };
  }
  const exercises = new Map<string, Exercise>();
  const lastPerfs = new Map<string, LastPerf | undefined>();
  if (template) {
    const list = await db.exercises.bulkGet(template.items.map((i) => i.exerciseId));
    for (const e of list) if (e) exercises.set(e.id, e);
    for (const item of template.items)
      lastPerfs.set(item.exerciseId, await fetchLastPerf(item.exerciseId));
  }
  return { template, allTemplates: templates, exercises, lastPerfs, doneToday, next };
}

export function TodayScreen() {
  const data = useLiveQuery(loadToday, []);
  const start = useSession((s) => s.start);
  const unit = useSettings((s) => s.unit);
  const push = useNav((s) => s.push);
  const [otherOpen, setOtherOpen] = useState(false);
  const gami = useGami();

  if (!data) return <Screen>{null}</Screen>;
  const { template, allTemplates, exercises, lastPerfs, doneToday, next } = data;
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
              <h2 className="text-[20px] font-bold tracking-[-0.01em]">{template.name}</h2>
              <p className="tnum mt-0.5 text-[13px] text-ink-2">
                {template.items.length} exercices ·{' '}
                {template.items.reduce((n, i) => n + i.sets.length, 0)} séries
              </p>
            </div>
            <ul>
              {template.items.map((item, i) => {
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
                      {item.sets.length} × {item.sets[0]?.repsMin ?? '—'}
                      {item.sets[0]?.repsMax && item.sets[0].repsMax !== item.sets[0].repsMin
                        ? `–${item.sets[0].repsMax}`
                        : ''}
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
          {allTemplates.map((t) => (
            <Pressable
              key={t.id}
              className="flex w-full items-baseline justify-between gap-3 border-b border-sep py-3.5 text-left last:border-b-0"
              onClick={() => {
                setOtherOpen(false);
                void start(t.id);
              }}
            >
              <span className="min-w-0 truncate text-[16px] font-medium">{t.name}</span>
              <span className="tnum shrink-0 text-[13px] text-ink-3">
                {t.items.length} exercices
              </span>
            </Pressable>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
