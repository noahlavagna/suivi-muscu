import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { partnerName, useDuo, type Cheer } from '../../state/duo';
import { useSettings } from '../../state/settings';
import {
  partnerState,
  QUICK_CHEERS,
  reachedUnlocks,
  unlockInfo,
  UNLOCKS,
  type LivePayload,
  type Unlock,
} from '../../lib/duo';
import { fmtCountdown, fmtNumber, fmtTimer, kgToUnit } from '../../lib/format';
import { useNow } from '../../lib/useNow';
import { Pressable } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { IconCheck, IconChevronRight, IconHeart, IconTrash } from '../ui/Icons';

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function statusLine(p: LivePayload | null, state: ReturnType<typeof partnerState>, now: number) {
  if (!p || state === 'idle') return 'Pas en séance';
  if (state === 'finished') return `Séance finie · ${p.setsDone} séries`;
  const resting = p.restEndsAt && p.restEndsAt > now;
  return `${p.exerciseName || p.workoutName} · ${p.setsDone}/${p.setsTotal}${resting ? ' · repos' : ''}`;
}

/**
 * Bandeau du binôme : où il ou elle en est, d'un coup d'œil. Un tap ouvre le
 * détail et les encouragements. Rien n'est rendu tant que le duo n'est pas lié.
 */
export function DuoPill({ className = '' }: { className?: string }) {
  const status = useDuo((s) => s.status);
  const duo = useDuo((s) => s.duo);
  const me = useDuo((s) => s.me);
  const partner = useDuo((s) => s.partner);
  const now = useNow(1000, status === 'linked');
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  if (status !== 'linked') return null;

  const p = partner?.payload ?? null;
  const state = partnerState(p, partner?.updatedAt ?? 0, now);
  const live = state === 'live';
  const pct = p && p.setsTotal > 0 ? p.setsDone / p.setsTotal : 0;

  return (
    <>
      <Pressable
        className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[14px] bg-raised px-3.5 py-2.5 text-left ${className}`}
        tapScale={0.98}
        onClick={() => setOpen(true)}
        aria-label={`Séance de ${partnerName(duo, me)}`}
      >
        {live && (
          <span
            className="absolute inset-y-0 left-0 bg-accent-dim transition-[width] duration-700"
            style={{ width: `${pct * 100}%` }}
          />
        )}
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent">
          <IconHeart size={16} />
          {live && (
            <motion.span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-raised bg-positive"
              animate={reduced ? undefined : { scale: [1, 1.25, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-5">{partnerName(duo, me)}</span>
          <span className="tnum block truncate text-[12px] leading-4 text-ink-2">
            {statusLine(p, state, now)}
          </span>
        </span>
        <IconChevronRight size={18} className="relative text-ink-3" />
      </Pressable>
      <DuoSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DuoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { duo, me, partner, cheers, send, retract, error } = useDuo();
  const unit = useSettings((s) => s.unit);
  const now = useNow(1000, open);
  const [tab, setTab] = useState<'live' | 'write'>('live');
  const [text, setText] = useState('');
  const [unlock, setUnlock] = useState<Unlock>('now');
  const [sent, setSent] = useState<string | null>(null);
  const name = partnerName(duo, me);

  const p = partner?.payload ?? null;
  const state = partnerState(p, partner?.updatedAt ?? 0, now);
  // Les encouragements rapides suivent SA séance en cours
  const reached = state === 'live' ? reachedUnlocks(p) : new Set<Unlock>(['now']);

  const mine = cheers.filter((c) => c.from_user === me);
  const received = cheers.filter((c) => c.from_user !== me && c.revealed_at);
  const hiddenForMe = cheers.filter((c) => c.from_user !== me && !c.revealed_at).length;

  const quick = async (t: string) => {
    if (await send(t, 'now')) {
      setSent(t);
      setTimeout(() => setSent((s) => (s === t ? null : s)), 1800);
    }
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
      active ? 'bg-accent text-canvas' : 'bg-raised-2 text-ink-2'
    }`;

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={`Séance de ${name}`}>
      <div className="pb-3 pt-1">
        <div className="mb-3 flex gap-2">
          <Pressable className={chip(tab === 'live')} onClick={() => setTab('live')}>
            En direct
          </Pressable>
          <Pressable className={chip(tab === 'write')} onClick={() => setTab('write')}>
            Mots cachés{mine.some((c) => !c.revealed_at) ? ` · ${mine.filter((c) => !c.revealed_at).length}` : ''}
          </Pressable>
        </div>

        {tab === 'live' && (
          <>
            {/* Où en est le binôme */}
            <div className="mb-4 rounded-[16px] bg-raised-2 p-4">
              <p className="text-[13px] font-medium text-ink-3">{name}</p>
              {state === 'idle' || !p ? (
                <p className="mt-1 text-[17px] font-semibold">Pas en séance pour l’instant</p>
              ) : (
                <>
                  <p className="mt-0.5 text-[19px] font-bold leading-6">{p.workoutName}</p>
                  <p className="tnum text-[13px] text-ink-2">
                    {state === 'finished'
                      ? `Terminée · ${fmtTimer(((p.finishedAt ?? now) - p.startedAt) / 1000)}`
                      : `${fmtTimer((now - p.startedAt) / 1000)} · exercice ${p.exerciseIndex + 1}/${p.exerciseCount}`}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-700"
                      style={{ width: `${p.setsTotal ? (p.setsDone / p.setsTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="tnum mt-1.5 flex justify-between text-[12px] text-ink-3">
                    <span>
                      {p.setsDone}/{p.setsTotal} séries
                    </span>
                    <span>
                      {fmtNumber(kgToUnit(p.tonnageKg, unit), 0)} {unit} soulevés
                      {p.prCount > 0 ? ` · ${p.prCount} record${p.prCount > 1 ? 's' : ''}` : ''}
                    </span>
                  </div>
                  {state === 'live' && (
                    <div className="mt-3 border-t border-sep pt-3">
                      <p className="text-[15px] font-semibold">{p.exerciseName}</p>
                      {p.restEndsAt && p.restEndsAt > now ? (
                        <p className="tnum text-[13px] text-accent">
                          En repos · {fmtCountdown((p.restEndsAt - now) / 1000)}
                        </p>
                      ) : (
                        <p className="text-[13px] text-ink-2">À l’effort</p>
                      )}
                      {p.lastSet && (
                        <p className="tnum mt-1 text-[12px] text-ink-3">
                          Dernière série : {p.lastSet.exerciseName} ·{' '}
                          {p.lastSet.weightKg > 0
                            ? `${fmtNumber(kgToUnit(p.lastSet.weightKg, unit))} ${unit} × `
                            : ''}
                          {p.lastSet.durationSec != null
                            ? `${p.lastSet.durationSec} s`
                            : `${p.lastSet.reps} reps`}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Encouragements rapides, débloqués au fil de sa séance */}
            <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
              Encourager
            </p>
            <div className="mb-4 flex flex-col gap-1.5">
              {QUICK_CHEERS.map((q) => {
                const ok = reached.has(q.unlock);
                return (
                  <Pressable
                    key={q.text}
                    className={`flex items-center justify-between gap-2 rounded-[12px] px-3.5 py-2.5 text-left text-[14px] ${
                      ok ? 'bg-raised-2 font-medium text-ink' : 'bg-raised-2/50 text-ink-3'
                    }`}
                    disabled={!ok}
                    onClick={() => void quick(q.text)}
                  >
                    <span>{ok ? q.text : `Se débloque ${unlockInfo(q.unlock).when}`}</span>
                    {sent === q.text ? (
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-positive">
                        <IconCheck size={14} /> Envoyé
                      </span>
                    ) : (
                      !ok && <LockIcon />
                    )}
                  </Pressable>
                );
              })}
            </div>

            {/* Ce qu'on a reçu */}
            <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
              Ses mots pour toi
            </p>
            {hiddenForMe > 0 && (
              <p className="mb-2 flex items-center gap-1.5 rounded-[12px] bg-accent-dim px-3.5 py-2.5 text-[13px] font-medium text-accent">
                <LockIcon size={13} />
                {hiddenForMe} mot{hiddenForMe > 1 ? 's' : ''} caché{hiddenForMe > 1 ? 's' : ''} t’attend
                {hiddenForMe > 1 ? 'ent' : ''} pendant ta séance
              </p>
            )}
            {received.length === 0 ? (
              <p className="py-3 text-center text-[13px] text-ink-3">Rien pour l’instant.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {received.slice(0, 20).map((c) => (
                  <CheerBubble key={c.id} c={c} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'write' && (
          <>
            <p className="mb-3 text-[13px] leading-5 text-ink-2">
              Écris un mot pour {name} : il reste caché et se révèle sur son téléphone au moment
              choisi de sa séance.
            </p>
            <textarea
              className="mb-2 h-24 w-full resize-none rounded-[12px] bg-raised-2 px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-3"
              placeholder="Ton mot…"
              maxLength={280}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mb-1.5 text-[12px] font-medium text-ink-3">Se révèle</p>
            <div className="-mx-1 mb-3 flex flex-wrap gap-1.5 px-1">
              {UNLOCKS.map((u) => (
                <Pressable key={u.id} className={chip(unlock === u.id)} onClick={() => setUnlock(u.id)}>
                  {u.label}
                </Pressable>
              ))}
            </div>
            <Pressable
              className="mb-5 w-full rounded-[12px] bg-accent py-3 text-[15px] font-semibold text-canvas disabled:opacity-40"
              disabled={!text.trim()}
              onClick={async () => {
                if (await send(text, unlock)) setText('');
              }}
            >
              {unlock === 'now' ? 'Envoyer' : 'Cacher le mot'}
            </Pressable>

            <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
              Tes mots
            </p>
            {mine.length === 0 ? (
              <p className="py-3 text-center text-[13px] text-ink-3">Aucun mot pour l’instant.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {mine.slice(0, 30).map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-[12px] bg-raised-2 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-5">{c.text}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3">
                        {c.revealed_at ? (
                          <>
                            <IconCheck size={12} className="text-positive" /> Lu
                          </>
                        ) : (
                          <>
                            <LockIcon size={11} /> Se révèle {unlockInfo(c.unlock).when}
                          </>
                        )}
                      </p>
                    </div>
                    {!c.revealed_at && (
                      <Pressable
                        className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink-3"
                        onClick={() => void retract(c.id)}
                        aria-label="Retirer ce mot"
                      >
                        <IconTrash size={14} />
                      </Pressable>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p className="mt-3 text-[13px] text-negative">{error}</p>}
      </div>
    </Sheet>
  );
}

function CheerBubble({ c }: { c: Cheer }) {
  return (
    <div className="rounded-[12px] bg-raised-2 px-3.5 py-2.5">
      <p className="text-[14px] leading-5">{c.text}</p>
      <p className="mt-0.5 text-[11px] text-ink-3">
        {new Date(c.revealed_at ?? c.created_at).toLocaleString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
        {c.unlock !== 'now' ? ` · débloqué ${unlockInfo(c.unlock).when}` : ''}
      </p>
    </div>
  );
}
