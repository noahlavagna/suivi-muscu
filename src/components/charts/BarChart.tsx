import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface Bar {
  label: string;
  value: number;
}

interface Props {
  bars: Bar[];
  height?: number;
  formatValue: (v: number) => string;
}

/** Barres fines, coins arrondis en tête, valeur affichée sur la barre active seulement. */
export function BarChart({ bars, height = 140, formatValue }: Props) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(bars.length - 1);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const plotH = height - 34; // place pour valeur en haut + labels en bas

  return (
    <div className="w-full select-none" style={{ height }}>
      <div className="flex items-end gap-[6px]" style={{ height: plotH + 16 }}>
        {bars.map((b, i) => {
          const h = Math.max(b.value > 0 ? 4 : 2, (b.value / max) * plotH);
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              className="relative flex flex-1 flex-col items-center justify-end self-stretch"
              onClick={() => setActive(i)}
              aria-label={`${b.label} : ${formatValue(b.value)}`}
            >
              {isActive && (
                <span className="tnum absolute -top-0.5 whitespace-nowrap text-[11px] font-semibold text-ink">
                  {formatValue(b.value)}
                </span>
              )}
              <motion.div
                className="w-full max-w-[26px] origin-bottom rounded-t-[4px]"
                style={{
                  height: h,
                  background: isActive ? 'var(--accent)' : 'var(--accent-dim)',
                }}
                initial={reduced ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.02 }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[6px]">
        {bars.map((b, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] ${i === active ? 'font-semibold text-ink-2' : 'text-ink-3'}`}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
