import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  /** Change de valeur pour rejouer la gerbe */
  seed: number;
  count?: number;
  /** Rayon de projection, en pixels */
  spread?: number;
  size?: number;
  /** Onde de choc circulaire en plus des étincelles */
  ring?: boolean;
  className?: string;
}

/**
 * Gerbe d'étincelles — le métal frappé.
 *
 * Purement décoratif et non interactif : `pointer-events: none` et positionné
 * en absolu au centre de son parent, pour se superposer sans rien déplacer.
 * N'anime que `transform` et `opacity`, donc rien ne repasse par le layout.
 */
export function Sparks({
  seed,
  count = 10,
  spread = 46,
  size = 3,
  ring = true,
  className = '',
}: Props) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <span
      className={`pointer-events-none absolute left-1/2 top-1/2 z-10 ${className}`}
      aria-hidden
    >
      {ring && (
        <motion.span
          key={`ring-${seed}`}
          className="absolute rounded-full border border-accent"
          style={{ width: spread, height: spread, marginLeft: -spread / 2, marginTop: -spread / 2 }}
          initial={{ scale: 0.3, opacity: 0.9 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      {Array.from({ length: count }, (_, i) => {
        // Angles régulièrement répartis, décalés par le seed : jamais deux
        // gerbes identiques, mais toujours équilibrées autour du centre.
        const angle = (i / count) * Math.PI * 2 + (seed % 17) * 0.37;
        const dist = spread * (0.55 + ((i * 7 + seed) % 10) / 18);
        return (
          <motion.span
            key={`${seed}-${i}`}
            className="absolute rounded-full bg-accent"
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              // Léger biais vers le bas en fin de course : les braises retombent
              y: Math.sin(angle) * dist + dist * 0.22,
              opacity: 0,
              scale: 0.4,
            }}
            transition={{ duration: 0.5 + (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </span>
  );
}
