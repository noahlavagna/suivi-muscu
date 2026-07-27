import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** 0 → 1 : part de vie restante */
  hpRatio: number;
  slain: boolean;
  size?: number;
}

/**
 * Le Colosse : golem angulaire qui se fissure à mesure qu'on le frappe.
 * Fissures révélées à 25 / 50 / 75 % de dégâts, yeux éteints quand terrassé.
 */
export function BossFigure({ hpRatio, slain, size = 96 }: Props) {
  const reduced = useReducedMotion();
  const damage = 1 - hpRatio;
  const rock = 'var(--bg-raised-2)';
  const edge = 'var(--separator)';

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden
      animate={slain ? { rotate: 4, opacity: 0.45 } : { rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      {/* Épaules */}
      <rect x="10" y="38" width="24" height="30" rx="7" fill={rock} stroke={edge} />
      <rect x="86" y="38" width="24" height="30" rx="7" fill={rock} stroke={edge} />
      {/* Bras */}
      <rect x="14" y="66" width="16" height="30" rx="6" fill={rock} stroke={edge} />
      <rect x="90" y="66" width="16" height="30" rx="6" fill={rock} stroke={edge} />
      {/* Torse */}
      <path d="M32 42h56l-7 52H39l-7-52Z" fill={rock} stroke={edge} />
      {/* Jambes */}
      <rect x="40" y="94" width="17" height="18" rx="5" fill={rock} stroke={edge} />
      <rect x="63" y="94" width="17" height="18" rx="5" fill={rock} stroke={edge} />
      {/* Tête */}
      <rect x="44" y="10" width="32" height="26" rx="7" fill={rock} stroke={edge} />

      {/* Yeux — braise vivante, éteints quand terrassé */}
      {!slain && (
        <motion.g
          animate={reduced ? undefined : { opacity: [1, 0.55, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <rect x="50" y="21" width="7" height="4" rx="1.5" fill="var(--accent)" />
          <rect x="63" y="21" width="7" height="4" rx="1.5" fill="var(--accent)" />
        </motion.g>
      )}
      {slain && (
        <g stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round">
          <path d="m50 20 6 5m0-5-6 5M64 20l6 5m0-5-6 5" />
        </g>
      )}

      {/* Fissures : la lumière de la forge transperce la pierre */}
      <g stroke="var(--accent)" strokeWidth="1.6" fill="none" strokeLinecap="round">
        {damage >= 0.25 && <path d="M60 44 55 56l7 8-4 10" opacity="0.85" />}
        {damage >= 0.5 && (
          <>
            <path d="M44 48 49 60l-6 9" opacity="0.85" />
            <path d="M76 46l-5 13 6 9" opacity="0.85" />
            <path d="M58 12l3 8-5 6" opacity="0.85" />
          </>
        )}
        {damage >= 0.75 && (
          <>
            <path d="M20 44l4 10-5 8M98 42l-4 11 5 9" opacity="0.85" />
            <path d="M48 94l4 9M70 94l-3 10M50 66l10 6 9-4" opacity="0.85" />
          </>
        )}
      </g>
    </motion.svg>
  );
}
