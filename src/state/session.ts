import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { db } from '../db/db';
import { registerSetForPRs, rebuildAllPRs } from '../db/prs';
import { PR_LABEL } from '../db/prs';
import type { ActiveSessionMeta, PRKind, SetLog, TargetSet } from '../db/types';
import { todayISO } from '../lib/dates';
import { haptics } from '../lib/haptics';
import { sounds } from '../lib/sound';
import { useToasts } from './toasts';
import { evaluateBadges } from '../gamification/badges';
import { checkChallenge, CHALLENGE_XP } from '../gamification/challenges';
import { computeRarity, type Rarity } from '../gamification/rarity';
import { XP_PER_BADGE, XP_PER_PR, XP_PER_SET, XP_PER_WORKOUT } from '../gamification/xp';

export interface SessionSet {
  target: TargetSet;
  weightKg: number;
  reps: number;
  durationSec: number;
  done: boolean;
  logId?: string;
  prs: PRKind[];
}

export interface LastPerf {
  date: string;
  sets: { weightKg: number; reps?: number; durationSec?: number }[];
}

export interface SessionEntry {
  exerciseId: string;
  restSec: number;
  templateNote?: string;
  note: string;
  sets: SessionSet[];
  last?: LastPerf;
}

export interface RestState {
  endsAt: number;
  totalSec: number;
}

export interface SessionSummary {
  name: string;
  durationSec: number;
  setsDone: number;
  tonnageKg: number;
  prCount: number;
  prevTonnageKg?: number;
  rarity: Rarity;
  xpGained: number;
  newBadges: string[]; // noms
  challengeDone: boolean;
}

interface SessionStore {
  active: boolean;
  workoutId: string;
  templateId?: string;
  name: string;
  startedAt: number;
  entries: SessionEntry[];
  index: number;
  rest: RestState | null;
  prCount: number;
  summary: SessionSummary | null;

  start: (templateId: string) => Promise<void>;
  restore: () => Promise<void>;
  setIndex: (i: number) => void;
  patchSet: (ei: number, si: number, patch: Partial<SessionSet>) => void;
  completeSet: (ei: number, si: number) => Promise<void>;
  uncompleteSet: (ei: number, si: number) => Promise<void>;
  addSet: (ei: number) => void;
  setEntryNote: (ei: number, note: string) => void;
  adjustRest: (deltaSec: number) => void;
  skipRest: () => void;
  clearRest: () => void;
  finish: () => Promise<void>;
  abandon: () => Promise<void>;
  clearSummary: () => void;
}

/** Dernière perf sur un exercice : les séries de la dernière séance qui le contient. */
export async function fetchLastPerf(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<LastPerf | undefined> {
  const logs = await db.setLogs
    .where('[exerciseId+completedAt]')
    .between([exerciseId, 0], [exerciseId, Infinity])
    .reverse()
    .toArray();
  const lastLog = logs.find((l) => l.workoutId !== excludeWorkoutId);
  if (!lastLog) return undefined;
  const workout = await db.workouts.get(lastLog.workoutId);
  const sets = logs
    .filter((l) => l.workoutId === lastLog.workoutId)
    .sort((a, b) => a.setIndex - b.setIndex || a.completedAt - b.completedAt)
    .map((l) => ({ weightKg: l.weightKg, reps: l.reps, durationSec: l.durationSec }));
  return { date: workout?.date ?? '', sets };
}

function prefillSet(target: TargetSet, last: LastPerf | undefined, i: number): SessionSet {
  const fromLast = last?.sets[i] ?? last?.sets[last.sets.length - 1];
  return {
    target,
    weightKg: fromLast?.weightKg ?? 0,
    reps: fromLast?.reps ?? target.repsMin ?? (target.cluster ? target.cluster.reps * target.cluster.count : 0),
    durationSec: fromLast?.durationSec ?? target.durationSec ?? 0,
    done: false,
    prs: [],
  };
}

async function buildEntries(
  templateId: string,
  workoutId: string,
): Promise<SessionEntry[] | null> {
  const template = await db.templates.get(templateId);
  if (!template) return null;
  const exercises = new Map(
    (await db.exercises.bulkGet(template.items.map((i) => i.exerciseId))).map((e) => [e?.id, e]),
  );
  return Promise.all(
    template.items.map(async (item) => {
      const ex = exercises.get(item.exerciseId);
      const last = await fetchLastPerf(item.exerciseId, workoutId);
      return {
        exerciseId: item.exerciseId,
        restSec: item.restSecOverride ?? ex?.defaultRestSec ?? 90,
        templateNote: item.note ?? ex?.note,
        note: '',
        sets: item.sets.map((t, i) => prefillSet(t, last, i)),
        last,
      };
    }),
  );
}

async function tonnageOfWorkout(workoutId: string): Promise<number> {
  const logs = await db.setLogs.where('workoutId').equals(workoutId).toArray();
  return logs.reduce((sum, l) => sum + (l.reps ? l.weightKg * l.reps : 0), 0);
}

function persistActiveMeta(s: Pick<SessionStore, 'workoutId' | 'templateId' | 'index' | 'rest'>) {
  const meta: ActiveSessionMeta = {
    id: 'activeSession',
    workoutId: s.workoutId,
    templateId: s.templateId,
    currentExerciseIndex: s.index,
    restEndsAt: s.rest?.endsAt,
    restTotalSec: s.rest?.totalSec,
  };
  void db.meta.put(meta);
}

export const useSession = create<SessionStore>((set, get) => ({
  active: false,
  workoutId: '',
  templateId: undefined,
  name: '',
  startedAt: 0,
  entries: [],
  index: 0,
  rest: null,
  prCount: 0,
  summary: null,

  async start(templateId) {
    const template = await db.templates.get(templateId);
    if (!template) return;
    const workoutId = nanoid();
    const entries = await buildEntries(templateId, workoutId);
    if (!entries) return;
    await db.workouts.put({
      id: workoutId,
      templateId,
      name: template.name,
      date: todayISO(),
      startedAt: Date.now(),
    });
    set({
      active: true,
      workoutId,
      templateId,
      name: template.name,
      startedAt: Date.now(),
      entries,
      index: 0,
      rest: null,
      prCount: 0,

      summary: null,
    });
    persistActiveMeta(get());
  },

  async restore() {
    const meta = await db.meta.get('activeSession');
    if (!meta || meta.id !== 'activeSession') return;
    const workout = await db.workouts.get(meta.workoutId);
    if (!workout || workout.finishedAt || !meta.templateId) {
      await db.meta.delete('activeSession');
      return;
    }
    const entries = await buildEntries(meta.templateId, workout.id);
    if (!entries) {
      await db.meta.delete('activeSession');
      return;
    }
    // Ré-applique les séries déjà validées de cette séance
    const logs = await db.setLogs.where('workoutId').equals(workout.id).sortBy('completedAt');
    for (const log of logs) {
      const entry = entries.find((e) => e.exerciseId === log.exerciseId);
      if (!entry) continue;
      const target: TargetSet = entry.sets[log.setIndex]?.target ?? { type: log.type };
      const done: SessionSet = {
        target,
        weightKg: log.weightKg,
        reps: log.reps ?? 0,
        durationSec: log.durationSec ?? 0,
        done: true,
        logId: log.id,
        prs: [],
      };
      if (log.setIndex < entry.sets.length) entry.sets[log.setIndex] = done;
      else entry.sets.push(done);
    }
    for (const entry of entries) {
      const saved = workout.exerciseNotes?.[entry.exerciseId];
      if (saved) entry.note = saved;
    }
    const rest =
      meta.restEndsAt && meta.restEndsAt > Date.now()
        ? { endsAt: meta.restEndsAt, totalSec: meta.restTotalSec ?? 90 }
        : null;
    set({
      active: true,
      workoutId: workout.id,
      templateId: meta.templateId,
      name: workout.name,
      startedAt: workout.startedAt,
      entries,
      index: Math.min(meta.currentExerciseIndex, entries.length - 1),
      rest,
      prCount: 0,

      summary: null,
    });
  },

  setIndex(i) {
    set({ index: Math.max(0, Math.min(i, get().entries.length - 1)) });
    persistActiveMeta(get());
  },

  patchSet(ei, si, patch) {
    set({
      entries: get().entries.map((e, i) =>
        i !== ei
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) },
      ),
    });
  },

  async completeSet(ei, si) {
    const { entries, workoutId } = get();
    const entry = entries[ei];
    const s = entry?.sets[si];
    if (!s || s.done) return;
    const isHold = s.target.type === 'hold';
    const log: SetLog = {
      id: nanoid(),
      workoutId,
      exerciseId: entry.exerciseId,
      completedAt: Date.now(),
      weightKg: s.weightKg,
      ...(isHold ? { durationSec: s.durationSec } : { reps: s.reps }),
      type: s.target.type,
      setIndex: si,
    };
    await db.setLogs.put(log);
    const prs = await registerSetForPRs(log, todayISO());
    get().patchSet(ei, si, { done: true, logId: log.id, prs });
    haptics.setDone();
    if (prs.length > 0) {
      haptics.pr();
      sounds.pr();
      set({ prCount: get().prCount + 1 });
      useToasts.getState().push({
        icon: 'trophy',
        title: 'Nouveau record',
        sub: prs.map((k) => PR_LABEL[k]).join(' · '),
      });
    }
    // Le contrat de la semaine peut tomber en pleine séance
    void checkChallenge().then((done) => {
      if (done) {
        haptics.pr();
        useToasts.getState().push({
          icon: 'scroll',
          title: 'Contrat rempli',
          sub: `${done.desc} · +${done.xp} XP`,
        });
      }
    });
    // Repos automatique — sauf après la toute dernière série de la séance
    const isLastSet =
      ei === entries.length - 1 && si === entry.sets.length - 1;
    if (!isLastSet) {
      const totalSec = entry.restSec;
      set({ rest: { endsAt: Date.now() + totalSec * 1000, totalSec } });
    }
    persistActiveMeta(get());
  },

  async uncompleteSet(ei, si) {
    const s = get().entries[ei]?.sets[si];
    if (!s?.done) return;
    if (s.logId) await db.setLogs.delete(s.logId);
    get().patchSet(ei, si, { done: false, logId: undefined, prs: [] });
    await rebuildAllPRs();
  },

  addSet(ei) {
    const entry = get().entries[ei];
    if (!entry) return;
    const prev = entry.sets[entry.sets.length - 1];
    const added: SessionSet = {
      target: prev ? { ...prev.target } : { type: 'normal' },
      weightKg: prev?.weightKg ?? 0,
      reps: prev?.reps ?? 0,
      durationSec: prev?.durationSec ?? 0,
      done: false,
      prs: [],
    };
    set({
      entries: get().entries.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, added] })),
    });
  },

  setEntryNote(ei, note) {
    const entry = get().entries[ei];
    if (!entry) return;
    set({ entries: get().entries.map((e, i) => (i !== ei ? e : { ...e, note })) });
    void db.workouts
      .where('id')
      .equals(get().workoutId)
      .modify((w) => {
        w.exerciseNotes = { ...w.exerciseNotes, [entry.exerciseId]: note };
      });
  },

  adjustRest(deltaSec) {
    const rest = get().rest;
    if (!rest) return;
    const endsAt = Math.max(Date.now() + 1000, rest.endsAt + deltaSec * 1000);
    set({ rest: { endsAt, totalSec: Math.max(1, rest.totalSec + deltaSec) } });
    persistActiveMeta(get());
  },

  skipRest() {
    set({ rest: null });
    persistActiveMeta(get());
  },

  clearRest() {
    set({ rest: null });
    persistActiveMeta(get());
  },

  async finish() {
    const { workoutId, templateId, name, startedAt, entries, prCount } = get();
    const tonnageKg = entries
      .flatMap((e) => e.sets)
      .reduce((sum, s) => (s.done && s.target.type !== 'hold' ? sum + s.weightKg * s.reps : sum), 0);
    const setsDone = entries.flatMap((e) => e.sets).filter((s) => s.done).length;
    let prevTonnageKg: number | undefined;
    if (templateId) {
      const prev = (
        await db.workouts.where('templateId').equals(templateId).toArray()
      )
        .filter((w) => w.id !== workoutId && w.finishedAt)
        .sort((a, b) => b.startedAt - a.startedAt)[0];
      if (prev) prevTonnageKg = await tonnageOfWorkout(prev.id);
    }
    await db.workouts.update(workoutId, { finishedAt: Date.now() });
    await db.meta.delete('activeSession');

    // Gamification : contrat, badges, rareté, XP — tout dérivé de la séance réelle
    const challengeDone = await checkChallenge();
    const newBadges = await evaluateBadges(workoutId);
    const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);
    const deltaPct =
      prevTonnageKg && prevTonnageKg > 0
        ? ((tonnageKg - prevTonnageKg) / prevTonnageKg) * 100
        : null;
    const rarity = computeRarity({
      prCount,
      deltaPct,
      completion: totalSets > 0 ? setsDone / totalSets : 0,
    });
    const xpGained =
      setsDone * XP_PER_SET +
      XP_PER_WORKOUT +
      prCount * XP_PER_PR +
      (challengeDone ? CHALLENGE_XP : 0) +
      newBadges.length * XP_PER_BADGE;

    const toasts = useToasts.getState();
    if (challengeDone) {
      toasts.push({
        icon: 'scroll',
        title: 'Contrat rempli',
        sub: `+${challengeDone.xp} XP`,
      });
    }
    for (const b of newBadges) {
      toasts.push({ icon: b.icon, title: `Badge : ${b.name}`, sub: b.desc });
    }

    set({
      active: false,
      rest: null,
      summary: {
        name,
        durationSec: (Date.now() - startedAt) / 1000,
        setsDone,
        tonnageKg,
        prCount,
        prevTonnageKg,
        rarity,
        xpGained,
        newBadges: newBadges.map((b) => b.name),
        challengeDone: challengeDone !== null,
      },
    });
  },

  async abandon() {
    const { workoutId } = get();
    await db.setLogs.where('workoutId').equals(workoutId).delete();
    await db.workouts.delete(workoutId);
    await db.meta.delete('activeSession');
    await rebuildAllPRs();
    set({ active: false, rest: null, entries: [], summary: null });
  },

  clearSummary: () => set({ summary: null }),
}));
