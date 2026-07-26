import { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useMeasureWidth } from './useMeasureWidth';

export interface LinePoint {
  x: number; // timestamp
  y: number;
  label: string; // date formatée
}

interface Props {
  points: LinePoint[];
  height?: number;
  formatY: (v: number) => string;
}

const PAD = { top: 18, right: 12, bottom: 22, left: 12 };

/** Courbe mono-série : trait 2px accent, aire dégradée, inspection au doigt. */
export function LineChart({ points, height = 180, formatY }: Props) {
  const { ref, width } = useMeasureWidth<HTMLDivElement>();
  const [picked, setPicked] = useState<number | null>(null);

  const { path, area, xs, ys, yMin, yMax } = useMemo(() => {
    if (points.length === 0 || width === 0)
      return { path: '', area: '', xs: [] as number[], ys: [] as number[], yMin: 0, yMax: 0 };
    const yValues = points.map((p) => p.y);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yPadding = (yMax - yMin || yMax * 0.1 || 1) * 0.12;
    const x = scaleLinear(
      [points[0].x, points[points.length - 1].x || points[0].x + 1],
      [PAD.left, width - PAD.right],
    );
    const y = scaleLinear([yMin - yPadding, yMax + yPadding], [height - PAD.bottom, PAD.top]);
    const xs = points.map((p) => x(p.x));
    const ys = points.map((p) => y(p.y));
    const path =
      points.length === 1
        ? ''
        : xs.map((px, i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${ys[i].toFixed(1)}`).join('');
    const area = path
      ? `${path}L${xs[xs.length - 1].toFixed(1)},${height - PAD.bottom}L${xs[0].toFixed(1)},${height - PAD.bottom}Z`
      : '';
    return { path, area, xs, ys, yMin, yMax };
  }, [points, width, height]);

  const pick = (clientX: number) => {
    if (!ref.current || xs.length === 0) return;
    const rel = clientX - ref.current.getBoundingClientRect().left;
    let best = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - rel) < Math.abs(xs[best] - rel)) best = i;
    setPicked(best);
  };

  const last = points.length - 1;
  const active = picked ?? last;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {width > 0 && points.length > 0 && (
        <svg
          width={width}
          height={height}
          className="block touch-none"
          onPointerDown={(e) => pick(e.clientX)}
          onPointerMove={(e) => e.buttons > 0 && pick(e.clientX)}
          onPointerUp={() => setPicked(null)}
          onPointerCancel={() => setPicked(null)}
        >
          <defs>
            <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* repères min / max, discrets */}
          {[yMax, yMin].map((v, i) => {
            const yPos = i === 0 ? PAD.top : height - PAD.bottom;
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={yPos}
                  y2={yPos}
                  stroke="var(--separator)"
                  strokeDasharray="3 4"
                />
                <text
                  x={width - PAD.right}
                  y={yPos - 5}
                  textAnchor="end"
                  className="fill-[var(--text-tertiary)] tnum text-[10px]"
                >
                  {formatY(v)}
                </text>
              </g>
            );
          })}
          {area && <path d={area} fill="url(#lc-fill)" />}
          {path && (
            <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
          )}
          {/* point actif : anneau 2px couleur surface pour le détacher du trait */}
          <circle cx={xs[active]} cy={ys[active]} r={5} fill="var(--accent)" stroke="var(--bg-raised)" strokeWidth={2} />
          {picked !== null && (
            <line
              x1={xs[active]}
              x2={xs[active]}
              y1={PAD.top}
              y2={height - PAD.bottom}
              stroke="var(--text-tertiary)"
              strokeWidth={1}
            />
          )}
        </svg>
      )}
      {points.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-0 rounded-md bg-raised-2 px-2 py-0.5">
          <span className="tnum text-[12px] font-semibold text-ink">{formatY(points[active].y)}</span>
          <span className="ml-1.5 text-[11px] text-ink-3">{points[active].label}</span>
        </div>
      )}
    </div>
  );
}
