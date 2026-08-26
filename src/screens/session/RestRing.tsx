import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** Fin du repos (ms) — sert de clé : la changer relance le déroulé */
  endsAt: number;
  totalSec: number;
  size: number;
  strokeWidth?: number;
}

/**
 * Anneau du minuteur de repos.
 *
 * Il ne suit pas le rythme de rendu de React : une seule animation est lancée
 * par cycle, sur la durée exacte qui reste, et se déroule ensuite toute seule.
 *
 * L'anneau générique (`ProgressRing`) passait par une transition CSS relancée
 * à chaque tick — il visait donc en permanence une valeur déjà vieille d'un
 * tick, et retardait visiblement sur le chiffre. Ici, chiffre et anneau
 * atteignent zéro au même instant parce qu'ils lisent la même horloge.
 */
export function RestRing({ endsAt, totalSec, size, strokeWidth = 4 }: Props) {
  const reduced = useReducedMotion();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  // Lu au montage seulement : ensuite l'animation vit sa vie
  const remaining = Math.max(0, (endsAt - Date.now()) / 1000);
  const fraction = totalSec > 0 ? Math.min(1, Math.max(0, remaining / totalSec)) : 0;

  const common = {
    cx: size / 2,
    cy: size / 2,
    r,
    fill: 'none',
    strokeWidth,
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle {...common} stroke="currentColor" className="text-sep" />
      <motion.circle
        {...common}
        stroke="currentColor"
        strokeLinecap="round"
        className="text-accent"
        strokeDasharray={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDashoffset: circumference * (1 - fraction) }}
        animate={{ strokeDashoffset: circumference }}
        transition={reduced ? { duration: 0 } : { duration: remaining, ease: 'linear' }}
      />
    </svg>
  );
}
