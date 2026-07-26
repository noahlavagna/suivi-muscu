interface Props {
  /** 0 → 1 */
  progress: number;
  size: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  /** Transition CSS linéaire pour suivre un timer sans à-coups */
  smoothMs?: number;
}

export function ProgressRing({
  progress,
  size,
  strokeWidth = 3.5,
  className = 'text-accent',
  trackClassName = 'text-sep',
  smoothMs = 260,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={trackClassName}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={className}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: `stroke-dashoffset ${smoothMs}ms linear` }}
      />
    </svg>
  );
}
