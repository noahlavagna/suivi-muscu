import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { create } from 'zustand';
import { springSheet } from '../../lib/springs';

/** Nombre de sheets ouvertes — le shell recule quand > 0 (effet iOS). */
export const useSheetDepth = create<{ depth: number; change: (d: number) => void }>((set) => ({
  depth: 0,
  change: (d) => set((s) => ({ depth: Math.max(0, s.depth + d) })),
}));

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Poignée de drag visible et drag-to-dismiss */
  draggable?: boolean;
  ariaLabel: string;
}

export function Sheet({ open, onClose, children, draggable = true, ariaLabel }: SheetProps) {
  const reduced = useReducedMotion();
  const change = useSheetDepth((s) => s.change);

  useEffect(() => {
    if (!open) return;
    change(1);
    return () => change(-1);
  }, [open, change]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'var(--scrim)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={ariaLabel}
            className="glass relative max-h-[92dvh] rounded-t-[28px] pb-[max(16px,var(--safe-bottom))]"
            style={{ background: 'var(--bg-overlay)' }}
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={reduced ? { duration: 0.15 } : springSheet}
            drag={draggable && !reduced ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.03, bottom: 0.85 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            {draggable && (
              <div className="flex justify-center pb-1 pt-2.5">
                <div className="h-[5px] w-9 rounded-full bg-ink-3/40" />
              </div>
            )}
            <div className="scroll-y max-h-[calc(92dvh-40px)] overflow-y-auto px-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
