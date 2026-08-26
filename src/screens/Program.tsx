import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '../db/db';
import {
  applyForgePreset,
  applyPreset,
  FORGE_PRESET_META,
  PROGRAM_PRESETS,
} from '../db/programs';
import { applyNoahProgram, NOAH_PRESET_META } from '../db/progNoah';
import { useNav } from '../state/nav';
import { Screen, LargeTitle, Card } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { Sheet } from '../components/ui/Sheet';
import { Segmented } from '../components/ui/Segmented';
import { Toggle } from '../components/ui/Toggle';
import {
  IconChevronRight,
  IconDumbbell,
  IconPlus,
  IconScroll,
  IconTrash,
} from '../components/ui/Icons';
import { WEEKDAY_LABELS } from '../lib/dates';
import { currentWeek, restLabel, weekConfig } from '../lib/block';
import { setBlockWeek, weekProgress } from '../db/blocks';
import { isWarmupSets, type BlockRow, type WorkoutTemplate } from '../db/types';

const dayLabel = (t: WorkoutTemplate): string =>
  t.weekdays.length > 0
    ? [...t.weekdays]
        .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
        .map((d) => WEEKDAY_LABELS[d])
        .join(' · ')
    : 'Non planifiée';

const workingCount = (t: WorkoutTemplate): number =>
  t.items.filter((i) => !isWarmupSets(i.sets)).length;

/**
 * Un bloc et sa semaine en cours. Choisir une semaine à la main ne stocke pas
 * un « override » : on déplace l'ancre du bloc pour que la semaine voulue
 * tombe sur celle-ci, et l'avance automatique reprend de là.
 */
function BlockCard({
  block,
  templates,
}: {
  block: BlockRow;
  templates: WorkoutTemplate[];
}) {
  const push = useNav((s) => s.push);
  const week = currentWeek(block);
  const config = weekConfig(block, week);
  const progress = useLiveQuery(() => weekProgress(block), [block.id, block.currentWeek, block.weekStartedAt, block.optionalEnabled]);
  const days = templates.filter((t) => t.blockId === block.id && t.week === week);
  const hasOptional = templates.some((t) => t.blockId === block.id && t.optionalDay);

  return (
    <Card className="mb-2.5 !p-0">
      <div className="border-b border-sep px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-bold">{block.name}</h2>
            <p className="tnum mt-0.5 text-[13px] text-ink-2">
              Semaine {week}/{block.weeks.length}
              {config && ` · ${config.rir} · récup ${restLabel(config.restSec, config.restSecMax)}`}
            </p>
          </div>
          <Pressable
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center text-ink-3"
            aria-label="Retirer ce bloc"
            onClick={() => {
              if (
                window.confirm(
                  `Retirer « ${block.name} » et ses ${templates.filter((t) => t.blockId === block.id).length} séances ? L’historique est conservé.`,
                )
              ) {
                void db.transaction('rw', ['blocks', 'templates'], async () => {
                  await db.templates.bulkDelete(
                    templates.filter((t) => t.blockId === block.id).map((t) => t.id),
                  );
                  await db.blocks.delete(block.id);
                });
              }
            }}
          >
            <IconTrash size={18} />
          </Pressable>
        </div>
        <div className="mt-3">
          <Segmented
            ariaLabel="Semaine du bloc"
            value={String(week)}
            options={block.weeks.map((w) => ({ value: String(w.week), label: `S${w.week}` }))}
            onChange={(v) => void setBlockWeek(block.id, Number(v))}
          />
        </div>
        {progress && progress.total > 0 && (
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex gap-1.5">
              {Array.from({ length: progress.total }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 min-w-6 rounded-full ${
                    i < progress.done ? 'bg-accent' : 'bg-raised-2'
                  }`}
                />
              ))}
            </div>
            <span className="tnum text-[12px] font-medium text-ink-3">
              {progress.complete
                ? progress.canLevelUp
                  ? 'palier bouclé'
                  : 'programme final'
                : `${progress.done}/${progress.total} séances`}
            </span>
          </div>
        )}
      </div>

      <ul>
        {days.map((t) => (
          <li key={t.id}>
            <Pressable
              className="flex w-full items-center gap-3 border-b border-sep px-4 py-3 text-left"
              onClick={() => push({ type: 'template-editor', templateId: t.id })}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">
                  {t.name}
                  {t.optionalDay && !block.optionalEnabled && (
                    <span className="ml-1.5 text-[12px] font-normal text-ink-3">hors planning</span>
                  )}
                </p>
                <p className="tnum mt-0.5 text-[13px] text-ink-2">
                  {dayLabel(t)} — {workingCount(t)} exercices
                </p>
              </div>
              <IconChevronRight size={18} className="shrink-0 text-ink-3" />
            </Pressable>
          </li>
        ))}
      </ul>

      {hasOptional && (
        <div className="flex items-center gap-3 border-b border-sep px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">Upper au planning</p>
            <p className="text-[12px] leading-4 text-ink-3">
              Une fois ajouté, les exercices « 1 semaine sur 2 » cessent d’alterner.
            </p>
          </div>
          <Toggle
            checked={block.optionalEnabled}
            ariaLabel="Ajouter les séances facultatives au planning"
            onChange={(v) => void db.blocks.update(block.id, { optionalEnabled: v })}
          />
        </div>
      )}

      <p className="px-4 py-2.5 text-[12px] leading-4 text-ink-3">
        Le palier monte quand toutes ses séances sont faites — l’app te le proposera.
        {block.holdLastWeek && ` S${block.weeks.length} est le programme final, à conserver.`}
      </p>
    </Card>
  );
}

export function ProgramScreen() {
  const templates = useLiveQuery(() => db.templates.orderBy('order').toArray(), []);
  const blocks = useLiveQuery(() => db.blocks.toArray(), []);
  const push = useNav((s) => s.push);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const loose = (templates ?? []).filter((t) => !t.blockId);

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

      {blocks?.map((b) => (
        <BlockCard key={b.id} block={b} templates={templates ?? []} />
      ))}

      <div className="flex flex-col gap-2.5">
        {loose.map((t) => (
          <Pressable
            key={t.id}
            className="text-left"
            onClick={() => push({ type: 'template-editor', templateId: t.id })}
          >
            <Card className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold">{t.name}</p>
                <p className="tnum mt-0.5 text-[13px] text-ink-2">
                  {dayLabel(t)} — {workingCount(t)} exercices
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
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[14px] py-2.5 text-[14px] font-semibold text-ink-2"
        onClick={() => setPresetsOpen(true)}
      >
        <IconScroll size={16} /> Importer un programme préfait
      </Pressable>

      <Sheet
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        ariaLabel="Programmes préfaits"
      >
        <div className="pb-3 pt-1">
          <h2 className="mb-3 text-[20px] font-bold">Programmes préfaits</h2>
          {[
            { ...NOAH_PRESET_META, apply: applyNoahProgram },
            ...PROGRAM_PRESETS.map((p) => ({ ...p, apply: () => applyPreset(p) })),
            { ...FORGE_PRESET_META, apply: applyForgePreset },
          ].map((p) => (
            <Pressable
              key={p.id}
              className="w-full border-b border-sep py-3 text-left last:border-b-0"
              onClick={() => {
                setPresetsOpen(false);
                void p.apply();
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold">{p.name}</span>
                <span className="shrink-0 text-[12px] font-semibold text-accent">
                  {p.daysLabel}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-ink-2">{p.desc}</p>
            </Pressable>
          ))}
          <p className="mt-3 text-[12px] text-ink-3">
            Les séances importées s’ajoutent à ton programme — rien n’est remplacé.
          </p>
        </div>
      </Sheet>

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
