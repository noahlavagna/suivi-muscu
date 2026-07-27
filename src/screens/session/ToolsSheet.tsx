import { useMemo, useState } from 'react';
import type { Exercise } from '../../db/types';
import { useSession, type SessionEntry } from '../../state/session';
import { useSettings } from '../../state/settings';
import { fmtNumber, kgToUnit } from '../../lib/format';
import { Sheet } from '../../components/ui/Sheet';
import { Segmented } from '../../components/ui/Segmented';
import { Pressable } from '../../components/ui/Pressable';
import { IconCheck, IconPlus } from '../../components/ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  entry: SessionEntry;
  entryIndex: number;
  exercise: Exercise;
}

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const RAMP = [
  { pct: 0.4, reps: 8 },
  { pct: 0.6, reps: 5 },
  { pct: 0.8, reps: 3 },
];

const roundTo = (v: number, step: number) => Math.round(v / step) * step;

/** Outils d'exercice : séries d'échauffement calculées + calculateur de disques. */
export function ToolsSheet({ open, onClose, entry, entryIndex, exercise }: Props) {
  const unit = useSettings((s) => s.unit);
  const addWarmupSets = useSession((s) => s.addWarmupSets);
  const [tab, setTab] = useState<'warmup' | 'plates'>('warmup');
  const [barKg, setBarKg] = useState<'20' | '15' | '10'>('20');

  const working = entry.sets.find(
    (s) => s.target.type !== 'échauffement' && s.target.type !== 'hold' && s.weightKg > 0,
  );
  const base = working?.weightKg ?? 0;
  const alreadyAdded = entry.sets.some((s) => s.target.type === 'échauffement');

  const ramp = useMemo(
    () =>
      RAMP.map((r) => ({
        reps: r.reps,
        weightKg: Math.max(
          exercise.weightIncrementKg,
          roundTo(base * r.pct, exercise.weightIncrementKg),
        ),
      })).filter((r, i, arr) => i === 0 || r.weightKg > arr[i - 1].weightKg),
    [base, exercise.weightIncrementKg],
  );

  const bar = Number(barKg);
  const perSide = (base - bar) / 2;
  const plates = useMemo(() => {
    if (perSide <= 0) return [];
    let rest = perSide;
    const out: number[] = [];
    for (const p of PLATES) {
      while (rest >= p - 1e-9) {
        out.push(p);
        rest -= p;
      }
    }
    return out;
  }, [perSide]);
  const plateSum = plates.reduce((a, b) => a + b, 0);
  const remainder = Math.round((perSide - plateSum) * 100) / 100;

  const w = (kg: number) => `${fmtNumber(kgToUnit(kg, unit))} ${unit}`;

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Outils d’exercice">
      <div className="pb-3 pt-1">
        <h2 className="mb-1 text-[20px] font-bold">{exercise.name}</h2>
        <p className="tnum mb-3 text-[13px] text-ink-2">
          Charge de travail : {base > 0 ? w(base) : '—'}
        </p>
        <Segmented
          ariaLabel="Outil"
          options={[
            { value: 'warmup', label: 'Échauffement' },
            { value: 'plates', label: 'Disques' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'warmup' && (
          <div className="mt-4">
            {base < 20 ? (
              <p className="py-6 text-center text-[14px] text-ink-2">
                Charge légère : une série à vide ou très légère suffit.
              </p>
            ) : (
              <>
                <div className="rounded-[14px] bg-raised-2 px-4">
                  {ramp.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between border-b border-sep py-2.5 last:border-b-0"
                    >
                      <span className="text-[14px] text-ink-2">Montée {i + 1}</span>
                      <span className="tnum text-[16px] font-semibold">
                        {w(r.weightKg)} × {r.reps}
                      </span>
                    </div>
                  ))}
                </div>
                {alreadyAdded ? (
                  <p className="mt-3 flex items-center justify-center gap-1.5 py-2 text-[14px] font-medium text-ink-3">
                    <IconCheck size={16} /> Échauffement déjà dans la séance
                  </p>
                ) : (
                  <Pressable
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-accent py-3 text-[15px] font-semibold text-canvas"
                    onClick={() => {
                      addWarmupSets(entryIndex, ramp);
                      onClose();
                    }}
                  >
                    <IconPlus size={16} /> Ajouter ces séries
                  </Pressable>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'plates' && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-medium">Barre</span>
              <div className="w-44">
                <Segmented
                  ariaLabel="Poids de la barre"
                  options={[
                    { value: '20', label: '20 kg' },
                    { value: '15', label: '15 kg' },
                    { value: '10', label: '10 kg' },
                  ]}
                  value={barKg}
                  onChange={setBarKg}
                />
              </div>
            </div>
            {perSide <= 0 ? (
              <p className="py-6 text-center text-[14px] text-ink-2">
                La charge est sous le poids de la barre seule.
              </p>
            ) : (
              <>
                <p className="mb-2 text-[13px] text-ink-2">
                  Par côté ({fmtNumber(perSide)} kg) :
                </p>
                <div className="flex flex-wrap gap-2">
                  {plates.map((p, i) => (
                    <span
                      key={i}
                      className="tnum flex h-11 min-w-11 items-center justify-center rounded-full bg-accent-dim px-2 text-[14px] font-bold text-accent"
                    >
                      {fmtNumber(p)}
                    </span>
                  ))}
                </div>
                {remainder > 0 && (
                  <p className="tnum mt-2 text-[12px] text-ink-3">
                    Reste {fmtNumber(remainder)} kg par côté non réalisable avec des disques
                    standards.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
