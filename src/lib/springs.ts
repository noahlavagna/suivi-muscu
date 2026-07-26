import type { Transition } from 'framer-motion';

/** Micro-interactions : tap, steppers, badges */
export const springMicro: Transition = { type: 'spring', stiffness: 400, damping: 30 };

/** Transitions de page */
export const springPage: Transition = { type: 'spring', stiffness: 300, damping: 32 };

/** Sheets modales */
export const springSheet: Transition = { type: 'spring', stiffness: 260, damping: 28 };

/** Éléments de liste (stagger d'entrée) */
export const springList: Transition = { type: 'spring', stiffness: 350, damping: 30 };

export const STAGGER_DELAY = 0.03;
export const STAGGER_MAX_ITEMS = 8;

export const staggerDelay = (index: number): number =>
  Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_DELAY;
