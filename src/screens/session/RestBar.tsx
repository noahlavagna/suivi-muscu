import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSession } from '../../state/session';
import { useNow } from '../../lib/useNow';
import { fmtTimer } from '../../lib/format';
import { sounds } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { springSheet, springMicro } from '../../lib/springs';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Pressable } from '../../components/ui/Pressable';
import { IconSkip, IconX } from '../../components/ui/Icons';

/**
 * Timer de repos. Le temps restant est TOUJOURS `endsAt - Date.now()` :
 * verrouiller l'iPhone ou changer d'app ne le fausse pas.
 */
export function RestBar() {
  const rest = useSession((s) => s.rest);
  const skipRest = useSession((s) => s.skipRest);
  const clearRest = useSession((s) => s.clearRest);
  const adjustRest = useSession((s) => s.adjustRest);
  const now = useNow(250, rest !== null);
  const [expanded, setExpanded] = useState(false);
  const firedFor = useRef<number>(0);
  const reduced = useReducedMotion();

  const remaining = rest ? (rest.endsAt - now) / 1000 : 0;
  const progress = rest ? Math.max(0, remaining / rest.totalSec) : 0;

  // Fin de repos : son + vibration une seule fois, puis la barre se retire.
  useEffect(() => {
    if (!rest || remaining > 0 || firedFor.current === rest.endsAt) return;
    firedFor.current = rest.endsAt;
    const lateMs = Date.now() - rest.endsAt;
    if (lateMs < 3000) {
      sounds.restEnd();
      haptics.restEnd();
    }
    const t = setTimeout(() => {
      setExpanded(false);
      clearRest();
    }, 1400);
    return () => clearTimeout(t);
  }, [rest, remaining, clearRest]);

  useEffect(() => {
    if (!rest) setExpanded(false);
  }, [rest]);

  const timeText = fmtTimer(remaining);
  const done = rest !== null && remaining <= 0;

  return (
    <>
      {/* Barre persistante au-dessus de la barre de contrôle */}
      <AnimatePresence>
        {rest && !expanded && (
          <motion.div
            className="absolute inset-x-4 z-30"
            style={{ bottom: 'calc(var(--safe-bottom) + 72px)' }}
            initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={springMicro}
          >
            <div className="glass flex items-center gap-3 rounded-[18px] py-2 pl-3 pr-2">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3"
                onClick={() => setExpanded(true)}
                aria-label="Agrandir le timer de repos"
              >
                <div className="relative h-9 w-9 shrink-0">
                  <ProgressRing progress={progress} size={36} strokeWidth={3} />
                </div>
                <span
                  className={`tnum text-[20px] font-semibold ${done ? 'text-accent' : 'text-ink'}`}
                >
                  {done ? 'Go !' : timeText}
                </span>
                <span className="text-[13px] text-ink-3">repos</span>
              </button>
              <Pressable
                className="rounded-[10px] bg-raised-2 px-3 py-2 text-[13px] font-semibold text-ink-2"
                onClick={() => adjustRest(-15)}
              >
                −15
              </Pressable>
              <Pressable
                className="rounded-[10px] bg-raised-2 px-3 py-2 text-[13px] font-semibold text-ink-2"
                onClick={() => adjustRest(15)}
              >
                +15
              </Pressable>
              <Pressable
                className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-dim text-accent"
                onClick={skipRest}
                aria-label="Passer le repos"
              >
                <IconSkip size={18} />
              </Pressable>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plein écran */}
      {createPortal(
        <AnimatePresence>
          {rest && expanded && (
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
            >
              <Pressable
                className="absolute right-5 flex h-11 w-11 items-center justify-center rounded-full bg-raised text-ink-2"
                style={{ top: 'calc(var(--safe-top) + 12px)' }}
                onClick={() => setExpanded(false)}
                aria-label="Réduire le timer"
              >
                <IconX size={20} />
              </Pressable>
              <p className="mb-6 text-[15px] font-medium uppercase tracking-widest text-ink-3">
                Repos
              </p>
              <div className="relative">
                <ProgressRing progress={progress} size={240} strokeWidth={7} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`tnum text-[56px] font-bold leading-none tracking-tight ${done ? 'text-accent' : 'text-ink'}`}
                  >
                    {done ? 'Go !' : timeText}
                  </span>
                  <span className="tnum mt-2 text-[14px] text-ink-3">
                    sur {fmtTimer(rest.totalSec)}
                  </span>
                </div>
              </div>
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
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
