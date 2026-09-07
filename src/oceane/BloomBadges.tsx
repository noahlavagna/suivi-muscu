import { useState } from 'react';
import type { BadgeRow } from '../db/types';
import { BADGES, badgeView } from '../gamification/badges';
import { BadgeIcon } from '../components/BadgeIcon';
import { Pressable } from '../components/ui/Pressable';
import { Sheet } from '../components/ui/Sheet';
import { IconChevronRight } from '../components/ui/Icons';
import { fmtDateShort } from '../lib/dates';

/**
 * « Mes fleurs » — l'équivalent des marques de la forge, côté Océane.
 *
 * Ce sont les mêmes badges et les mêmes conditions : seuls les noms changent
 * (voir `badgeView`). La liste complète s'ouvre en feuille plutôt que dans un
 * écran à part : il n'y a rien à y faire, juste à regarder.
 */
export function BloomBadges({ unlocked }: { unlocked: BadgeRow[] }) {
  const [open, setOpen] = useState(false);
  const unlockedAt = new Map(unlocked.map((b) => [b.id, b.unlockedAt]));
  const recent = unlocked.slice(0, 6);
  const defs = new Map(BADGES.map((b) => [b.id, b]));
  const visible = BADGES.filter((b) => !b.secret || unlockedAt.has(b.id));

  return (
    <>
      <Pressable
        className="mb-4 w-full rounded-[var(--radius-card)] bg-raised p-4 text-left"
        tapScale={0.98}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Mes fleurs</p>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-ink-2">
            <span className="tnum">
              {unlocked.length}/{BADGES.length}
            </span>
            <IconChevronRight size={14} className="text-ink-3" />
          </span>
        </div>
        <div className="mt-2.5 flex gap-2.5">
          {recent.length === 0 && (
            <p className="py-1 text-[13px] text-ink-3">
              Aucune fleur pour l’instant — la première pousse à ta première séance.
            </p>
          )}
          {recent.map((row) => {
            const def = defs.get(row.id);
            if (!def) return null;
            const view = badgeView(def);
            return (
              <span
                key={row.id}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-dim text-accent"
                title={view.name}
              >
                <BadgeIcon icon={view.icon} size={20} />
              </span>
            );
          })}
        </div>
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} ariaLabel="Mes fleurs">
        <div className="pb-4 pt-1">
          <h2 className="text-[22px] font-bold tracking-[-0.01em]">Mes fleurs</h2>
          <p className="mb-4 mt-0.5 text-[14px] text-ink-2">
            {unlocked.length} sur {BADGES.length}. Elles arrivent toutes seules — rien à
            réclamer.
          </p>
          {visible.map((def) => {
            const view = badgeView(def);
            const at = unlockedAt.get(def.id);
            return (
              <div
                key={def.id}
                className="flex items-center gap-3 border-b border-sep py-3 last:border-b-0"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    at ? 'bg-accent text-canvas' : 'bg-raised-2 text-ink-3'
                  }`}
                >
                  <BadgeIcon icon={view.icon} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] font-semibold ${at ? '' : 'text-ink-2'}`}>
                    {view.name}
                  </p>
                  <p className="text-[12px] leading-4 text-ink-3">{view.desc}</p>
                </div>
                {at && (
                  <span className="shrink-0 text-[11px] font-semibold text-accent">
                    {fmtDateShort(new Date(at).toISOString().slice(0, 10))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
