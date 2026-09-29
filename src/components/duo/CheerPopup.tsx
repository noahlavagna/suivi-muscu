import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { partnerName, useDuo } from '../../state/duo';
import { unlockInfo } from '../../lib/duo';
import { springMicro } from '../../lib/springs';
import { IconHeart } from '../ui/Icons';

/**
 * Mot du binôme qui vient de se révéler. Plus long qu'un toast et plus
 * personnel : il reste le temps d'être lu, et un tap le range.
 */
export function CheerPopup() {
  const current = useDuo((s) => s.incoming[0]);
  const dismiss = useDuo((s) => s.dismissIncoming);
  const duo = useDuo((s) => s.duo);
  const me = useDuo((s) => s.me);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, 4000 + current.text.length * 60);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[75] flex justify-center px-4"
      style={{ top: 'calc(var(--safe-top) + 10px)' }}
    >
      <AnimatePresence mode="wait">
        {current && (
          <motion.button
            type="button"
            key={current.id}
            className="glass pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded-[20px] p-3.5 text-left"
            initial={{ y: -80, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.92 }}
            transition={springMicro}
            onClick={dismiss}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-canvas">
              <IconHeart size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-accent">
                {partnerName(duo, me)}
                {current.unlock !== 'now' ? ` · mot débloqué ${unlockInfo(current.unlock).when}` : ''}
              </span>
              <span className="mt-0.5 block text-[15px] font-medium leading-5">{current.text}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
