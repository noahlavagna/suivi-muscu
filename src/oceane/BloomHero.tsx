import { motion, useReducedMotion } from 'framer-motion';
import type { GamiState } from '../gamification/useGami';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

/**
 * Carte héro du profil Océane — l'équivalent de la Forge, en fleuri.
 *
 * Mêmes données (niveau, XP, semaines d'affilée, séances de la semaine) : on
 * ne change que ce qu'elles racontent. La fleur s'ouvre avec le niveau, ce
 * qui donne un repère visuel là où « 1 240 XP » ne dit rien à personne.
 */

const TITLES: [number, string][] = [
  [1, 'Première pousse'],
  [3, 'Bourgeon'],
  [6, 'Jeune tige'],
  [10, 'En bouton'],
  [15, 'Première fleur'],
  [21, 'Pleine floraison'],
  [28, 'Jardin en fête'],
  [36, 'Serre tropicale'],
  [50, 'Jardin légendaire'],
];

export function bloomTitle(level: number): string {
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return title;
}

/** Fleur dont le nombre de pétales ouverts suit le niveau (3 → 8). */
function BloomFlower({ level, progress }: { level: number; progress: number }) {
  const reduced = useReducedMotion();
  const petals = Math.min(8, 3 + Math.floor(level / 3));
  return (
    <div className="relative h-[58px] w-[58px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {Array.from({ length: petals }, (_, i) => {
          const a = (360 / petals) * i;
          return (
            <motion.ellipse
              key={i}
              cx={50}
              cy={28}
              rx={12}
              ry={18}
              fill="var(--accent-dim)"
              stroke="var(--accent)"
              strokeWidth={3}
              transform={`rotate(${a} 50 50)`}
              initial={reduced ? false : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduced ? 0 : i * 0.04, type: 'spring', stiffness: 220, damping: 18 }}
              style={{ originX: '50px', originY: '50px' }}
            />
          );
        })}
        {/* Cœur : se remplit avec la progression dans le niveau */}
        <circle cx={50} cy={50} r={15} fill="var(--bg-raised)" stroke="var(--accent)" strokeWidth={3} />
        <motion.circle
          cx={50}
          cy={50}
          r={15}
          fill="var(--accent)"
          initial={false}
          animate={{ scale: 0.25 + 0.75 * Math.min(1, progress) }}
          transition={{ type: 'spring', stiffness: 160, damping: 24 }}
          style={{ originX: '50px', originY: '50px' }}
        />
      </svg>
    </div>
  );
}

export function BloomHero({ gami }: { gami: GamiState }) {
  const { xp, streak } = gami;
  const progress = xp.xpForNext > 0 ? xp.xpInLevel / xp.xpForNext : 0;

  return (
    <div className="grad-bloom glow-accent mb-4 rounded-[var(--radius-card)] bg-raised p-4">
      <div className="flex items-center gap-3.5">
        <BloomFlower level={xp.level} progress={progress} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold leading-5">{bloomTitle(xp.level)}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-2">
            Niveau {xp.level} · <AnimatedNumber value={xp.xpInLevel} /> /{' '}
            {xp.xpForNext.toLocaleString('fr-FR')} XP
          </p>
          <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-raised-2">
            <motion.div
              className="h-full origin-left rounded-full bg-accent"
              initial={false}
              animate={{ scaleX: Math.min(1, progress) }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="tnum text-[20px] font-bold leading-6 text-accent">{streak.weeks}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-3">
            {streak.weeks > 1 ? 'semaines' : 'semaine'}
          </span>
        </div>
      </div>

      {streak.thisWeekPlanned > 0 && (
        <div className="mt-3.5 flex items-center gap-2 border-t border-sep pt-3">
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: streak.thisWeekPlanned }, (_, i) => (
              <div
                key={i}
                className="h-[6px] flex-1 rounded-full"
                style={{
                  background: i < streak.thisWeekDone ? 'var(--accent)' : 'var(--separator)',
                }}
              />
            ))}
          </div>
          <span className="tnum text-[12px] font-semibold text-ink-2">
            {streak.thisWeekDone}/{streak.thisWeekPlanned}
          </span>
          <span className="text-[12px] text-ink-3">cette semaine</span>
        </div>
      )}
    </div>
  );
}
