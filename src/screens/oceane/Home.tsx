import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '../../db/db';
import { useSession } from '../../state/session';
import { useNav } from '../../state/nav';
import { useGami } from '../../gamification/useGami';
import { Screen, LargeTitle, Card } from '../../components/Screen';
import { Pressable } from '../../components/ui/Pressable';
import {
  IconCheck,
  IconChevronRight,
  IconGear,
  IconMoon,
  IconShieldAlert,
} from '../../components/ui/Icons';
import { BossCard } from '../../components/gami/BossCard';
import { ChallengeCard } from '../../components/gami/ChallengeCard';
import { BloomHero } from '../../oceane/BloomHero';
import { SafetySheet } from '../../oceane/SafetySheet';
import { BloomBadges } from '../../oceane/BloomBadges';
import { blockViews, defaultOptionIndexes, inCurrentWeek, isScheduled, optionAt } from '../../lib/block';
import { weekProgress, type WeekProgress } from '../../db/blocks';
import { isDurationSet, isWarmupSets, type Exercise, type ItemVariant, type TargetSet, type WorkoutTemplate } from '../../db/types';
import { addDays, fmtDateLong, startOfWeek, todayISO, toISODate, WEEKDAY_LABELS } from '../../lib/dates';
import { springList, staggerDelay } from '../../lib/springs';
import { OCEANE_BLOCK_ID, phaseOfWeek } from '../../db/progOceane';
import { WEEK_CHECKLIST } from '../../oceane/guide';
import { guideFor } from '../../oceane/exerciseGuide';

interface HomeData {
  template?: WorkoutTemplate;
  items: ItemVariant[];
  week: number;
  totalWeeks: number;
  progress?: WeekProgress;
  exercises: Map<string, Exercise>;
  doneToday: boolean;
  launchable: WorkoutTemplate[];
  next?: { template: WorkoutTemplate; inDays: number };
}

function targetShort(set?: TargetSet): string {
  if (!set) return '—';
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

async function loadHome(): Promise<HomeData> {
  const [all, blocks] = await Promise.all([
    db.templates.orderBy('order').toArray(),
    db.blocks.toArray(),
  ]);
  // Si le programme de Noah cohabite sur l'appareil, ses séances ne doivent pas
  // apparaître ici — un vendredi, sa séance Legs passerait devant la séance B.
  const own = all.filter((t) => t.blockId === OCEANE_BLOCK_ID);
  const templates = own.length > 0 ? own : all;
  const views = blockViews(blocks);
  const now = new Date();
  const scheduled = templates.filter((t) => isScheduled(t, views));
  const template = scheduled.find((t) => t.weekdays.includes(now.getDay()));

  const doneToday =
    (await db.workouts.where('date').equals(todayISO()).toArray()).filter(
      (w) => w.finishedAt && (!template || w.templateId === template.id),
    ).length > 0;

  let next: HomeData['next'];
  for (let d = 1; d <= 7 && !next; d++) {
    const date = addDays(now, d);
    const t = scheduled.find((tt) => tt.weekdays.includes(date.getDay()));
    if (t) next = { template: t, inDays: d };
  }

  const view = template?.blockId ? views.get(template.blockId) : undefined;
  // Le bloc d'Océane fait foi, même les jours de repos où aucune séance n'est du jour
  const main = view ?? views.get(OCEANE_BLOCK_ID) ?? views.values().next().value;
  const progress = main ? await weekProgress(main.block) : undefined;
  const items = template
    ? defaultOptionIndexes(template, view).map((choice, i) => optionAt(template.items[i], choice))
    : [];
  const exercises = new Map<string, Exercise>();
  for (const e of await db.exercises.bulkGet(items.map((i) => i.exerciseId))) {
    if (e) exercises.set(e.id, e);
  }

  return {
    template,
    items,
    week: main?.week ?? 1,
    totalWeeks: main?.block.weeks.length ?? 12,
    progress,
    exercises,
    doneToday,
    launchable: templates.filter((t) => inCurrentWeek(t, views)),
    next,
  };
}

/** Les cases de la semaine réussie — cochées localement, remises à zéro chaque lundi. */
function useWeekChecklist(): [boolean[], (i: number) => void] {
  const key = `oceane-checklist-${toISODate(startOfWeek(new Date()))}`;
  const [state, setState] = useState<boolean[]>(() => WEEK_CHECKLIST.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        setState(WEEK_CHECKLIST.map((_, i) => parsed[i] ?? false));
      } else {
        setState(WEEK_CHECKLIST.map(() => false));
      }
    } catch {
      /* stockage indisponible : la liste marche quand même, sans mémoire */
    }
  }, [key]);

  const toggle = (i: number) => {
    setState((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* idem */
      }
      return next;
    });
  };

  return [state, toggle];
}

function ExerciseRow({
  name,
  detail,
  sub,
  onClick,
  index = 0,
}: {
  name: string;
  detail: string;
  sub?: string;
  onClick?: () => void;
  index?: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springList, delay: staggerDelay(index) }}
      className="border-b border-sep last:border-b-0"
    >
      <Pressable
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        tapScale={0.99}
        onClick={onClick}
        disabled={!onClick}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{name}</p>
          {sub && <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-ink-3">{sub}</p>}
        </div>
        <span className="tnum shrink-0 text-[13px] font-semibold text-ink-2">{detail}</span>
        {onClick && <IconChevronRight size={16} className="shrink-0 text-accent" />}
      </Pressable>
    </motion.li>
  );
}

export function OceaneHome() {
  const data = useLiveQuery(loadHome, []);
  const start = useSession((s) => s.start);
  const push = useNav((s) => s.push);
  const setTab = useNav((s) => s.setTab);
  const gami = useGami();
  const [safety, setSafety] = useState(false);
  const [checks, toggleCheck] = useWeekChecklist();

  if (!data) return <Screen>{null}</Screen>;
  const { template, items, week, totalWeeks, progress, exercises, doneToday, launchable, next } =
    data;
  const phase = phaseOfWeek(week);
  const warmups = items.filter((i) => isWarmupSets(i.sets));
  const working = items.filter((i) => !isWarmupSets(i.sets));

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
        Salut Océane
      </LargeTitle>

      {gami && <BloomHero gami={gami} />}

      {/* Où on en est dans les 12 semaines */}
      <Card className="mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
            Semaine {week} sur {totalWeeks}
          </p>
          <p className="text-[12px] font-semibold text-ink-3">{phase.label}</p>
        </div>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: totalWeeks }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i + 1 < week ? 'bg-accent' : i + 1 === week ? 'bg-accent-strong' : 'bg-raised-2'
              }`}
            />
          ))}
        </div>
        <p className="mt-2.5 text-[13px] leading-5 text-ink-2">{phase.headline}</p>
        {progress && progress.total > 0 && (
          <p className="tnum mt-1.5 text-[12px] text-ink-3">
            {progress.done}/{progress.total} séances faites dans cette semaine
            {progress.complete && ' — palier suivant débloqué'}
          </p>
        )}
      </Card>

      {template && !doneToday && (
        <>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            Ta séance du jour
          </p>
          <Card className="mb-3 !p-0">
            <div className="border-b border-sep px-4 py-3.5">
              <h2 className="text-[20px] font-bold tracking-[-0.01em]">{template.name}</h2>
              <p className="tnum mt-0.5 text-[13px] text-ink-2">
                {working.length} exercices · {working.reduce((n, i) => n + i.sets.length, 0)}{' '}
                séries · échauffement 12 min
              </p>
              <p className="mt-1.5 text-[12px] font-semibold text-accent">{phase.rpe}</p>
            </div>

            <div className="border-b border-sep bg-raised-2/40 px-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-lilac">
                Échauffement — toujours en premier
              </p>
            </div>
            <ul>
              {warmups.map((item, i) => (
                <ExerciseRow
                  key={`w${i}`}
                  index={i}
                  name={exercises.get(item.exerciseId)?.name ?? '—'}
                  sub={item.note}
                  detail=""
                  onClick={
                    guideFor(item.exerciseId)
                      ? () => push({ type: 'oceane-exercise', exerciseId: item.exerciseId })
                      : undefined
                  }
                />
              ))}
            </ul>

            <div className="border-y border-sep bg-raised-2/40 px-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
                Les exercices
              </p>
            </div>
            <ul>
              {working.map((item, i) => (
                <ExerciseRow
                  key={i}
                  index={i}
                  name={exercises.get(item.exerciseId)?.name ?? '—'}
                  sub={item.note}
                  detail={`${item.sets.length} × ${targetShort(item.sets[0])}`}
                  onClick={
                    guideFor(item.exerciseId)
                      ? () => push({ type: 'oceane-exercise', exerciseId: item.exerciseId })
                      : undefined
                  }
                />
              ))}
            </ul>
          </Card>
          <Pressable
            className="w-full rounded-[var(--radius-card)] bg-accent py-4 text-[17px] font-bold text-canvas"
            onClick={() => void start(template.id)}
          >
            Commencer la séance
          </Pressable>
          <p className="mb-4 mt-2 text-center text-[12px] text-ink-3">
            Tu peux tout consulter pendant la séance : chaque exercice a sa fiche et son schéma.
          </p>
        </>
      )}

      {template && doneToday && (
        <Card className="mb-4 flex items-center gap-3 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-dim text-accent">
            <IconCheck size={22} />
          </span>
          <div>
            <p className="text-[17px] font-semibold">{template.name} — faite</p>
            <p className="text-[13px] text-ink-2">
              C’est noté dans ton carnet. Rien d’autre à faire aujourd’hui.
            </p>
          </div>
        </Card>
      )}

      {!template && (
        <Card className="mb-4 flex flex-col items-center py-8 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-raised-2 text-ink-3">
            <IconMoon size={22} />
          </span>
          <p className="text-[17px] font-semibold">Jour de repos</p>
          <p className="mt-1 text-[14px] text-ink-2">
            {next
              ? `Prochaine séance : ${next.template.name} · ${
                  next.inDays === 1
                    ? 'demain'
                    : WEEKDAY_LABELS[(new Date().getDay() + next.inDays) % 7]
                }`
              : 'Aucune séance programmée'}
          </p>
        </Card>
      )}

      {/* Le seul rendez-vous quotidien */}
      <Pressable
        className="mb-4 w-full rounded-[var(--radius-card)] bg-lilac-dim p-4 text-left"
        tapScale={0.99}
        onClick={() => push({ type: 'oceane-exercise', exerciseId: 'ext-thoracique-rouleau' })}
      >
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[15px] font-bold">Ton bloc mobilité — 5 min, tous les jours</p>
          <IconChevronRight size={16} className="text-lilac" />
        </div>
        <p className="mt-1 text-[13px] leading-5 text-ink-2">
          Rouleau + open book, même les jours sans salle. C’est le seul élément à faire
          quotidiennement : la raideur se travaille par la fréquence, pas par l’intensité.
        </p>
      </Pressable>

      <Pressable
        className="mb-4 flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-negative/30 bg-raised p-4 text-left"
        tapScale={0.99}
        onClick={() => setSafety(true)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised-2 text-negative">
          <IconShieldAlert size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">Quand tu arrêtes la série</p>
          <p className="text-[12px] leading-4 text-ink-2">
            Les 5 signaux d’arrêt et la liste de ce qu’on évite. À relire une fois avant de
            commencer.
          </p>
        </div>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
      </Pressable>

      <BossCard />
      {gami?.challenge && <ChallengeCard challenge={gami.challenge} />}

      {/* La semaine réussie : ce qu'on coche à la place de la balance */}
      <Card className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
          Ta semaine réussie
        </p>
        <p className="mb-2.5 mt-0.5 text-[13px] text-ink-2">
          Coche ces cases, pas la balance. Remise à zéro chaque lundi.
        </p>
        {WEEK_CHECKLIST.map((label, i) => (
          <Pressable
            key={label}
            className="flex w-full items-center gap-3 border-b border-sep py-2.5 text-left last:border-b-0"
            tapScale={0.99}
            onClick={() => toggleCheck(i)}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                checks[i]
                  ? 'border-transparent bg-accent text-canvas'
                  : 'border-sep bg-raised-2 text-ink-3'
              }`}
            >
              {checks[i] && <IconCheck size={14} />}
            </span>
            <span
              className={`text-[14px] leading-5 ${checks[i] ? 'text-ink-3 line-through' : 'text-ink'}`}
            >
              {label}
            </span>
          </Pressable>
        ))}
      </Card>

      {gami && <BloomBadges unlocked={gami.unlocked} />}

      <Pressable
        className="mb-2 w-full py-2.5 text-center text-[14px] font-semibold text-accent"
        onClick={() => setTab('guide')}
      >
        Ouvrir mon guide
      </Pressable>

      {launchable.length > 0 && !template && (
        <Pressable
          className="mb-4 w-full rounded-[var(--radius-card)] bg-raised py-3.5 text-[15px] font-semibold text-ink-2"
          onClick={() => void start(launchable[0].id)}
        >
          Faire quand même {launchable[0].name}
        </Pressable>
      )}

      <SafetySheet open={safety} onClose={() => setSafety(false)} />
    </Screen>
  );
}
