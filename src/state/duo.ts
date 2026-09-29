import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../cloud/client';
import { db } from '../db/db';
import { isDurationSet } from '../db/types';
import {
  IDLE_PAYLOAD,
  makeDuoCode,
  reachedUnlocks,
  type LivePayload,
  type Unlock,
} from '../lib/duo';
import { haptics } from '../lib/haptics';
import { sounds } from '../lib/sound';
import { useCloud } from './cloud';
import { useSession } from './session';
import { useSettings } from './settings';

/**
 * Mode Duo : deux téléphones liés par un code, chacun voit la séance de
 * l'autre en direct et peut lui laisser des mots — tout de suite, ou cachés
 * jusqu'à un moment de sa séance (voir `lib/duo.ts`).
 *
 * Repose sur le compte cloud : chacun le sien, liés par la table `duos`
 * (schéma dans `supabase/duo.sql`). Le temps réel Supabase pousse les
 * changements ; un rafraîchissement périodique rattrape ce qu'il aurait raté
 * (réseau de salle de sport, app mise en veille).
 */

export interface DuoRow {
  id: string;
  code: string;
  a: string;
  a_name: string;
  b: string | null;
  b_name: string | null;
}

export interface Cheer {
  id: string;
  duo_id: string;
  from_user: string;
  text: string;
  unlock: Unlock;
  created_at: string;
  revealed_at: string | null;
}

export interface PartnerLive {
  payload: LivePayload;
  updatedAt: number;
}

type Status = 'off' | 'none' | 'pending' | 'linked';

interface DuoState {
  status: Status;
  duo: DuoRow | null;
  me: string | null;
  partner: PartnerLive | null;
  cheers: Cheer[];
  /** Mots fraîchement révélés, présentés un par un */
  incoming: Cheer[];
  busy: boolean;
  error: string | null;

  init: () => void;
  create: () => Promise<void>;
  join: (code: string) => Promise<void>;
  leave: () => Promise<void>;
  send: (text: string, unlock: Unlock) => Promise<boolean>;
  retract: (id: string) => Promise<void>;
  dismissIncoming: () => void;
}

const PROFILE_NAME = { noah: 'Noah', oceane: 'Océane' } as const;
export const myDuoName = () => PROFILE_NAME[useSettings.getState().profile];

export const partnerName = (duo: DuoRow | null, me: string | null): string =>
  !duo ? 'Ton binôme' : duo.a === me ? (duo.b_name ?? 'Ton binôme') : duo.a_name;

const POLL_MS = 20_000;
const PENDING_POLL_MS = 4_000;
const PUBLISH_DEBOUNCE_MS = 1_200;

let channel: RealtimeChannel | null = null;
let pollTimer: ReturnType<typeof setInterval> | undefined;
/** Mots déjà présentés dans cette session d'app — la base peut tarder à le refléter */
const shown = new Set<string>();

export const useDuo = create<DuoState>((set, get) => ({
  status: 'off',
  duo: null,
  me: null,
  partner: null,
  cheers: [],
  incoming: [],
  busy: false,
  error: null,

  init() {
    if (!supabase || initialized) return;
    initialized = true;
    const onEmail = (email: string | null) => {
      if (email) void loadDuo();
      else reset();
    };
    onEmail(useCloud.getState().email);
    useCloud.subscribe((s, prev) => {
      if (s.email !== prev.email) onEmail(s.email);
    });
    installPublisher();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && get().duo) void refresh();
    });
  },

  async create() {
    if (!supabase) return;
    set({ busy: true, error: null });
    const { data, error } = await supabase
      .from('duos')
      .insert({ code: makeDuoCode(), a_name: myDuoName() })
      .select()
      .single();
    if (error) return set({ busy: false, error: humanError(error.message) });
    set({ busy: false });
    applyDuo(data as DuoRow);
  },

  async join(code) {
    if (!supabase) return;
    set({ busy: true, error: null });
    const { data, error } = await supabase.rpc('join_duo', {
      p_code: code,
      p_name: myDuoName(),
    });
    if (error) return set({ busy: false, error: humanError(error.message) });
    set({ busy: false });
    applyDuo(data as DuoRow);
  },

  async leave() {
    const { duo } = get();
    if (!supabase || !duo) return;
    set({ busy: true, error: null });
    const { error } = await supabase.from('duos').delete().eq('id', duo.id);
    if (error) return set({ busy: false, error: humanError(error.message) });
    set({ busy: false });
    applyDuo(null);
  },

  async send(text, unlock) {
    const { duo } = get();
    const clean = text.trim().slice(0, 280);
    if (!supabase || !duo || !clean) return false;
    const { data, error } = await supabase
      .from('duo_cheers')
      .insert({ duo_id: duo.id, text: clean, unlock })
      .select()
      .single();
    if (error) {
      set({ error: humanError(error.message) });
      return false;
    }
    set({ cheers: [data as Cheer, ...get().cheers] });
    haptics.light();
    return true;
  },

  async retract(id) {
    if (!supabase) return;
    set({ cheers: get().cheers.filter((c) => c.id !== id) });
    await supabase.from('duo_cheers').delete().eq('id', id);
  },

  dismissIncoming: () => set({ incoming: get().incoming.slice(1) }),
}));

let initialized = false;

function reset() {
  applyDuo(null);
  useDuo.setState({ status: 'off', me: null, error: null });
}

async function loadDuo() {
  if (!supabase) return;
  const { data: u } = await supabase.auth.getUser();
  const me = u.user?.id ?? null;
  useDuo.setState({ me });
  const { data, error } = await supabase
    .from('duos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    useDuo.setState({ status: 'none', error: humanError(error.message) });
    return;
  }
  const rows = (data ?? []) as DuoRow[];
  applyDuo(rows.find((d) => d.b) ?? rows[0] ?? null);
}

/** Bascule sur un duo (ou aucun) : statut, abonnement temps réel, rafraîchissement. */
function applyDuo(duo: DuoRow | null) {
  const prev = useDuo.getState().duo;
  const status: Status = !duo ? 'none' : duo.b ? 'linked' : 'pending';
  useDuo.setState({ duo, status, ...(duo?.id !== prev?.id ? { partner: null, cheers: [] } : {}) });

  if (channel && (duo?.id !== prev?.id || !duo)) {
    void supabase?.removeChannel(channel);
    channel = null;
  }
  clearInterval(pollTimer);
  pollTimer = undefined;
  if (!supabase || !duo) return;

  if (status === 'pending') {
    // On attend que l'autre saisisse le code
    pollTimer = setInterval(() => void recheckPending(), PENDING_POLL_MS);
    return;
  }

  if (!channel) {
    channel = supabase
      .channel(`duo-${duo.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duo_live', filter: `duo_id=eq.${duo.id}` },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duo_cheers', filter: `duo_id=eq.${duo.id}` },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'duos' },
        () => void loadDuo(),
      )
      .subscribe();
  }
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') void refresh();
  }, POLL_MS);
  void refresh();
  lastSent = '';
  void publishNow();
}

async function recheckPending() {
  const { duo } = useDuo.getState();
  if (!supabase || !duo) return;
  const { data } = await supabase.from('duos').select('*').eq('id', duo.id).maybeSingle();
  if (!data) return applyDuo(null);
  if ((data as DuoRow).b) {
    haptics.pr();
    applyDuo(data as DuoRow);
  }
}

async function refresh() {
  const { duo, me } = useDuo.getState();
  if (!supabase || !duo || !me) return;
  const partnerId = duo.a === me ? duo.b : duo.a;
  const [live, cheers] = await Promise.all([
    partnerId
      ? supabase.from('duo_live').select('payload, updated_at').eq('user_id', partnerId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('duo_cheers')
      .select('*')
      .eq('duo_id', duo.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);
  if (cheers.error && isMissingTable(cheers.error.message)) {
    useDuo.setState({ error: humanError(cheers.error.message) });
    return;
  }
  const row = live.data as { payload: LivePayload; updated_at: string } | null;
  useDuo.setState({
    partner: row ? { payload: row.payload, updatedAt: Date.parse(row.updated_at) } : null,
    cheers: (cheers.data ?? []) as Cheer[],
  });
  revealDue();
}

/**
 * Révèle les mots du binôme dont le moment est atteint dans MA séance. Un mot
 * écrit après coup pour un moment déjà passé se révèle aussitôt.
 */
function revealDue() {
  const { cheers, me } = useDuo.getState();
  if (!supabase || !me) return;
  const reached = reachedUnlocks(ownPayloadSync());
  const due = cheers.filter(
    (c) => c.from_user !== me && !c.revealed_at && !shown.has(c.id) && reached.has(c.unlock),
  );
  if (due.length === 0) return;
  const now = new Date().toISOString();
  for (const c of due) shown.add(c.id);
  const ids = new Set(due.map((c) => c.id));
  useDuo.setState((s) => ({
    incoming: [...s.incoming, ...due.reverse().map((c) => ({ ...c, revealed_at: now }))],
    cheers: s.cheers.map((c) => (ids.has(c.id) ? { ...c, revealed_at: now } : c)),
  }));
  haptics.pr();
  sounds.setDone();
  void supabase.from('duo_cheers').update({ revealed_at: now }).in('id', [...ids]);
}

// ── Publication de sa propre séance ─────────────────────────────────────────

let finishedAt: number | undefined;
let lastSent = '';
let publishTimer: ReturnType<typeof setTimeout> | undefined;
const exerciseNames = new Map<string, string>();

/** Instantané de sa séance, à partir du store (les noms d'exercices sont mis en cache). */
function ownPayloadSync(): LivePayload {
  const s = useSession.getState();
  // Une séance finie reste publiée comme telle jusqu'à la suivante
  if (!s.workoutId || (!s.active && !s.summary && !finishedAt)) return IDLE_PAYLOAD;
  const sets = s.entries.flatMap((e) => e.sets);
  const done = s.entries.flatMap((e) =>
    e.sets.filter((x) => x.done).map((x) => ({ e, x })),
  );
  // Dernière série : celle de l'exercice affiché s'il en a une, sinon la plus avancée
  const here = done.filter((d) => d.e === s.entries[s.index]);
  const last = here[here.length - 1] ?? done[done.length - 1];
  const name = (id: string) => exerciseNames.get(id) ?? '';
  return {
    v: 1,
    active: s.active,
    workoutId: s.workoutId,
    workoutName: s.name,
    startedAt: s.startedAt,
    exerciseName: name(s.entries[s.index]?.exerciseId ?? ''),
    exerciseIndex: s.index,
    exerciseCount: s.entries.length,
    setsDone: done.length,
    setsTotal: sets.length,
    prCount: s.prCount,
    tonnageKg: done.reduce(
      (t, { x }) => (isDurationSet(x.target) ? t : t + x.weightKg * x.reps),
      0,
    ),
    ...(s.active && s.rest ? { restEndsAt: s.rest.endsAt } : {}),
    ...(last
      ? {
          lastSet: {
            exerciseName: name(last.e.exerciseId),
            weightKg: last.x.weightKg,
            ...(isDurationSet(last.x.target)
              ? { durationSec: last.x.durationSec }
              : { reps: last.x.reps }),
          },
        }
      : {}),
    ...(!s.active && finishedAt ? { finishedAt } : {}),
  };
}

async function publishNow() {
  clearTimeout(publishTimer);
  publishTimer = undefined;
  const { duo, status, me } = useDuo.getState();
  if (!supabase || !duo || !me || status !== 'linked') return;
  const ids = useSession.getState().entries.map((e) => e.exerciseId);
  const missing = ids.filter((id) => !exerciseNames.has(id));
  if (missing.length > 0) {
    for (const ex of await db.exercises.bulkGet(missing)) if (ex) exerciseNames.set(ex.id, ex.name);
  }
  const payload = ownPayloadSync();
  const json = JSON.stringify(payload);
  if (json === lastSent) return;
  lastSent = json;
  const { error } = await supabase
    .from('duo_live')
    .upsert({ user_id: me, duo_id: duo.id, payload, updated_at: new Date().toISOString() });
  if (error) lastSent = ''; // on retentera au prochain changement
}

function installPublisher() {
  useSession.subscribe((s, prev) => {
    if (s.workoutId !== prev.workoutId) finishedAt = undefined;
    // Fin de séance : le récap apparaît quand `active` retombe
    if (prev.active && !s.active && s.summary) finishedAt = Date.now();
    if (
      s.entries === prev.entries &&
      s.index === prev.index &&
      s.rest === prev.rest &&
      s.active === prev.active &&
      s.prCount === prev.prCount
    )
      return;
    revealDue();
    clearTimeout(publishTimer);
    // Lancement et fin partent tout de suite ; le reste est regroupé
    const immediate = s.active !== prev.active;
    publishTimer = setTimeout(() => void publishNow(), immediate ? 0 : PUBLISH_DEBOUNCE_MS);
  });
}

// ── Erreurs ─────────────────────────────────────────────────────────────────

const isMissingTable = (msg: string) => {
  const m = msg.toLowerCase();
  return m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find');
};

function humanError(msg: string): string {
  if (msg.includes('code_invalide')) return 'Code inconnu ou déjà utilisé.';
  if (isMissingTable(msg))
    return 'Le mode Duo n’est pas encore activé sur le serveur (script supabase/duo.sql).';
  const m = msg.toLowerCase();
  if (m.includes('fetch') || m.includes('network')) return 'Pas de connexion — réessaie plus tard.';
  return msg;
}
