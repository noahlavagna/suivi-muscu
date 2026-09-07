import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { db } from '../../db/db';
import { useSession } from '../../state/session';
import { Sparks } from '../../components/ui/Sparks';
import { IconAnvil, IconCheck, IconFlower } from '../../components/ui/Icons';
import { useSettings } from '../../state/settings';
import { springSheet } from '../../lib/springs';

const HOLD_MS = 1250;

/**
 * Fin d'exercice : une frappe d'enclume, puis l'app enchaîne d'elle-même sur le
 * mouvement suivant. Assez court pour ne pas retarder la série d'après — le
 * repos, lui, tourne déjà en fond.
 */
export function ExerciseDoneOverlay() {
  const done = useSession((s) => s.exerciseDone);
  const entries = useSession((s) => s.entries);
  const setIndex = useSession((s) => s.setIndex);
  const clear = useSession((s) => s.clearExerciseDone);
  const reduced = useReducedMotion();
  const oceane = useSettings((s) => s.profile === 'oceane');

  const doneId = done != null ? entries[done.index]?.exerciseId : undefined;
  const nextId = done?.nextIndex != null ? entries[done.nextIndex]?.exerciseId : undefined;
  const names = useLiveQuery(
    async () => ({
      current: doneId ? (await db.exercises.get(doneId))?.name : undefined,
      next: nextId ? (await db.exercises.get(nextId))?.name : undefined,
    }),
    [doneId, nextId],
  );

  const at = done?.at;
  const nextIndex = done?.nextIndex ?? null;
  useEffect(() => {
    if (at == null) return;
    const t = setTimeout(() => {
      if (nextIndex !== null) setIndex(nextIndex);
      clear();
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [at, nextIndex, setIndex, clear]);

  return (
    <AnimatePresence>
      {done && (
        <motion.div
          key={done.at}
          // Fond opaque plutôt que verre dépoli : sur un thème clair, le verre
          // se confondait avec la carte d'exercice et le panneau ne se lisait plus.
          className="absolute inset-x-6 z-40 flex flex-col items-center rounded-[24px] border border-sep bg-overlay px-6 py-7 shadow-[0_26px_70px_-18px_rgba(0,0,0,0.5)]"
          style={{ top: '30%' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04, y: -8 }}
          transition={springSheet}
        >
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
            <Sparks seed={done.at} count={14} spread={92} size={4} />
            <motion.span
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-canvas"
              initial={reduced ? false : { scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
            >
              {done.isWarmup ? (
                <IconCheck size={30} />
              ) : oceane ? (
                <IconFlower size={30} />
              ) : (
                <IconAnvil size={30} />
              )}
            </motion.span>
          </div>

          <p className="text-[20px] font-bold tracking-[-0.01em]">
            {done.isWarmup ? 'Échauffement bouclé' : 'Exercice bouclé'}
          </p>
          {names?.current && !done.isWarmup && (
            <p className="mt-0.5 text-center text-[14px] text-ink-2">{names.current}</p>
          )}
          <p className="mt-3 text-center text-[13px] text-ink-3">
            {nextIndex !== null
              ? names?.next
                ? `Suivant — ${names.next}`
                : 'Au suivant'
              : 'Toutes les séries sont faites'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
