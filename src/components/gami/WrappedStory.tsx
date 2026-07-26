import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { WrappedData } from '../../gamification/wrapped';
import { useSettings } from '../../state/settings';
import { fmtNumber, fmtTonnage, kgToUnit } from '../../lib/format';
import { IconX } from '../ui/Icons';
import { Flame } from './Flame';

interface Slide {
  kicker: string;
  main: string;
  sub?: string;
}

const SLIDE_MS = 4200;

/** Story mensuelle plein écran, façon récap annuel — avance auto, tap pour naviguer. */
export function WrappedStory({ data, onClose }: { data: WrappedData; onClose: () => void }) {
  const unit = useSettings((s) => s.unit);
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  const slides = useMemo<Slide[]>(() => {
    const s: Slide[] = [
      {
        kicker: 'Ta forge en',
        main: data.monthLabel,
        sub: 'Voyons ce que le marteau a produit.',
      },
      {
        kicker: 'Tu as soulevé',
        main: fmtTonnage(data.tonnageKg, unit),
        sub: data.equivalentText ? `L’équivalent de ${data.equivalentText}.` : undefined,
      },
      {
        kicker: 'Au poste de travail',
        main: `${data.sessions} séance${data.sessions > 1 ? 's' : ''}`,
        sub: `${data.sets} séries frappées.`,
      },
    ];
    if (data.starExercise) {
      s.push({
        kicker: 'Ton exercice star',
        main: data.starExercise.name,
        sub: `${data.starExercise.sets} séries ce mois-ci.`,
      });
    }
    if (data.prEvents > 0) {
      s.push({
        kicker: 'Le métal a chanté',
        main: `${data.prEvents} record${data.prEvents > 1 ? 's' : ''}`,
        sub: data.heaviest
          ? `Jusqu’à ${fmtNumber(kgToUnit(data.heaviest.weightKg, unit))} ${unit} — ${data.heaviest.name}.`
          : undefined,
      });
    }
    s.push({
      kicker: data.monthLabel,
      main: 'La forge reste chaude.',
      sub: 'On remet ça ce mois-ci.',
    });
    return s;
  }, [data, unit]);

  // Avance automatique
  useEffect(() => {
    const t = setTimeout(() => {
      if (idx < slides.length - 1) setIdx(idx + 1);
      else onClose();
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [idx, slides.length, onClose]);

  const slide = slides[idx];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col bg-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Barres de progression */}
      <div
        className="flex gap-1.5 px-4"
        style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}
      >
        {slides.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-raised-2">
            <motion.div
              className="h-full origin-left rounded-full bg-accent"
              initial={{ scaleX: i < idx ? 1 : 0 }}
              animate={{ scaleX: i < idx ? 1 : i === idx ? 1 : 0 }}
              transition={
                i === idx ? { duration: SLIDE_MS / 1000, ease: 'linear' } : { duration: 0 }
              }
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="absolute right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-raised text-ink-2"
        style={{ top: 'calc(var(--safe-top) + 24px)' }}
        onClick={onClose}
        aria-label="Fermer le récap"
      >
        <IconX size={20} />
      </button>

      {/* Zones de tap : gauche = précédent, droite = suivant */}
      <div className="relative flex-1">
        <button
          type="button"
          className="absolute inset-y-0 left-0 z-10 w-1/3"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          aria-label="Précédent"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 z-10 w-2/3"
          onClick={() => (idx < slides.length - 1 ? setIdx(idx + 1) : onClose())}
          aria-label="Suivant"
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="flex h-full flex-col items-center justify-center px-8 text-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04, y: -12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="mb-6">
              <Flame lit size={44} />
            </div>
            <p className="mb-2 text-[15px] font-semibold uppercase tracking-widest text-accent">
              {slide.kicker}
            </p>
            <p className="tnum text-[44px] font-bold leading-[1.05] tracking-tight">
              {slide.main}
            </p>
            {slide.sub && <p className="mt-4 text-[17px] text-ink-2">{slide.sub}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  );
}
