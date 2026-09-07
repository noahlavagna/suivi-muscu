import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** 0 → 1 : part de l'objectif restant à faire (1 = rien de fait) */
  hpRatio: number;
  slain: boolean;
  size?: number;
}

/**
 * Le jardin du mois : trois tiges qui poussent et fleurissent à mesure que
 * le tonnage monte. Même donnée que le Colosse, récit inverse — on fait
 * apparaître quelque chose au lieu de le détruire.
 */
export function GardenFigure({ hpRatio, slain, size = 96 }: Props) {
  const reduced = useReducedMotion();
  const grown = Math.min(1, Math.max(0, 1 - hpRatio));

  // Trois fleurs qui s'ouvrent l'une après l'autre : 0-40 %, 30-70 %, 60-100 %
  const stems = [
    { x: 36, max: 46, from: 0, to: 0.4, r: 11 },
    { x: 60, max: 62, from: 0.3, to: 0.72, r: 13 },
    { x: 84, max: 40, from: 0.6, to: 1, r: 10 },
  ];
  const openness = (from: number, to: number) =>
    Math.min(1, Math.max(0, (grown - from) / (to - from)));

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      {/* Terre */}
      <path
        d="M14 104 Q60 96 106 104 L106 110 Q60 104 14 110 Z"
        fill="var(--bg-raised-2)"
        stroke="var(--separator)"
      />
      {stems.map((s, i) => {
        const o = openness(s.from, s.to);
        const height = 8 + s.max * o;
        const topY = 104 - height;
        return (
          <g key={i}>
            <path
              d={`M ${s.x} 104 Q ${s.x + (i === 1 ? 0 : i === 0 ? -6 : 6)} ${104 - height / 2} ${s.x} ${topY}`}
              fill="none"
              stroke="var(--lilac)"
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={0.85}
            />
            {/* Feuille */}
            {o > 0.25 && (
              <path
                d={`M ${s.x} ${topY + height * 0.5} q ${i === 2 ? -14 : 14} -4 ${i === 2 ? -16 : 16} 6 q ${i === 2 ? 12 : -12} 4 ${i === 2 ? 16 : -16} -6 Z`}
                fill="var(--lilac-dim)"
                stroke="var(--lilac)"
                strokeWidth={2}
              />
            )}
            {/* Corolle */}
            {o > 0.35 && (
              <motion.g
                initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 0.55 + 0.45 * o, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                style={{ originX: `${s.x}px`, originY: `${topY}px` }}
              >
                {[0, 60, 120, 180, 240, 300].map((a) => (
                  <ellipse
                    key={a}
                    cx={s.x}
                    cy={topY - s.r * 0.55}
                    rx={s.r * 0.42}
                    ry={s.r * 0.62}
                    fill="var(--accent-dim)"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    transform={`rotate(${a} ${s.x} ${topY})`}
                  />
                ))}
                <circle
                  cx={s.x}
                  cy={topY}
                  r={s.r * 0.32}
                  fill={slain ? 'var(--accent)' : 'var(--bg-raised)'}
                  stroke="var(--accent)"
                  strokeWidth={2}
                />
              </motion.g>
            )}
          </g>
        );
      })}
      {/* Le jardin complet scintille */}
      {slain && !reduced && (
        <motion.g
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M22 34v8M18 38h8" />
          <path d="M100 52v7M96.5 55.5h7" />
        </motion.g>
      )}
    </svg>
  );
}
