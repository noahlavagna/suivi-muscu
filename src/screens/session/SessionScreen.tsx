import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { useSession } from '../../state/session';
import { useNow } from '../../lib/useNow';
import { fmtTimer } from '../../lib/format';
import { springPage } from '../../lib/springs';
import { useMeasureWidth } from '../../components/charts/useMeasureWidth';
import { Pressable } from '../../components/ui/Pressable';
import { Sheet } from '../../components/ui/Sheet';
import { IconChevronLeft, IconChevronRight } from '../../components/ui/Icons';
import { ExerciseCard } from './ExerciseCard';
import { RestBar } from './RestBar';
import { ExerciseDoneOverlay } from './ExerciseDoneOverlay';
import { IconShieldAlert } from '../../components/ui/Icons';
import { SafetySheet } from '../../oceane/SafetySheet';
import { useSettings } from '../../state/settings';

export function SessionScreen() {
  const name = useSession((s) => s.name);
  const startedAt = useSession((s) => s.startedAt);
  const entries = useSession((s) => s.entries);
  const index = useSession((s) => s.index);
  const setIndex = useSession((s) => s.setIndex);
  const finish = useSession((s) => s.finish);
  const abandon = useSession((s) => s.abandon);
  const now = useNow(1000);
  const reduced = useReducedMotion();
  const { ref, width } = useMeasureWidth<HTMLDivElement>();
  const [endSheet, setEndSheet] = useState(false);
  const [safety, setSafety] = useState(false);
  // Les signaux d'arrêt doivent rester à un doigt pendant toute la séance
  const oceane = useSettings((st) => st.profile === 'oceane');

  /*
   * Pager : la position est pilotée à la main plutôt que par `animate={{ x }}`.
   *
   * Avec la prop `animate`, un glissé annulé (trop court, ou vers l'exercice
   * qui n'existe pas au-delà du dernier) laissait la piste immobilisée là où
   * le doigt l'avait lâchée : l'index ne changeant pas, Framer n'avait aucune
   * raison de rejouer l'animation, et l'écran restait de travers jusqu'au
   * prochain changement d'exercice. On recale donc explicitement à chaque fin
   * de glissé, y compris quand l'index ne bouge pas.
   */
  const x = useMotionValue(0);
  const dragging = useRef(false);
  // Même ressort que les transitions de page, sous la forme attendue par `animate`
  const pageSpring = { type: 'spring', stiffness: 300, damping: 32 } as const;

  const slideTo = (i: number) => {
    if (width <= 0) return;
    if (reduced) x.set(-i * width);
    else animate(x, -i * width, pageSpring);
  };

  useEffect(() => {
    if (width <= 0 || dragging.current) return;
    if (reduced) x.set(-index * width);
    else {
      const controls = animate(x, -index * width, pageSpring);
      return () => controls.stop();
    }
  }, [index, width, reduced, x]);

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const allDone = totalSets > 0 && doneSets === totalSets;

  return (
    <div className="relative flex h-full flex-col bg-canvas">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}
      >
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold leading-6">{name}</h1>
          <p className="tnum text-[13px] text-ink-2">
            {fmtTimer((now - startedAt) / 1000)} · {doneSets}/{totalSets} séries
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {oceane && (
            <Pressable
              className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-negative"
              onClick={() => setSafety(true)}
              aria-label="Signaux d’arrêt"
            >
              <IconShieldAlert size={19} />
            </Pressable>
          )}
          <Pressable
            className={`rounded-full px-4 py-2 text-[15px] font-semibold ${
              allDone ? 'bg-accent text-canvas' : 'bg-raised text-accent'
            }`}
            onClick={() => setEndSheet(true)}
          >
            Terminer
          </Pressable>
        </div>
      </div>

      {/* Pager d'exercices */}
      <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
        {width > 0 && (
          <motion.div
            className="flex h-full"
            style={{ width: width * entries.length, x }}
            drag={entries.length > 1 ? 'x' : false}
            dragDirectionLock
            dragMomentum={false}
            dragConstraints={{ left: -(entries.length - 1) * width, right: 0 }}
            dragElastic={0.12}
            onDragStart={() => {
              dragging.current = true;
            }}
            onDragEnd={(_, info) => {
              dragging.current = false;
              const threshold = width / 4;
              const forward = info.offset.x < -threshold || info.velocity.x < -500;
              const back = info.offset.x > threshold || info.velocity.x > 500;
              const next = Math.max(
                0,
                Math.min(entries.length - 1, index + (forward ? 1 : back ? -1 : 0)),
              );
              slideTo(next);
              if (next !== index) setIndex(next);
            }}
          >
            {entries.map((entry, i) => (
              <div key={i} className="h-full shrink-0" style={{ width }}>
                <ExerciseCard entry={entry} entryIndex={i} />
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Barre de contrôle (remplace la tab bar en séance) */}
      <div
        className="glass absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-4 pt-2"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 8px)' }}
      >
        <Pressable
          className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-raised-2 text-ink disabled:opacity-30"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          aria-label="Exercice précédent"
        >
          <IconChevronLeft size={22} />
        </Pressable>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            {entries.map((e, i) => {
              const done = e.sets.every((s) => s.done) && e.sets.length > 0;
              return (
                <motion.span
                  key={i}
                  className={`rounded-full ${
                    done ? 'bg-accent' : i === index ? 'bg-ink' : 'bg-ink-3/40'
                  }`}
                  animate={{ width: i === index ? 18 : 6, height: 6 }}
                  transition={springPage}
                />
              );
            })}
          </div>
          <span className="tnum text-[11px] font-medium text-ink-3">
            Exercice {index + 1}/{entries.length}
          </span>
        </div>
        <Pressable
          className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-raised-2 text-ink disabled:opacity-30"
          disabled={index === entries.length - 1}
          onClick={() => setIndex(index + 1)}
          aria-label="Exercice suivant"
        >
          <IconChevronRight size={22} />
        </Pressable>
      </div>

      <ExerciseDoneOverlay />
      <RestBar />
      <SafetySheet open={safety} onClose={() => setSafety(false)} />

      {/* Fin de séance */}
      <Sheet open={endSheet} onClose={() => setEndSheet(false)} ariaLabel="Terminer la séance">
        <div className="pb-2 pt-1">
          <h2 className="mb-1 text-[20px] font-bold">Terminer la séance ?</h2>
          <p className="mb-5 text-[14px] text-ink-2">
            {doneSets}/{totalSets} séries validées · {fmtTimer((now - startedAt) / 1000)}
          </p>
          <Pressable
            className="mb-2.5 w-full rounded-[14px] bg-accent py-3.5 text-[17px] font-semibold text-canvas"
            onClick={() => {
              setEndSheet(false);
              void finish();
            }}
          >
            Terminer et enregistrer
          </Pressable>
          <Pressable
            className="mb-2.5 w-full rounded-[14px] bg-raised-2 py-3.5 text-[17px] font-semibold text-negative"
            onClick={() => {
              if (window.confirm('Abandonner et supprimer cette séance ?')) {
                setEndSheet(false);
                void abandon();
              }
            }}
          >
            Abandonner (supprimer)
          </Pressable>
          <Pressable
            className="w-full rounded-[14px] py-3.5 text-[17px] font-semibold text-ink-2"
            onClick={() => setEndSheet(false)}
          >
            Continuer la séance
          </Pressable>
        </div>
      </Sheet>
    </div>
  );
}
