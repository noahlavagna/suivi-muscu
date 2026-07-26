import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToasts } from '../state/toasts';
import { BadgeIcon } from './BadgeIcon';
import { springMicro } from '../lib/springs';

/** Célébrations (PR, badge, contrat) : pilule glass en haut, une à la fois. */
export function ToastHub() {
  const current = useToasts((s) => s.queue[0]);
  const shift = useToasts((s) => s.shift);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(shift, 2600);
    return () => clearTimeout(t);
  }, [current, shift]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center"
      style={{ top: 'calc(var(--safe-top) + 10px)' }}
    >
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.key}
            className="glass flex items-center gap-2.5 rounded-full py-2.5 pl-3.5 pr-5"
            initial={{ y: -56, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -56, opacity: 0, scale: 0.9 }}
            transition={springMicro}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-dim text-accent">
              <BadgeIcon icon={current.icon} size={15} />
            </span>
            <div>
              <p className="text-[13px] font-bold leading-4">{current.title}</p>
              {current.sub && <p className="text-[11px] leading-4 text-ink-2">{current.sub}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
