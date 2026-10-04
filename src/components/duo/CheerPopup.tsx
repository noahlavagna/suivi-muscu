import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { partnerName, useDuo } from '../../state/duo';
import { unlockInfo } from '../../lib/duo';
import { springMicro } from '../../lib/springs';
import { IconHeart, IconX } from '../ui/Icons';

/** Au-delà, le reste est résumé : la liste complète est dans la fiche du binôme. */
const MAX_LINES = 3;

/**
 * Mots du binôme qui viennent de se révéler. Plus long qu'un toast et plus
 * personnel : il reste le temps d'être lu. Tous les mots en attente tiennent
 * dans une seule carte — un tap, un glissé vers le haut ou la croix la range
 * d'un coup, pour ne jamais laisser le haut de l'écran bloqué par une file.
 */
export function CheerPopup() {
  const incoming = useDuo((s) => s.incoming);
  const dismiss = useDuo((s) => s.dismissIncoming);
  const duo = useDuo((s) => s.duo);
  const me = useDuo((s) => s.me);
  const reduced = useReducedMotion();

  const first = incoming[0];
  const chars = incoming.slice(0, MAX_LINES).reduce((n, c) => n + c.text.length, 0);

  useEffect(() => {
    if (incoming.length === 0) return;
    const t = setTimeout(dismiss, Math.min(4000 + chars * 60, 12_000));
    return () => clearTimeout(t);
  }, [incoming.length, chars, dismiss]);

  const lines = incoming.slice(0, MAX_LINES);
  const extra = incoming.length - lines.length;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[75] flex justify-center px-4"
      style={{ top: 'calc(var(--safe-top) + 10px)' }}
    >
      <AnimatePresence>
        {first && (
          <motion.div
            key={first.id}
            role="status"
            className="glass pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded-[20px] p-3.5 text-left"
            initial={{ y: -80, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.92, pointerEvents: 'none' }}
            transition={springMicro}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.05 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -24 || info.velocity.y < -300) dismiss();
            }}
            onClick={dismiss}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-canvas">
              <IconHeart size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-accent">
                {partnerName(duo, me)}
                {incoming.length > 1
                  ? ` · ${incoming.length} mots`
                  : first.unlock !== 'now'
                    ? ` · mot débloqué ${unlockInfo(first.unlock).when}`
                    : ''}
              </span>
              {lines.map((c) => (
                <span key={c.id} className="mt-0.5 block text-[15px] font-medium leading-5">
                  {c.text}
                </span>
              ))}
              {extra > 0 && (
                <span className="mt-1 block text-[12px] text-ink-3">
                  + {extra} autre{extra > 1 ? 's' : ''} — à relire dans la fiche de ton binôme
                </span>
              )}
            </span>
            <button
              type="button"
              className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3"
              aria-label="Fermer"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
            >
              <IconX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
