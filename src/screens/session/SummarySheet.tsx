import { useSession } from '../../state/session';
import { useSettings } from '../../state/settings';
import { fmtDurationLong, fmtTonnage } from '../../lib/format';
import { fmtDateShort, todayISO } from '../../lib/dates';
import { shareSummaryCard } from '../../lib/shareCard';
import type { RarityTier } from '../../gamification/rarity';
import { Sheet } from '../../components/ui/Sheet';
import { Pressable } from '../../components/ui/Pressable';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import {
  IconMedal,
  IconScroll,
  IconShare,
  IconSkull,
  IconTrophy,
  IconZap,
} from '../../components/ui/Icons';

const TIER_STYLE: Record<RarityTier, { border: string; chipBg: string; chipText: string; glow: boolean }> = {
  fonte: {
    border: '1px solid var(--separator)',
    chipBg: 'var(--bg-raised-2)',
    chipText: 'var(--text-secondary)',
    glow: false,
  },
  acier: {
    border: '1px solid color-mix(in oklab, var(--accent) 35%, transparent)',
    chipBg: 'var(--accent-dim)',
    chipText: 'var(--accent)',
    glow: false,
  },
  damas: {
    border: '1px solid color-mix(in oklab, var(--accent) 70%, transparent)',
    chipBg: 'var(--accent-dim)',
    chipText: 'var(--accent)',
    glow: true,
  },
  mythique: {
    border: '1.5px solid var(--accent)',
    chipBg: 'var(--accent)',
    chipText: 'var(--bg-canvas)',
    glow: true,
  },
};

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-raised-2 p-3.5">
      <p className="text-[12px] font-medium text-ink-3">{label}</p>
      <p className="mt-0.5 text-[22px] font-bold leading-7">{children}</p>
    </div>
  );
}

export function SummarySheet() {
  const summary = useSession((s) => s.summary);
  const clear = useSession((s) => s.clearSummary);
  const unit = useSettings((s) => s.unit);

  const delta =
    summary?.prevTonnageKg && summary.prevTonnageKg > 0
      ? ((summary.tonnageKg - summary.prevTonnageKg) / summary.prevTonnageKg) * 100
      : null;
  const tier = summary ? TIER_STYLE[summary.rarity.tier] : TIER_STYLE.fonte;

  return (
    <Sheet open={summary !== null} onClose={clear} ariaLabel="Résumé de séance">
      {summary && (
        <div className="pb-3 pt-1">
          {/* La carte forgée */}
          <div
            className={`relative overflow-hidden rounded-[20px] bg-raised-2 p-4 ${
              tier.glow ? 'glow-accent' : ''
            }`}
            style={{ border: tier.border }}
          >
            {summary.rarity.tier === 'mythique' && <div className="shimmer" />}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-3">
                  Séance terminée
                </p>
                <h2 className="mt-0.5 text-[22px] font-bold tracking-[-0.01em]">
                  {summary.name}
                </h2>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-bold"
                style={{ background: tier.chipBg, color: tier.chipText }}
              >
                {summary.rarity.label}
              </span>
            </div>
            <p className="mt-1 text-[13px] italic text-ink-2">{summary.rarity.line}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Durée">{fmtDurationLong(summary.durationSec)}</Stat>
              <Stat label="Séries validées">
                <AnimatedNumber value={summary.setsDone} />
              </Stat>
              <Stat label="Tonnage">
                <AnimatedNumber value={summary.tonnageKg} format={(v) => fmtTonnage(v, unit)} />
                {delta !== null && Math.abs(delta) >= 0.5 && (
                  <span
                    className={`tnum block text-[13px] font-semibold leading-4 ${
                      delta > 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)} % vs dernière
                  </span>
                )}
              </Stat>
              <Stat label="Records">
                <span className="flex items-center gap-2">
                  <AnimatedNumber value={summary.prCount} />
                  {summary.prCount > 0 && <IconTrophy size={20} className="text-accent" />}
                </span>
              </Stat>
            </div>
          </div>

          {/* Gains de forge */}
          <div className="mt-3 flex items-center justify-between rounded-[14px] bg-raised-2 px-4 py-3">
            <span className="flex items-center gap-2 text-[14px] font-medium">
              <IconZap size={17} className="text-accent" /> Métal forgé
            </span>
            <span className="tnum text-[17px] font-bold text-accent">
              +<AnimatedNumber value={summary.xpGained} /> XP
            </span>
          </div>

          {summary.boss && summary.boss.damageKg > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-[14px] bg-raised-2 px-4 py-3">
              <span className="flex items-center gap-2 text-[14px] font-medium">
                <IconSkull size={17} className="text-accent" /> {summary.boss.name}
              </span>
              <span className="tnum text-[14px] font-semibold">
                {summary.boss.slainNow ? (
                  <span className="text-accent">Terrassé !</span>
                ) : (
                  <>
                    −{fmtTonnage(summary.boss.damageKg, unit)}
                    <span className="ml-1.5 text-ink-3">
                      reste {fmtTonnage(summary.boss.hpLeft, unit)}
                    </span>
                  </>
                )}
              </span>
            </div>
          )}

          {summary.challengeDone && (
            <div className="mt-2 flex items-center gap-2 rounded-[14px] bg-accent-dim px-4 py-3">
              <IconScroll size={17} className="text-accent" />
              <span className="text-[14px] font-semibold text-accent">
                Contrat de la semaine rempli
              </span>
            </div>
          )}

          {summary.newBadges.length > 0 && (
            <div className="mt-2 rounded-[14px] bg-raised-2 px-4 py-3">
              <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                <IconMedal size={15} /> Nouvelles marques
              </p>
              <p className="text-[14px] font-semibold">{summary.newBadges.join(' · ')}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Pressable
              className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-raised-2 text-ink-2"
              onClick={() => void shareSummaryCard(summary, unit, fmtDateShort(todayISO()))}
              aria-label="Partager la carte"
            >
              <IconShare size={20} />
            </Pressable>
            <Pressable
              className="flex-1 rounded-[14px] bg-accent py-3.5 text-[17px] font-semibold text-canvas"
              onClick={clear}
            >
              OK
            </Pressable>
          </div>
        </div>
      )}
    </Sheet>
  );
}
