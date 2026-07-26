import { bestEquivalent, nextLandmark } from '../../gamification/equivalents';
import { fmtTonnage } from '../../lib/format';
import { useSettings } from '../../state/settings';
import { IconAnvil } from '../ui/Icons';

interface Props {
  weekTonnage: number;
  lifetimeTonnage: number;
}

/** Le tonnage traduit en choses réelles. */
export function EquivalentCard({ weekTonnage, lifetimeTonnage }: Props) {
  const unit = useSettings((s) => s.unit);
  const week = bestEquivalent(weekTonnage);
  const landmark = nextLandmark(lifetimeTonnage);

  if (!week && lifetimeTonnage <= 0) return null;

  return (
    <div className="mb-4 rounded-[16px] bg-raised p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-dim text-accent">
          <IconAnvil size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            Soulevé cette semaine
          </p>
          {week ? (
            <p className="text-[15px] font-semibold">
              <span className="tnum">{fmtTonnage(weekTonnage, unit)}</span>
              <span className="text-ink-2"> — l’équivalent de </span>
              {week.text}
            </p>
          ) : (
            <p className="text-[15px] font-semibold text-ink-2">
              La forge attend son premier coup de marteau.
            </p>
          )}
        </div>
      </div>
      {landmark && lifetimeTonnage > 0 && (
        <div className="mt-3 border-t border-sep pt-2.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] text-ink-2">
              Depuis le début : <span className="tnum">{fmtTonnage(lifetimeTonnage, unit)}</span>
            </p>
            <p className="tnum text-[12px] font-semibold text-accent">
              {landmark.label} : {landmark.percent < 1 ? '<1' : Math.floor(landmark.percent)} %
            </p>
          </div>
          <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-raised-2">
            <div
              className="h-full rounded-full bg-accent/70"
              style={{ width: `${Math.max(1, Math.min(100, landmark.percent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
