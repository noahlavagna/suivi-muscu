import { addDays, startOfWeek, toISODate } from '../../lib/dates';

interface Props {
  /** nb de séries validées par date ISO */
  counts: Map<string, number>;
  weeks?: number;
}

/** Ramp séquentielle mono-teinte (accent), 4 niveaux + zéro. */
function level(count: number): string {
  if (count === 0) return 'var(--separator)';
  if (count <= 6) return 'color-mix(in oklab, var(--accent) 30%, transparent)';
  if (count <= 14) return 'color-mix(in oklab, var(--accent) 55%, transparent)';
  if (count <= 22) return 'color-mix(in oklab, var(--accent) 80%, transparent)';
  return 'var(--accent)';
}

const DAY_LABELS = ['L', '', 'M', '', 'V', '', 'D'];

/** Régularité façon contributions GitHub : colonnes = semaines, lignes = lun→dim. */
export function Heatmap({ counts, weeks = 18 }: Props) {
  const today = new Date();
  const todayISO = toISODate(today);
  const firstMonday = addDays(startOfWeek(today), -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => toISODate(addDays(firstMonday, w * 7 + d))),
  );
  const monthLabels = columns.map((col, i) => {
    const d = new Date(`${col[0]}T12:00:00`);
    const prev = i > 0 ? new Date(`${columns[i - 1][0]}T12:00:00`) : null;
    return prev === null || d.getMonth() !== prev.getMonth()
      ? d.toLocaleDateString('fr-FR', { month: 'short' })
      : '';
  });

  return (
    <div className="w-full">
      <div className="flex gap-[3px]">
        <div className="flex w-4 flex-col gap-[3px] pt-[18px]">
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="flex h-[13px] items-center text-[9px] text-ink-3">
              {l}
            </span>
          ))}
        </div>
        <div className="flex flex-1 justify-between gap-[3px]">
          {columns.map((col, w) => (
            <div key={w} className="flex flex-1 flex-col gap-[3px]">
              <span className="h-[15px] whitespace-nowrap text-[9px] text-ink-3">
                {monthLabels[w]}
              </span>
              {col.map((iso) => {
                const future = iso > todayISO;
                return (
                  <div
                    key={iso}
                    className="aspect-square w-full rounded-[3px]"
                    style={{
                      background: future ? 'transparent' : level(counts.get(iso) ?? 0),
                      maxHeight: 13,
                    }}
                    title={iso}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
