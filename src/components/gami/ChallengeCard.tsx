import { motion } from 'framer-motion';
import type { ChallengeRow } from '../../db/types';
import { IconCheck, IconScroll } from '../ui/Icons';
import { fmtNumber } from '../../lib/format';

interface Props {
  challenge: ChallengeRow & { progress: number };
}

/** Le contrat de la semaine, avec sa jauge. */
export function ChallengeCard({ challenge }: Props) {
  const done = challenge.doneAt !== undefined;
  const pct = Math.min(1, challenge.progress / challenge.target);

  return (
    <div className="mb-4 rounded-[16px] bg-raised p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
            done ? 'bg-accent text-canvas' : 'bg-accent-dim text-accent'
          }`}
        >
          {done ? <IconCheck size={18} /> : <IconScroll size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            Contrat de la semaine {done && '· rempli'}
          </p>
          <p className="text-[15px] font-semibold leading-5">{challenge.desc}</p>
        </div>
        <span className="tnum shrink-0 text-[13px] font-semibold text-ink-2">
          +{challenge.xp} XP
        </span>
      </div>
      <div className="mt-3 h-[8px] overflow-hidden rounded-full bg-raised-2">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ background: 'var(--accent)', width: '100%' }}
          initial={false}
          animate={{ scaleX: pct }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
      <p className="tnum mt-1.5 text-[12px] text-ink-3">
        {challenge.kind === 'pr'
          ? done
            ? 'Record battu'
            : 'Aucun record battu pour l’instant'
          : `${fmtNumber(Math.round(challenge.progress), 0)} / ${challenge.target.toLocaleString('fr-FR')}${
              challenge.kind === 'tonnage' ? ' kg' : ' séries'
            }`}
      </p>
    </div>
  );
}
