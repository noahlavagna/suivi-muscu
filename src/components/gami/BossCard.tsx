import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { bossState, monthKey, monthlyFlavor, pastBosses } from '../../gamification/boss';
import { db } from '../../db/db';
import { useSettings } from '../../state/settings';
import { fmtTonnage } from '../../lib/format';
import { BossFigure } from './BossFigure';
import { GardenFigure } from './GardenFigure';
import { Sheet } from '../ui/Sheet';
import { Pressable } from '../ui/Pressable';

/**
 * Objectif de tonnage du mois, sur le dashboard + fiche en sheet.
 *
 * Colosse à fissurer côté Noah, jardin à faire fleurir côté Océane : même
 * donnée, même barre, deux récits — le vocabulaire vient de `monthlyFlavor`.
 */
export function BossCard() {
  const unit = useSettings((s) => s.unit);
  const [open, setOpen] = useState(false);
  // Lecture seule : la création du boss du mois est faite au lancement (App) —
  // écrire depuis une liveQuery lèverait une ReadOnlyError.
  const state = useLiveQuery(async () => {
    const row = await db.bosses.get(monthKey());
    return row ? bossState(row) : null;
  }, []);
  const history = useLiveQuery(pastBosses, []);

  if (!state) return null;
  const slain = state.slainAt !== undefined;
  const flavor = monthlyFlavor();
  const Figure = flavor.garden ? GardenFigure : BossFigure;

  return (
    <>
      <Pressable
        className="mb-4 w-full rounded-[16px] bg-raised p-4 text-left"
        tapScale={0.98}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-4">
          <Figure hpRatio={state.hpRatio} slain={slain} size={82} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              {flavor.label}
            </p>
            <p className="text-[17px] font-bold leading-6">{state.name}</p>
            {slain ? (
              <p className="mt-1 inline-block rounded-md bg-accent px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-canvas">
                {flavor.doneLabel}
              </p>
            ) : (
              <>
                <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-raised-2">
                  <motion.div
                    className="h-full origin-left rounded-full bg-accent"
                    initial={false}
                    animate={{ scaleX: state.hpRatio }}
                    transition={{ type: 'spring', stiffness: 180, damping: 28 }}
                    style={{ width: '100%' }}
                  />
                </div>
                <p className="tnum mt-1 text-[12px] text-ink-2">
                  {flavor.remainingLabel} {fmtTonnage(state.hpLeft, unit)} · {state.daysLeft} j
                </p>
              </>
            )}
          </div>
        </div>
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} ariaLabel={flavor.label}>
        <div className="pb-3 pt-1">
          <div className="flex flex-col items-center py-2">
            <Figure hpRatio={state.hpRatio} slain={slain} size={150} />
            <h2 className="mt-2 text-[22px] font-bold">{state.name}</h2>
            <p className="tnum mt-0.5 text-[14px] text-ink-2">
              {fmtTonnage(state.damage, unit)} {flavor.garden ? 'soulevés' : 'infligés'} /{' '}
              {fmtTonnage(state.hpTotal, unit)}
            </p>
            <p className="mt-2 max-w-[300px] text-center text-[13px] text-ink-3">
              {flavor.garden
                ? slain
                  ? 'Tout a fleuri. Un nouveau jardin pousse le mois prochain.'
                  : `Chaque kilo soulevé fait pousser une tige. Il te reste ${state.daysLeft} jour${
                      state.daysLeft > 1 ? 's' : ''
                    }.`
                : slain
                  ? 'La pierre a cédé. Un adversaire plus massif s’éveillera le mois prochain.'
                  : `Chaque kilo soulevé le fissure un peu plus. Il te reste ${state.daysLeft} jour${
                      state.daysLeft > 1 ? 's' : ''
                    }.`}
            </p>
          </div>

          {history && history.length > 0 && (
            <>
              <p className="mb-1.5 mt-3 text-[13px] font-medium uppercase tracking-wide text-ink-3">
                {flavor.garden ? 'Jardins passés' : 'Colosses passés'}
              </p>
              <div className="rounded-[14px] bg-raised-2 px-4">
                {history.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-baseline justify-between border-b border-sep py-2.5 last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-[14px] font-medium">{b.name}</span>
                    <span
                      className={`shrink-0 text-[12px] font-semibold ${
                        b.slainAt ? 'text-accent' : 'text-ink-3'
                      }`}
                    >
                      {b.slainAt ? flavor.doneLabel : flavor.garden ? 'Pas fleuri' : 'A survécu'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
