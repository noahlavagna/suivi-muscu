import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LevelUp } from '../../db/blocks';
import { setBlockWeek } from '../../db/blocks';
import { restLabel } from '../../lib/block';
import { sounds } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { Pressable } from '../ui/Pressable';
import { Sparks } from '../ui/Sparks';
import { IconAnvil, IconChevronRight, IconFlower, IconTimer, IconZap } from '../ui/Icons';
import { useSettings } from '../../state/settings';
import { springSheet } from '../../lib/springs';

/**
 * Montée de palier — le seul moment de l'app où l'écran entier s'arrête.
 *
 * Ne s'ouvre qu'une fois le palier réellement bouclé, donc au plus quatre fois
 * sur tout le bloc : c'est ce qui lui garde sa valeur. Rien n'est décidé sans
 * l'utilisateur, la montée reste un choix.
 */
export function LevelUpCeremony({
  levelUp,
  onClose,
}: {
  levelUp: LevelUp;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState(false);
  // Chez Océane un palier est une semaine du cycle, et l'enclume n'a rien à y faire
  const oceane = useSettings((s) => s.profile === 'oceane');
  const step = oceane ? 'semaine' : 'palier';
  const restUnchanged =
    levelUp.fromRestSec === levelUp.toRestSec && levelUp.toRestSecMax === undefined;

  useEffect(() => {
    sounds.levelUp();
    haptics.levelUp();
  }, []);

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    await setBlockWeek(levelUp.blockId, levelUp.to);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-7"
      style={{ background: 'var(--bg-canvas)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Halo de forge qui respire derrière la scène */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, var(--accent-dim), transparent 65%)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.5, 1, 0.7], scale: 1 }}
          transition={{ duration: 2.4, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}

      <motion.p
        className="mb-1 text-[13px] font-semibold uppercase tracking-[0.2em] text-ink-3"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {levelUp.blockName}
      </motion.p>

      <div className="relative my-7 flex items-center justify-center">
        <Sparks seed={levelUp.to} count={22} spread={260} size={5} />
        <motion.span
          className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-canvas"
          initial={reduced ? false : { scale: 0.3, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          {oceane ? <IconFlower size={46} /> : <IconAnvil size={46} />}
        </motion.span>
      </div>

      <motion.h1
        className="text-center text-[30px] font-bold leading-9 tracking-[-0.02em]"
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSheet, delay: 0.18 }}
      >
        {oceane ? `Semaine ${levelUp.from} terminée !` : 'Prêt à passer au niveau supérieur ?'}
      </motion.h1>
      <motion.p
        className="mt-2.5 max-w-[320px] text-center text-[15px] leading-6 text-ink-2"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {oceane
          ? `Tes deux séances sont faites. La semaine ${levelUp.to} du cycle t’attend — regarde ce qui change.`
          : `Palier ${levelUp.from} bouclé — toutes ses séances sont faites. Le palier ${levelUp.to} monte l’intensité.`}
      </motion.p>

      {/* Ce qui change concrètement */}
      <motion.div
        className="mt-7 w-full max-w-[330px] overflow-hidden rounded-[18px] bg-raised"
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSheet, delay: 0.38 }}
      >
        <Change
          icon={oceane ? <IconFlower size={17} /> : <IconZap size={17} />}
          label={oceane ? 'Phase' : 'Intensité'}
          from={levelUp.fromRir}
          to={levelUp.toRir}
          last={restUnchanged}
        />
        {/* La récup d'Océane est propre à chaque exercice : rien ne change au
            passage de semaine, et une ligne « 1'30 → 1'30 » ne dirait rien. */}
        {!restUnchanged && (
          <Change
            icon={<IconTimer size={17} />}
            label="Récup"
            from={levelUp.fromRestSec != null ? restLabel(levelUp.fromRestSec) : undefined}
            to={
              levelUp.toRestSec != null
                ? restLabel(levelUp.toRestSec, levelUp.toRestSecMax)
                : undefined
            }
            last
          />
        )}
      </motion.div>

      {levelUp.toIsFinal && (
        <motion.p
          className="mt-4 text-center text-[13px] text-accent"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {oceane
            ? 'Dernière semaine du cycle — compare ton carnet à la semaine 3.'
            : 'Dernier palier — c’est le programme final, à conserver.'}
        </motion.p>
      )}

      <motion.div
        className="mt-9 w-full max-w-[330px]"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSheet, delay: 0.48 }}
      >
        <Pressable
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-accent py-4 text-[17px] font-bold text-canvas disabled:opacity-60"
          disabled={busy}
          onClick={() => void accept()}
        >
          Passer {oceane ? 'à la' : 'au'} {step} {levelUp.to} <IconChevronRight size={18} />
        </Pressable>
        <Pressable
          className="mt-2 w-full py-3.5 text-center text-[15px] font-semibold text-ink-2"
          onClick={onClose}
        >
          Rester {oceane ? 'en' : 'au'} {step} {levelUp.from}
        </Pressable>
      </motion.div>
    </motion.div>
  );
}

function Change({
  icon,
  label,
  from,
  to,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  from?: string;
  to?: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? '' : 'border-b border-sep'}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-dim text-accent">
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-medium">{label}</span>
      <span className="tnum flex items-center gap-2 text-[14px]">
        <span className="text-ink-3 line-through">{from ?? '—'}</span>
        <IconChevronRight size={14} className="text-ink-3" />
        <span className="font-bold text-accent">{to ?? '—'}</span>
      </span>
    </div>
  );
}
