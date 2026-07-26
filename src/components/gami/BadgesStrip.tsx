import { BADGES } from '../../gamification/badges';
import type { BadgeRow } from '../../db/types';
import { BadgeIcon } from '../BadgeIcon';
import { Pressable } from '../ui/Pressable';
import { useNav } from '../../state/nav';
import { IconChevronRight } from '../ui/Icons';

/** Bandeau horizontal des derniers badges + compteur. */
export function BadgesStrip({ unlocked }: { unlocked: BadgeRow[] }) {
  const push = useNav((s) => s.push);
  const defs = new Map(BADGES.map((b) => [b.id, b]));
  const recent = unlocked.slice(0, 6);

  return (
    <Pressable
      className="mb-4 w-full rounded-[16px] bg-raised p-4 text-left"
      tapScale={0.98}
      onClick={() => push({ type: 'forge' })}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
          Marques de la forge
        </p>
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
            Aucune marque pour l’instant — elles se gagnent au marteau.
          </p>
        )}
        {recent.map((row) => {
          const def = defs.get(row.id);
          if (!def) return null;
          return (
            <span
              key={row.id}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-dim text-accent"
              title={def.name}
            >
              <BadgeIcon icon={def.icon} size={20} />
            </span>
          );
        })}
      </div>
    </Pressable>
  );
}
