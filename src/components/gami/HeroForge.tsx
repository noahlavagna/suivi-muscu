import { Pressable } from '../ui/Pressable';
import { RankRing } from './RankRing';
import { Flame } from './Flame';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { IconChevronRight } from '../ui/Icons';
import type { GamiState } from '../../gamification/useGami';
import { useNav } from '../../state/nav';

/** Carte héro du dashboard : rang, XP, flamme, progression de la semaine. */
export function HeroForge({ gami }: { gami: GamiState }) {
  const push = useNav((s) => s.push);
  const { xp, streak } = gami;

  return (
    <Pressable
      className="glow-accent mb-4 w-full rounded-[20px] bg-raised p-4 text-left"
      tapScale={0.98}
      onClick={() => push({ type: 'forge' })}
    >
      <div className="flex items-center gap-4">
        <RankRing level={xp.level} progress={xp.xpInLevel / xp.xpForNext} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold leading-5">{xp.title}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-2">
            <AnimatedNumber value={xp.xpInLevel} /> / {xp.xpForNext.toLocaleString('fr-FR')} XP
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Flame lit={streak.weeks > 0 || streak.thisWeekValid} danger={streak.danger} />
          <span className="tnum text-[15px] font-bold leading-5">{streak.weeks}</span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-ink-3">
            sem.
          </span>
        </div>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
      </div>

      {streak.thisWeekPlanned > 0 && (
        <div className="mt-3.5 flex items-center gap-2 border-t border-sep pt-3">
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: streak.thisWeekPlanned }, (_, i) => (
              <div
                key={i}
                className="h-[6px] flex-1 rounded-full"
                style={{
                  background:
                    i < streak.thisWeekDone ? 'var(--accent)' : 'var(--separator)',
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
    </Pressable>
  );
}
