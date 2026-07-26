import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '../db/db';
import { useNav } from '../state/nav';
import { Screen, LargeTitle, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { IconChevronRight, IconDumbbell, IconPlus } from '../components/ui/Icons';
import { WEEKDAY_LABELS } from '../lib/dates';

export function ProgramScreen() {
  const templates = useLiveQuery(() => db.templates.orderBy('order').toArray(), []);
  const push = useNav((s) => s.push);

  const addTemplate = async () => {
    const id = nanoid();
    await db.templates.put({
      id,
      name: 'Nouvelle séance',
      weekdays: [],
      order: (templates?.length ?? 0) > 0 ? Math.max(...templates!.map((t) => t.order)) + 1 : 0,
      items: [],
    });
    push({ type: 'template-editor', templateId: id });
  };

  return (
    <Screen>
      <LargeTitle sub="Tes séances types et leur planning">Programme</LargeTitle>

      <div className="flex flex-col gap-2.5">
        {templates?.map((t) => (
          <Pressable
            key={t.id}
            className="text-left"
            onClick={() => push({ type: 'template-editor', templateId: t.id })}
          >
            <Card className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold">{t.name}</p>
                <p className="tnum mt-0.5 text-[13px] text-ink-2">
                  {t.weekdays.length > 0
                    ? [...t.weekdays]
                        .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
                        .map((d) => WEEKDAY_LABELS[d])
                        .join(' · ')
                    : 'Non planifiée'}
                  {' — '}
                  {t.items.length} exercices
                </p>
              </div>
              <IconChevronRight size={18} className="shrink-0 text-ink-3" />
            </Card>
          </Pressable>
        ))}
      </div>

      <Pressable
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-sep py-3.5 text-[15px] font-semibold text-accent"
        onClick={() => void addTemplate()}
      >
        <IconPlus size={18} /> Nouvelle séance
      </Pressable>

      <Pressable
        className="mt-6 flex w-full items-center gap-3 rounded-[16px] bg-raised p-4 text-left"
        onClick={() => push({ type: 'library' })}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-dim text-accent">
          <IconDumbbell size={20} />
        </span>
        <div className="flex-1">
          <p className="text-[15px] font-semibold">Bibliothèque d’exercices</p>
          <p className="text-[13px] text-ink-2">Groupes, incréments, temps de repos</p>
        </div>
        <IconChevronRight size={18} className="text-ink-3" />
      </Pressable>
    </Screen>
  );
}
