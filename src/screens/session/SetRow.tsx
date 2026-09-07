import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Exercise } from '../../db/types';
import { isDurationSet, isFreeSet, SET_TYPE_LABEL } from '../../db/types';
import { useSession, type SessionSet } from '../../state/session';
import { useSettings } from '../../state/settings';
import { fmtNumber, kgToUnit } from '../../lib/format';
import { Stepper } from '../../components/ui/Stepper';
import { Pressable } from '../../components/ui/Pressable';
import { Sparks } from '../../components/ui/Sparks';
import { IconCheck, IconTrash } from '../../components/ui/Icons';
import { springMicro } from '../../lib/springs';

interface Props {
  entryIndex: number;
  setIndex: number;
  set: SessionSet;
  exercise: Exercise;
}

function targetLabel(set: SessionSet): string {
  const t = set.target;
  if (t.cluster) return `${t.cluster.count}×${t.cluster.reps} · repos ${t.cluster.restSec} s`;
  if (isFreeSet(t)) return 'à la sensation';
  if (isDurationSet(t)) {
    const sec = t.durationSec ?? 20;
    return t.durationSecMax && t.durationSecMax !== sec
      ? `${sec}–${t.durationSecMax} s`
      : `${sec} s`;
  }
  if (t.repsMin != null && t.repsMax != null)
    return t.repsMin === t.repsMax ? `${t.repsMin} reps` : `${t.repsMin}–${t.repsMax} reps`;
  return 'libre';
}

export function SetRow({ entryIndex, setIndex, set, exercise }: Props) {
  const unit = useSettings((s) => s.unit);
  const patchSet = useSession((s) => s.patchSet);
  const completeSet = useSession((s) => s.completeSet);
  const uncompleteSet = useSession((s) => s.uncompleteSet);
  const removeSet = useSession((s) => s.removeSet);
  // La dernière série d'un exercice ne se supprime pas : il ne resterait rien à valider
  const canRemove = useSession((s) => (s.entries[entryIndex]?.sets.length ?? 0) > 1);
  const reduced = useReducedMotion();

  // Gerbe d'étincelles au passage à « validée ». Le ref part de l'état courant :
  // une séance restaurée ne rejoue pas l'animation de toutes ses séries.
  const wasDone = useRef(set.done);
  const [burst, setBurst] = useState(0);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (set.done && !wasDone.current) {
      setBurst((n) => n + 1);
      setFlash(true);
    }
    wasDone.current = set.done;
  }, [set.done]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(t);
  }, [flash]);

  const isHold = isDurationSet(set.target);
  const free = isFreeSet(set.target);
  const loadable =
    exercise.equipment === 'haltères' ||
    exercise.equipment === 'kettlebell' ||
    exercise.equipment === 'barre';
  const badge = SET_TYPE_LABEL[set.target.type];

  return (
    <div className="relative border-b border-sep py-3 last:border-b-0">
      <AnimatePresence>
        {flash && !reduced && (
          <motion.span
            className="pointer-events-none absolute -inset-x-2 inset-y-0 rounded-[10px] bg-accent-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', times: [0, 0.18, 1] }}
          />
        )}
      </AnimatePresence>
      <div className="relative mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-ink-2">
          {free ? 'Mouvement' : `Série ${setIndex + 1}`}
          {badge && (
            <span className="ml-2 rounded-md bg-accent-dim px-1.5 py-0.5 text-[11px] font-semibold text-accent">
              {badge}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="tnum text-[12px] text-ink-3">
            {free ? 'Sans objectif' : `Objectif ${targetLabel(set)}`}
          </span>
          {canRemove && (
            <Pressable
              className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink-3"
              onClick={() => {
                // Une série validée est déjà enregistrée : on ne l'efface pas d'un doigt qui glisse
                if (set.done && !window.confirm('Supprimer cette série déjà validée ?')) return;
                void removeSet(entryIndex, setIndex);
              }}
              aria-label={`Supprimer la série ${setIndex + 1}`}
            >
              <IconTrash size={14} />
            </Pressable>
          )}
        </span>
      </div>
      <div className="relative flex items-center justify-between gap-2">
        <div className="relative">
          <AnimatePresence>
            {burst > 0 && set.done && <Sparks key={burst} seed={burst} spread={52} />}
          </AnimatePresence>
          <Pressable
            onClick={() =>
              set.done ? uncompleteSet(entryIndex, setIndex) : completeSet(entryIndex, setIndex)
            }
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
              set.done
                ? 'border-transparent bg-accent text-canvas'
                : 'border-sep bg-raised-2 text-ink-3'
            }`}
            aria-label={set.done ? 'Invalider la série' : 'Valider la série'}
          >
            <motion.span
              animate={
                set.done
                  ? reduced
                    ? { scale: 1 }
                    : { scale: [0.7, 1.22, 1] }
                  : { scale: 0.9 }
              }
              transition={set.done && !reduced ? { duration: 0.34, times: [0, 0.5, 1] } : springMicro}
              className="flex"
            >
              <IconCheck size={20} />
            </motion.span>
          </Pressable>
        </div>

        <div
          className={`flex flex-1 items-center justify-end gap-3 ${set.done ? 'opacity-55' : ''}`}
        >
          {free ? (
            <span className="text-[14px] text-ink-3">
              {set.done ? 'Fait' : 'Valide quand c’est bon'}
            </span>
          ) : isHold ? (
            <>
              {/* Une marche lestée ou un gainage chargé se tiennent en secondes,
                  mais la charge est justement ce qu'il faut noter d'une fois
                  sur l'autre — le poids du corps, lui, n'a rien à saisir. */}
              {loadable && (
                <Stepper
                  size="sm"
                  value={set.weightKg}
                  step={exercise.weightIncrementKg}
                  min={0}
                  onChange={(v) => patchSet(entryIndex, setIndex, { weightKg: v })}
                  format={(v) => fmtNumber(kgToUnit(v, unit))}
                  disabled={set.done}
                  ariaLabel={`Poids (${unit})`}
                />
              )}
              <Stepper
                size="sm"
                value={set.durationSec}
                step={5}
                min={5}
                onChange={(v) => patchSet(entryIndex, setIndex, { durationSec: v })}
                format={(v) => `${Math.round(v)} s`}
                disabled={set.done}
                ariaLabel="Durée"
              />
            </>
          ) : (
            <>
              <Stepper
                size="sm"
                value={set.weightKg}
                step={exercise.weightIncrementKg}
                min={0}
                onChange={(v) => patchSet(entryIndex, setIndex, { weightKg: v })}
                format={(v) => fmtNumber(kgToUnit(v, unit))}
                disabled={set.done}
                ariaLabel={`Poids (${unit})`}
              />
              <Stepper
                size="sm"
                value={set.reps}
                step={1}
                min={0}
                onChange={(v) => patchSet(entryIndex, setIndex, { reps: v })}
                format={(v) => `${Math.round(v)}`}
                disabled={set.done}
                ariaLabel="Répétitions"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
