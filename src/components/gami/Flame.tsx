import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  size?: number;
  /** Streak active (au moins 1 semaine, ou semaine courante validée) */
  lit: boolean;
  /** La flamme vacille : semaine en danger */
  danger?: boolean;
}

/** Flamme de la forge — remplie, avec un flicker organique (transform uniquement). */
export function Flame({ size = 30, lit, danger = false }: Props) {
  const reduced = useReducedMotion();
  const animate =
    lit && !reduced
      ? danger
        ? { scale: [1, 0.92, 1.02, 0.9, 1], rotate: [0, -3, 2, -2, 0], opacity: [1, 0.55, 0.9, 0.5, 1] }
        : { scale: [1, 1.06, 0.97, 1.04, 1], rotate: [0, -2, 1.5, -1, 0] }
      : undefined;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      animate={animate}
      transition={{ repeat: Infinity, duration: danger ? 1.1 : 2, ease: 'easeInOut' }}
      style={{ transformOrigin: '50% 85%' }}
      aria-hidden
    >
      <path
        d="M12 22c-4.2 0-7-2.7-7-6.4 0-2.8 1.8-4.9 3.2-6.7C9.2 7.6 10.3 6.1 10.7 4c2.7 1.7 8.3 6.5 8.3 11.6 0 3.7-2.8 6.4-7 6.4Z"
        fill={lit ? 'var(--accent)' : 'var(--separator)'}
      />
      {lit && (
        <path
          d="M12 22c-2 0-3.3-1.3-3.3-3.1 0-1.4 1-2.7 1.8-3.6.5-.6.9-1.1 1.1-1.9 1.3 1 3.7 3 3.7 5.5 0 1.8-1.3 3.1-3.3 3.1Z"
          fill="color-mix(in oklab, var(--accent) 45%, white)"
        />
      )}
    </motion.svg>
  );
}
