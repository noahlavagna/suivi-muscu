import { useState } from 'react';
import { Pressable } from './ui/Pressable';
import { Sheet } from './ui/Sheet';
import { IconCalendar } from './ui/Icons';
import { setTemplateWeekdays } from '../db/blocks';
import { isWarmupSets, type WorkoutTemplate } from '../db/types';
import { WEEKDAY_LABELS } from '../lib/dates';

/** Lundi en tête, comme partout dans l'app (0 = dimanche côté Date). */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const dayLabel = (t: WorkoutTemplate): string =>
  t.weekdays.length > 0
    ? WEEK_ORDER.filter((d) => t.weekdays.includes(d))
        .map((d) => WEEKDAY_LABELS[d])
        .join(' · ')
    : 'Pas de jour fixe';

/**
 * Toutes les séances du palier en cours : on en lance une quel que soit le
 * jour, et on choisit ici les jours où chacune est proposée d'office sur
 * l'accueil. Le planning est une aide, jamais un verrou.
 */
export function SessionsSheet({
  open,
  onClose,
  templates,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  templates: WorkoutTemplate[];
  onStart: (templateId: string) => void;
}) {
  const [planning, setPlanning] = useState<string | null>(null);

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Choisir une séance">
      <div className="pb-3 pt-1">
        <h2 className="text-[20px] font-bold">Lancer une séance</h2>
        <p className="mb-3 mt-0.5 text-[13px] leading-5 text-ink-2">
          Lance celle que tu veux, n’importe quel jour. Le calendrier sert à choisir les jours où
          elle t’est proposée d’office.
        </p>
        {templates.length === 0 && (
          <p className="py-4 text-center text-[14px] text-ink-3">Aucune séance au programme.</p>
        )}
        {templates.map((t) => {
          const today = t.weekdays.includes(new Date().getDay());
          return (
            <div key={t.id} className="border-b border-sep py-3 last:border-b-0">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">
                    {t.name}
                    {t.optionalDay && (
                      <span className="ml-1.5 text-[12px] font-normal text-ink-3">optionnel</span>
                    )}
                  </p>
                  <p className="tnum mt-0.5 truncate text-[13px] text-ink-2">
                    <span className={today ? 'font-semibold text-accent' : ''}>{dayLabel(t)}</span>
                    {' — '}
                    {t.items.filter((i) => !isWarmupSets(i.sets)).length} exercices
                  </p>
                </div>
                <Pressable
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    planning === t.id ? 'bg-accent-dim text-accent' : 'bg-raised-2 text-ink-2'
                  }`}
                  aria-label={`Planifier ${t.name}`}
                  aria-expanded={planning === t.id}
                  onClick={() => setPlanning(planning === t.id ? null : t.id)}
                >
                  <IconCalendar size={18} />
                </Pressable>
                <Pressable
                  className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-[14px] font-bold text-canvas"
                  onClick={() => {
                    onClose();
                    onStart(t.id);
                  }}
                >
                  Lancer
                </Pressable>
              </div>
              {planning === t.id && (
                <div className="mt-2.5 flex gap-1.5">
                  {WEEK_ORDER.map((d) => {
                    const on = t.weekdays.includes(d);
                    return (
                      <Pressable
                        key={d}
                        className={`flex-1 rounded-[10px] py-2 text-[13px] font-semibold ${
                          on ? 'bg-accent text-canvas' : 'bg-raised-2 text-ink-2'
                        }`}
                        aria-pressed={on}
                        onClick={() =>
                          void setTemplateWeekdays(
                            t.id,
                            on ? t.weekdays.filter((x) => x !== d) : [...t.weekdays, d],
                          )
                        }
                      >
                        {WEEKDAY_LABELS[d]}
                      </Pressable>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
