import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Screen, LargeTitle, Card } from '../../components/Screen';
import { Pressable } from '../../components/ui/Pressable';
import { IconChevronRight, IconShieldAlert } from '../../components/ui/Icons';
import { useNav } from '../../state/nav';
import { GUIDE_SECTIONS } from '../../oceane/guide';
import { SafetySheet } from '../../oceane/SafetySheet';
import { EXERCISE_GUIDE } from '../../oceane/exerciseGuide';
import { OCEANE_BLOCK_ID, OCEANE_WARMUP, oceaneTemplateFor } from '../../db/progOceane';
import { blockView } from '../../lib/block';
import { Segmented } from '../../components/ui/Segmented';

/**
 * Le document, en fiches — plus les deux séances, exercice par exercice.
 *
 * Tout ce qu'Océane devait chercher dans un PDF de 28 pages est ici, dans
 * l'ordre où on en a besoin : la séance d'abord, la théorie ensuite.
 */
export function OceaneGuide() {
  const push = useNav((s) => s.push);
  const [safety, setSafety] = useState(false);
  const [day, setDay] = useState<'a' | 'b'>('a');

  const week = useLiveQuery(async () => {
    const block = await db.blocks.get(OCEANE_BLOCK_ID);
    return block ? blockView(block).week : 1;
  }, []);

  const names = useLiveQuery(async () => {
    const all = await db.exercises.toArray();
    return new Map(all.map((e) => [e.id, e.name]));
  }, []);

  const items = oceaneTemplateFor(day, week ?? 1);

  return (
    <Screen>
      <LargeTitle sub="Ton programme, expliqué. Tout est là.">Mon guide</LargeTitle>

      <Pressable
        className="mb-5 flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-negative/30 bg-raised p-4 text-left"
        tapScale={0.99}
        onClick={() => setSafety(true)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised-2 text-negative">
          <IconShieldAlert size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">Signaux d’arrêt et interdits</p>
          <p className="text-[12px] leading-4 text-ink-2">
            À connaître par cœur. Accessible aussi pendant la séance.
          </p>
        </div>
        <IconChevronRight size={16} className="shrink-0 text-ink-3" />
      </Pressable>

      {/* Les deux séances, telles qu'elles sont cette semaine */}
      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        Mes exercices
      </p>
      <div className="mb-2.5">
        <Segmented
          ariaLabel="Séance"
          options={[
            { value: 'a', label: 'Séance A' },
            { value: 'b', label: 'Séance B' },
          ]}
          value={day}
          onChange={(v) => setDay(v)}
        />
      </div>
      <Card className="mb-5 !p-0">
        <div className="border-b border-sep bg-raised-2/40 px-4 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-lilac">
            Échauffement — 12 min, les deux séances
          </p>
        </div>
        <ul>
          {OCEANE_WARMUP.map((item) => (
            <li key={item.exerciseId} className="border-b border-sep last:border-b-0">
              <Pressable
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                tapScale={0.99}
                onClick={() => push({ type: 'oceane-exercise', exerciseId: item.exerciseId })}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {names?.get(item.exerciseId) ?? item.exerciseId}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-4 text-ink-3">
                    {EXERCISE_GUIDE[item.exerciseId]?.prescription}
                  </p>
                </div>
                <IconChevronRight size={16} className="shrink-0 text-accent" />
              </Pressable>
            </li>
          ))}
        </ul>
        <div className="border-y border-sep bg-raised-2/40 px-4 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
            Séance {day.toUpperCase()} · semaine {week ?? 1}
          </p>
        </div>
        <ul>
          {items.map((item, i) => {
            const g = EXERCISE_GUIDE[item.exerciseId];
            return (
              <li key={i} className="border-b border-sep last:border-b-0">
                <Pressable
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  tapScale={0.99}
                  onClick={() => push({ type: 'oceane-exercise', exerciseId: item.exerciseId })}
                >
                  <span className="w-8 shrink-0 text-[12px] font-bold text-accent">
                    {g?.tag.split(' ')[0] ?? ''}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">
                      {names?.get(item.exerciseId) ?? item.exerciseId}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-4 text-ink-3">{g?.prescription}</p>
                  </div>
                  <IconChevronRight size={16} className="shrink-0 text-accent" />
                </Pressable>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        Comprendre
      </p>
      <div className="flex flex-col gap-2.5">
        {GUIDE_SECTIONS.map((s) => (
          <Pressable
            key={s.id}
            className="w-full rounded-[var(--radius-card)] bg-raised p-4 text-left"
            tapScale={0.99}
            onClick={() => push({ type: 'oceane-section', sectionId: s.id })}
          >
            <div className="flex items-center gap-2">
              <p className="flex-1 text-[16px] font-bold">{s.title}</p>
              <IconChevronRight size={16} className="text-accent" />
            </div>
            <p className="mt-1 text-[13px] leading-5 text-ink-2">{s.teaser}</p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              {s.when}
            </p>
          </Pressable>
        ))}
      </div>

      <SafetySheet open={safety} onClose={() => setSafety(false)} />
    </Screen>
  );
}
