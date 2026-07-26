import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BADGES } from '../gamification/badges';
import { useGami } from '../gamification/useGami';
import { nextTitle, XP_PER_PR, XP_PER_SET, XP_PER_WORKOUT } from '../gamification/xp';
import { Screen, BackHeader, Card } from '../components/Screen';
import { RankRing } from '../components/gami/RankRing';
import { Flame } from '../components/gami/Flame';
import { BadgeIcon } from '../components/BadgeIcon';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { fmtDateShort } from '../lib/dates';

function XPRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-sep py-2 last:border-b-0">
      <span className="text-[14px] text-ink-2">{label}</span>
      <span className="tnum text-[14px] font-semibold">
        {value.toLocaleString('fr-FR')} XP
      </span>
    </div>
  );
}

export function ForgeScreen() {
  const gami = useGami();
  const doneChallenges = useLiveQuery(
    async () =>
      (await db.challenges.toArray())
        .filter((c) => c.doneAt)
        .sort((a, b) => b.id.localeCompare(a.id)),
    [],
  );

  if (!gami) return <Screen>{null}</Screen>;
  const { xp, streak, unlocked } = gami;
  const next = nextTitle(xp.level);
  const unlockedMap = new Map(unlocked.map((b) => [b.id, b]));

  return (
    <Screen bottomPadding={40}>
      <BackHeader title="La Forge" />

      {/* Rang */}
      <Card className="glow-accent mb-4">
        <div className="flex items-center gap-4">
          <RankRing level={xp.level} progress={xp.xpInLevel / xp.xpForNext} size={76} />
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-bold leading-6">{xp.title}</p>
            <p className="tnum mt-1 text-[13px] text-ink-2">
              <AnimatedNumber value={xp.total} /> XP forgés au total
            </p>
            {next && (
              <p className="mt-0.5 text-[12px] text-ink-3">
                « {next.title} » au niveau {next.level}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center">
            <Flame lit={streak.weeks > 0 || streak.thisWeekValid} danger={streak.danger} size={34} />
            <span className="tnum text-[17px] font-bold">{streak.weeks}</span>
            <span className="text-[9px] font-medium uppercase tracking-wide text-ink-3">
              semaines
            </span>
          </div>
        </div>
      </Card>

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        D’où vient le métal
      </p>
      <Card className="mb-4 !py-1.5">
        <XPRow
          label={`${xp.sets} série${xp.sets > 1 ? 's' : ''} frappée${xp.sets > 1 ? 's' : ''}`}
          value={xp.sets * XP_PER_SET}
        />
        <XPRow
          label={`${xp.workouts} séance${xp.workouts > 1 ? 's' : ''} terminée${xp.workouts > 1 ? 's' : ''}`}
          value={xp.workouts * XP_PER_WORKOUT}
        />
        <XPRow
          label={`${xp.prEvents} série${xp.prEvents > 1 ? 's' : ''} record`}
          value={xp.prEvents * XP_PER_PR}
        />
        <XPRow label="Contrats remplis" value={xp.challengesXp} />
        <XPRow label="Marques gagnées" value={xp.badgesXp} />
      </Card>

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        Marques · {unlocked.length}/{BADGES.length}
      </p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {BADGES.map((def) => {
          const row = unlockedMap.get(def.id);
          const hidden = def.secret && !row;
          return (
            <div
              key={def.id}
              className={`flex flex-col items-center rounded-[14px] bg-raised px-2 py-3 text-center ${
                row ? '' : 'opacity-45'
              }`}
            >
              <span
                className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full ${
                  row ? 'bg-accent-dim text-accent' : 'bg-raised-2 text-ink-3'
                }`}
              >
                <BadgeIcon icon={hidden ? 'star' : def.icon} size={19} />
              </span>
              <p className="text-[12px] font-semibold leading-4">
                {hidden ? '???' : def.name}
              </p>
              <p className="mt-0.5 text-[10px] leading-3.5 text-ink-3">
                {hidden ? 'Marque secrète' : row ? fmtDateShort(new Date(row.unlockedAt).toISOString().slice(0, 10)) : def.desc}
              </p>
            </div>
          );
        })}
      </div>

      {doneChallenges && doneChallenges.length > 0 && (
        <>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            Contrats remplis
          </p>
          <Card className="!py-1">
            {doneChallenges.map((c) => (
              <div
                key={c.id}
                className="flex items-baseline justify-between gap-3 border-b border-sep py-2.5 last:border-b-0"
              >
                <span className="min-w-0 truncate text-[14px]">{c.desc}</span>
                <span className="tnum shrink-0 text-[12px] text-ink-3">
                  {fmtDateShort(c.id)} · +{c.xp} XP
                </span>
              </div>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
