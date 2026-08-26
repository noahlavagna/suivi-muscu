import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSession } from '../../state/session';
import { useNow } from '../../lib/useNow';
import { fmtCountdown, fmtTimer } from '../../lib/format';
import { sounds } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { springSheet, springMicro } from '../../lib/springs';
import { RestRing } from './RestRing';
import { Pressable } from '../../components/ui/Pressable';
import { Sparks } from '../../components/ui/Sparks';
import { IconSkip, IconX } from '../../components/ui/Icons';

/**
 * Timer de repos. Le temps restant est TOUJOURS `endsAt - Date.now()` :
 * verrouiller l'iPhone ou changer d'app ne le fausse pas.
 *
 * Trois états, du plus discret au plus impossible à manquer :
 *  - barre compacte pendant le repos ;
 *  - décompte pulsé sur les 5 dernières secondes ;
 *  - plein écran à zéro, jusqu'à ce qu'on le congédie.
 */

const COUNTDOWN_FROM = 5;
const GO_AUTOCLOSE_MS = 2600;

export function RestBar() {
  const rest = useSession((s) => s.rest);
  const skipRest = useSession((s) => s.skipRest);
  const clearRest = useSession((s) => s.clearRest);
  const adjustRest = useSession((s) => s.adjustRest);
  const now = useNow(200, rest !== null);
  const [expanded, setExpanded] = useState(false);
  const [goAt, setGoAt] = useState<number | null>(null);
  const firedFor = useRef<number>(0);
  const tickedAt = useRef<number>(-1);
  const reduced = useReducedMotion();

  const remaining = rest ? (rest.endsAt - now) / 1000 : 0;
  const done = rest !== null && remaining <= 0;
  const secsLeft = Math.max(0, Math.ceil(remaining - 0.001));
  const counting = rest !== null && !done && secsLeft <= COUNTDOWN_FROM;

  // Décompte : un tick sec par seconde sur la fin, une seule fois chacun
  useEffect(() => {
    if (!counting || tickedAt.current === secsLeft) return;
    tickedAt.current = secsLeft;
    sounds.restTick();
    haptics.tick();
  }, [counting, secsLeft]);

  useEffect(() => {
    if (!rest) tickedAt.current = -1;
  }, [rest]);

  /** Zéro : alarme, puis le plein écran s'impose (voir l'effet suivant). */
  useEffect(() => {
    if (!rest || remaining > 0 || firedFor.current === rest.endsAt) return;
    firedFor.current = rest.endsAt;
    // Revenu longtemps après (téléphone verrouillé) : inutile de sonner
    if (Date.now() - rest.endsAt > 3000) {
      clearRest();
      return;
    }
    sounds.restEnd();
    haptics.restEnd();
    setGoAt(Date.now());
  }, [rest, remaining, clearRest]);

  /**
   * Fermeture du « Go ». L'effet est isolé et ne dépend que de `goAt` : monté
   * sur l'effet d'alarme ci-dessus, il serait démonté puis remonté à chaque
   * tick du chrono, son `clearTimeout` annulerait la fermeture, et l'écran
   * resterait indéfiniment.
   */
  useEffect(() => {
    if (goAt === null) return;
    const t = setTimeout(() => {
      setExpanded(false);
      setGoAt(null);
      clearRest();
    }, GO_AUTOCLOSE_MS);
    return () => clearTimeout(t);
  }, [goAt, clearRest]);

  useEffect(() => {
    if (!rest) {
      setExpanded(false);
      setGoAt(null);
    }
  }, [rest]);

  const dismiss = () => {
    setExpanded(false);
    setGoAt(null);
    clearRest();
  };

  const timeText = fmtCountdown(remaining);
  const showFull = rest !== null && (expanded || done);

  return (
    <>
      {/* Barre compacte — au-dessus de la barre de contrôle */}
      <AnimatePresence>
        {rest && !showFull && (
          <motion.div
            className="absolute inset-x-3 z-30"
            style={{ bottom: 'calc(var(--safe-bottom) + 72px)' }}
            initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={springMicro}
          >
            <motion.div
              className={`glass flex items-center gap-2.5 rounded-[22px] p-2.5 ${
                counting ? 'glow-accent' : ''
              }`}
              animate={
                counting && !reduced ? { scale: [1, 1.035, 1] } : { scale: 1 }
              }
              transition={
                counting && !reduced
                  ? { duration: 1, repeat: Infinity, ease: 'easeInOut' }
                  : springMicro
              }
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3"
                onClick={() => setExpanded(true)}
                aria-label="Agrandir le timer de repos"
              >
                {/* Un seul chiffre, cerclé par sa propre jauge */}
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                  <RestRing
                    key={`${rest.endsAt}-${rest.totalSec}`}
                    endsAt={rest.endsAt}
                    totalSec={rest.totalSec}
                    size={64}
                    strokeWidth={5}
                  />
                  <span
                    className={`tnum absolute inset-0 flex items-center justify-center text-[19px] font-bold tracking-tight ${
                      counting ? 'text-accent' : 'text-ink'
                    }`}
                  >
                    {timeText}
                  </span>
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-3">
                  Repos
                </span>
              </button>
              <Pressable
                className="rounded-[10px] bg-raised-2 px-2.5 py-2 text-[13px] font-semibold text-ink-2"
                onClick={() => adjustRest(-15)}
              >
                −15
              </Pressable>
              <Pressable
                className="rounded-[10px] bg-raised-2 px-2.5 py-2 text-[13px] font-semibold text-ink-2"
                onClick={() => adjustRest(15)}
              >
                +15
              </Pressable>
              <Pressable
                className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent-dim text-accent"
                onClick={skipRest}
                aria-label="Passer le repos"
              >
                <IconSkip size={18} />
              </Pressable>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plein écran — agrandi à la demande, imposé à zéro */}
      {createPortal(
        <AnimatePresence>
          {showFull && rest && (
            <motion.div
              className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-canvas/95"
              style={{
                backdropFilter: 'blur(20px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0.15 } : springSheet}
              onClick={done ? dismiss : undefined}
            >
              {/* Pulsation de fond au « Go » : l'écran entier réagit */}
              {done && !reduced && (
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, var(--accent-dim), transparent 62%)',
                  }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: [0, 1, 0.45, 1, 0.6], scale: 1 }}
                  transition={{ duration: 1.6, ease: 'easeOut' }}
                />
              )}

              {!done && (
                <Pressable
                  className="absolute right-5 flex h-11 w-11 items-center justify-center rounded-full bg-raised text-ink-2"
                  style={{ top: 'calc(var(--safe-top) + 12px)' }}
                  onClick={() => setExpanded(false)}
                  aria-label="Réduire le timer"
                >
                  <IconX size={20} />
                </Pressable>
              )}

              <p className="mb-6 text-[15px] font-medium uppercase tracking-widest text-ink-3">
                {done ? 'Repos terminé' : 'Repos'}
              </p>

              <div className="relative flex items-center justify-center">
                {done ? (
                  <>
                    <Sparks seed={rest.endsAt} count={18} spread={220} size={5} />
                    <motion.span
                      className="tnum text-[76px] font-bold leading-none tracking-tight text-accent"
                      initial={reduced ? false : { scale: 0.55, opacity: 0 }}
                      animate={
                        reduced
                          ? { scale: 1, opacity: 1 }
                          : { scale: [0.55, 1.16, 1], opacity: 1 }
                      }
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                      GO
                    </motion.span>
                  </>
                ) : (
                  <>
                    <RestRing
                      key={`${rest.endsAt}-${rest.totalSec}`}
                      endsAt={rest.endsAt}
                      totalSec={rest.totalSec}
                      size={260}
                      strokeWidth={8}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        key={counting ? secsLeft : 'run'}
                        className={`tnum text-[64px] font-bold leading-none tracking-tight ${
                          counting ? 'text-accent' : 'text-ink'
                        }`}
                        initial={counting && !reduced ? { scale: 1.35, opacity: 0.4 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {timeText}
                      </motion.span>
                      <span className="tnum mt-2 text-[14px] text-ink-3">
                        sur {fmtTimer(rest.totalSec)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {done ? (
                <Pressable
                  className="mt-12 rounded-[16px] bg-accent px-8 py-4 text-[17px] font-bold text-canvas"
                  onClick={dismiss}
                >
                  À la série suivante
                </Pressable>
              ) : (
                <div className="mt-10 flex items-center gap-4">
                  <Pressable
                    className="rounded-[14px] bg-raised px-5 py-3 text-[17px] font-semibold text-ink"
                    onClick={() => adjustRest(-15)}
                  >
                    −15 s
                  </Pressable>
                  <Pressable
                    className="rounded-[14px] bg-raised px-5 py-3 text-[17px] font-semibold text-ink"
                    onClick={() => adjustRest(15)}
                  >
                    +15 s
                  </Pressable>
                  <Pressable
                    className="rounded-[14px] bg-accent px-5 py-3 text-[17px] font-semibold text-canvas"
                    onClick={() => {
                      setExpanded(false);
                      skipRest();
                    }}
                  >
                    Passer
                  </Pressable>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
