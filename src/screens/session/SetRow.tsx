import { motion } from 'framer-motion';
import type { Exercise } from '../../db/types';
import { SET_TYPE_LABEL } from '../../db/types';
import { useSession, type SessionSet } from '../../state/session';
import { useSettings } from '../../state/settings';
import { fmtNumber, kgToUnit } from '../../lib/format';
import { Stepper } from '../../components/ui/Stepper';
import { Pressable } from '../../components/ui/Pressable';
import { IconCheck } from '../../components/ui/Icons';
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
  if (t.type === 'hold') return `${t.durationSec ?? 20} s`;
  if (t.repsMin != null && t.repsMax != null)
    return t.repsMin === t.repsMax ? `${t.repsMin} reps` : `${t.repsMin}–${t.repsMax} reps`;
  return 'libre';
}

export function SetRow({ entryIndex, setIndex, set, exercise }: Props) {
  const unit = useSettings((s) => s.unit);
  const patchSet = useSession((s) => s.patchSet);
  const completeSet = useSession((s) => s.completeSet);
  const uncompleteSet = useSession((s) => s.uncompleteSet);

  const isHold = set.target.type === 'hold';
  const badge = SET_TYPE_LABEL[set.target.type];

  return (
    <div className="border-b border-sep py-3 last:border-b-0">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-ink-2">
          Série {setIndex + 1}
          {badge && (
            <span className="ml-2 rounded-md bg-accent-dim px-1.5 py-0.5 text-[11px] font-semibold text-accent">
              {badge}
            </span>
          )}
        </span>
        <span className="tnum text-[12px] text-ink-3">Objectif {targetLabel(set)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Pressable
          onClick={() => (set.done ? uncompleteSet(entryIndex, setIndex) : completeSet(entryIndex, setIndex))}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
            set.done
              ? 'border-transparent bg-accent text-canvas'
              : 'border-sep bg-raised-2 text-ink-3'
          }`}
          aria-label={set.done ? 'Invalider la série' : 'Valider la série'}
        >
          <motion.span
            animate={{ scale: set.done ? 1 : 0.9 }}
            transition={springMicro}
            className="flex"
          >
            <IconCheck size={20} />
          </motion.span>
        </Pressable>

        <div className={`flex flex-1 items-center justify-end gap-3 ${set.done ? 'opacity-55' : ''}`}>
          {isHold ? (
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
