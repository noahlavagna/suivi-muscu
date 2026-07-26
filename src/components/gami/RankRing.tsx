import { ProgressRing } from '../ui/ProgressRing';

interface Props {
  level: number;
  /** 0 → 1 dans le niveau courant */
  progress: number;
  size?: number;
}

export function RankRing({ level, progress, size = 64 }: Props) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ProgressRing progress={progress} size={size} strokeWidth={5} smoothMs={600} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-3">Niv</span>
        <span className="tnum text-[20px] font-bold leading-5">{level}</span>
      </div>
    </div>
  );
}
