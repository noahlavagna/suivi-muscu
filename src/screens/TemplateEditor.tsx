import { useEffect, useMemo, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '../db/db';
import {
  isDurationSet,
  isFreeSet,
  isWarmupSets,
  SET_TYPE_LABEL,
  type Exercise,
  type ItemVariant,
  type SetType,
  type TargetSet,
  type TemplateItem,
} from '../db/types';
import { useNav } from '../state/nav';
import { Screen, BackHeader } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { Stepper } from '../components/ui/Stepper';
import { Sheet } from '../components/ui/Sheet';
import { ExercisePicker } from '../components/ExercisePicker';
import { IconGrip, IconPlus, IconTrash, IconX } from '../components/ui/Icons';
import { fmtTimer } from '../lib/format';
import { haptics } from '../lib/haptics';
import { estimateDurationSec, SET_PRESETS, volumeByGroup } from '../lib/sessionPlan';
import { useToasts } from '../state/toasts';
import { supersetLabels as labelsFor } from '../lib/superset';
import { currentWeek, itemOptions } from '../lib/block';
import { Segmented } from '../components/ui/Segmented';
import { Toggle } from '../components/ui/Toggle';

const WEEKDAYS: { d: number; label: string }[] = [
  { d: 1, label: 'Lun' },
  { d: 2, label: 'Mar' },
  { d: 3, label: 'Mer' },
  { d: 4, label: 'Jeu' },
  { d: 5, label: 'Ven' },
  { d: 6, label: 'Sam' },
  { d: 0, label: 'Dim' },
];

const TYPE_CYCLE: SetType[] = ['normal', 'topset', 'backoff', 'superlent', 'échauffement', 'hold'];

interface Row {
  uid: string;
  item: TemplateItem;
}

function setSummary(sets: TargetSet[]): string {
  if (sets.length === 0) return 'Aucune série';
  const first = sets[0];
  if (isFreeSet(first)) return sets.length === 1 ? 'Sans objectif' : `${sets.length} × libre`;
  const label = first.cluster
    ? `cluster ${first.cluster.count}×${first.cluster.reps}`
    : isDurationSet(first)
      ? first.durationSecMax && first.durationSecMax !== first.durationSec
        ? `${first.durationSec ?? 20}–${first.durationSecMax} s`
        : `${first.durationSec ?? 20} s`
      : first.repsMin === first.repsMax
        ? `${first.repsMin}`
        : `${first.repsMin}–${first.repsMax}`;
  return `${sets.length} × ${label}`;
}

function ItemRow({
  row,
  exercise,
  supersetLabel,
  onOpen,
}: {
  row: Row;
  exercise?: Exercise;
  supersetLabel: string | null;
  onOpen: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className={`mb-2 flex items-center gap-2.5 rounded-[14px] bg-raised px-3 py-3 ${
        supersetLabel ? 'border-l-[3px] border-accent' : ''
      }`}
    >
      <button
        type="button"
        className="touch-none px-1 py-2 text-ink-3"
        onPointerDown={(e) => {
          haptics.light();
          controls.start(e);
        }}
        aria-label="Réordonner"
      >
        <IconGrip size={18} />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <p className="truncate text-[15px] font-medium">
          {exercise?.name ?? '—'}
          {(row.item.variants?.length ?? 0) > 0 && (
            <span className="ml-1.5 rounded bg-raised-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-2">
              ou
            </span>
          )}
        </p>
        <p className="tnum text-[12px] text-ink-3">
          {isWarmupSets(row.item.sets) ? (
            <span className="font-semibold text-accent">Échauffement · </span>
          ) : (
            supersetLabel && <span className="font-semibold text-accent">{supersetLabel} · </span>
          )}
          {setSummary(row.item.sets)}
        </p>
      </button>
    </Reorder.Item>
  );
}

export function TemplateEditorScreen({ templateId }: { templateId: string }) {
  const pop = useNav((s) => s.pop);
  const push = useNav((s) => s.push);
  const toast = useToasts((s) => s.push);
  const template = useLiveQuery(() => db.templates.get(templateId), [templateId]);
  const block = useLiveQuery(
    async () => (template?.blockId ? await db.blocks.get(template.blockId) : undefined),
    [template?.blockId],
  );
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const exMap = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e])), [exercises]);

  const [rows, setRows] = useState<Row[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [optIdx, setOptIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Charge les items en local une fois (le drag a besoin d'un state synchrone)
  useEffect(() => {
    if (template && loadedFor.current !== template.id) {
      loadedFor.current = template.id;
      setRows(template.items.map((item) => ({ uid: nanoid(6), item })));
    }
  }, [template]);

  const items = useMemo(() => rows.map((r) => r.item), [rows]);
  const duration = estimateDurationSec(items, exMap);
  const volume = volumeByGroup(items, exMap);
  const maxVolume = Math.max(...volume.map((v) => v.sets), 1);

  const supersetLabels = useMemo(() => labelsFor(rows.map((r) => r.item)), [rows]);

  if (!template) return <Screen>{null}</Screen>;

  const save = (next: Row[]) => {
    setRows(next);
    void db.templates.update(templateId, { items: next.map((r) => r.item) });
  };

  const patchItem = (idx: number, patch: Partial<TemplateItem>) => {
    save(rows.map((r, i) => (i !== idx ? r : { ...r, item: { ...r.item, ...patch } })));
  };

  const duplicate = async () => {
    const all = await db.templates.toArray();
    const id = nanoid();
    await db.templates.put({
      ...template,
      id,
      name: `${template.name} (copie)`,
      weekdays: [],
      order: Math.max(...all.map((t) => t.order), -1) + 1,
      items: template.items.map((it) => ({ ...it })),
    });
    toast({ icon: 'scroll', title: 'Séance dupliquée', sub: template.name });
    push({ type: 'template-editor', templateId: id });
  };

  /** Groupe la ligne avec la suivante, ou dissocie si elles le sont déjà. */
  const toggleSuperset = (idx: number) => {
    if (idx >= rows.length - 1) return;
    const key = rows[idx].item.supersetKey;
    const linked = key !== undefined && rows[idx + 1].item.supersetKey === key;
    const nextKey = linked ? undefined : (key ?? nanoid(6));
    save(
      rows.map((r, i) =>
        i === idx || i === idx + 1
          ? { ...r, item: { ...r.item, supersetKey: linked ? undefined : nextKey } }
          : r,
      ),
    );
    haptics.light();
  };

  const editing = editIdx !== null ? rows[editIdx] : null;
  /**
   * Un item peut porter des options « OU » : on édite l'une d'elles à la fois,
   * l'index 0 étant l'option principale portée par l'item lui-même.
   */
  const options: ItemVariant[] = editing ? itemOptions(editing.item) : [];
  const option = options[Math.min(optIdx, Math.max(options.length - 1, 0))];
  const editingEx = option ? exMap.get(option.exerciseId) : undefined;

  /** Écrit dans l'option en cours, principale ou variante. */
  const patchOption = (idx: number, patch: Partial<ItemVariant>) => {
    if (optIdx === 0) {
      patchItem(idx, patch);
      return;
    }
    const variants = (rows[idx].item.variants ?? []).map((v, i) =>
      i === optIdx - 1 ? { ...v, ...patch } : v,
    );
    patchItem(idx, { variants });
  };

  return (
    <Screen bottomPadding={40}>
      <BackHeader
        title="Séance"
        right={
          <div className="flex items-center">
            <Pressable
              className="flex h-10 w-10 items-center justify-center text-ink-2"
              aria-label="Dupliquer la séance"
              onClick={() => void duplicate()}
            >
              <IconPlus size={20} />
            </Pressable>
            <Pressable
              className="flex h-10 w-10 items-center justify-center text-negative"
              aria-label="Supprimer la séance"
              onClick={() => {
                if (window.confirm(`Supprimer « ${template.name} » ? L’historique est conservé.`)) {
                  void db.templates.delete(templateId).then(pop);
                }
              }}
            >
              <IconTrash size={20} />
            </Pressable>
          </div>
        }
      />

      <input
        type="text"
        className="mb-4 w-full rounded-[14px] bg-raised px-4 py-3 text-[18px] font-bold text-ink placeholder:text-ink-3"
        value={template.name}
        placeholder="Nom de la séance"
        onChange={(e) => void db.templates.update(templateId, { name: e.target.value })}
      />

      {block && template.week != null && (
        <div className="mb-4 rounded-[14px] bg-raised px-4 py-3">
          <p className="tnum text-[13px] font-semibold text-accent">
            {block.name} · semaine {template.week}/{block.weeks.length}
            {currentWeek(block) === template.week ? ' (en cours)' : ''}
          </p>
          {template.note && <p className="tnum mt-0.5 text-[13px] text-ink-2">{template.note}</p>}
          <p className="mt-1 text-[12px] leading-4 text-ink-3">
            Chaque semaine du bloc a sa propre version de cette séance. Modifier celle-ci ne touche
            pas les autres.
          </p>
        </div>
      )}

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">Jours</p>
      <div className="mb-6 flex gap-1.5">
        {WEEKDAYS.map(({ d, label }) => {
          const on = template.weekdays.includes(d);
          return (
            <Pressable
              key={d}
              className={`flex-1 rounded-[10px] py-2 text-[13px] font-semibold ${
                on ? 'bg-accent text-canvas' : 'bg-raised text-ink-2'
              }`}
              onClick={() =>
                void db.templates.update(templateId, {
                  weekdays: on
                    ? template.weekdays.filter((x) => x !== d)
                    : [...template.weekdays, d],
                })
              }
            >
              {label}
            </Pressable>
          );
        })}
      </div>

      {rows.length > 0 && (
        <div className="mb-5 rounded-[16px] bg-raised p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-ink-2">Aperçu</p>
            <p className="tnum text-[13px] text-ink-3">
              ~{Math.round(duration / 60)} min · {items.reduce((n, i) => n + i.sets.length, 0)}{' '}
              séries
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {volume.map(({ group, sets }) => (
              <div key={group} className="flex items-center gap-2.5">
                <span className="w-[92px] shrink-0 text-[12px] capitalize text-ink-2">{group}</span>
                <div className="h-[14px] flex-1 overflow-hidden rounded-[4px] bg-raised-2">
                  <div
                    className="h-full rounded-[4px] bg-accent-dim"
                    style={{ width: `${(sets / maxVolume) * 100}%` }}
                  >
                    <div className="h-full w-[3px] rounded-full bg-accent" />
                  </div>
                </div>
                <span className="tnum w-7 shrink-0 text-right text-[12px] font-semibold">
                  {sets % 1 === 0 ? sets : sets.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">Exercices</p>
      <Reorder.Group axis="y" values={rows} onReorder={save} className="list-none">
        {rows.map((row, i) => (
          <ItemRow
            key={row.uid}
            row={row}
            exercise={exMap.get(row.item.exerciseId)}
            supersetLabel={supersetLabels[i]}
            onOpen={() => {
              setOptIdx(0);
              setEditIdx(i);
            }}
          />
        ))}
      </Reorder.Group>

      <Pressable
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-sep py-3.5 text-[15px] font-semibold text-accent"
        onClick={() => {
          setReplacingIdx(null);
          setPickerOpen(true);
        }}
      >
        <IconPlus size={18} /> Ajouter des exercices
      </Pressable>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        alreadyIn={items.map((i) => i.exerciseId)}
        onPick={(picked) => {
          setPickerOpen(false);
          if (replacingIdx !== null) {
            // Remplacement : les séries réglées sont conservées
            patchOption(replacingIdx, { exerciseId: picked[0].id });
            setReplacingIdx(null);
            return;
          }
          save([
            ...rows,
            ...picked.map((e) => ({
              uid: nanoid(6),
              item: {
                exerciseId: e.id,
                sets: e.isTimeBased
                  ? [
                      { type: 'hold' as const, durationSec: 20 },
                      { type: 'hold' as const, durationSec: 20 },
                    ]
                  : [
                      { type: 'normal' as const, repsMin: 8, repsMax: 12 },
                      { type: 'normal' as const, repsMin: 8, repsMax: 12 },
                    ],
              },
            })),
          ]);
        }}
      />

      {/* Édition d'un exercice de la séance */}
      <Sheet open={editing !== null} onClose={() => setEditIdx(null)} ariaLabel="Modifier l’exercice">
        {editing && editIdx !== null && (
          <div className="pb-3 pt-1">
            <h2 className="mb-0.5 text-[20px] font-bold">{editingEx?.name ?? '—'}</h2>
            <p className="mb-3 text-[13px] text-ink-2">Tape le type de série pour le changer.</p>

            {options.length > 1 && (
              <div className="mb-4 rounded-[12px] bg-raised-2 p-3">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                  Options « ou »
                </p>
                <Segmented
                  ariaLabel="Option de l’exercice"
                  value={String(optIdx)}
                  options={options.map((o, i) => ({
                    value: String(i),
                    label: exMap.get(o.exerciseId)?.name ?? `Option ${i + 1}`,
                  }))}
                  onChange={(v) => setOptIdx(Number(v))}
                />
                <div className="mt-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">Alterner 1 semaine sur 2</p>
                    <p className="text-[11px] leading-4 text-ink-3">
                      Suit la semaine du bloc, sauf si les séances facultatives sont activées.
                    </p>
                  </div>
                  <Toggle
                    checked={editing.item.alternateByWeek ?? false}
                    ariaLabel="Alterner les options une semaine sur deux"
                    onChange={(v) => patchItem(editIdx, { alternateByWeek: v })}
                  />
                </div>
              </div>
            )}

            <div className="mb-4 flex gap-2">
              <Pressable
                className="flex-1 rounded-[10px] bg-raised-2 py-2 text-[13px] font-semibold text-ink-2"
                onClick={() => setPresetsOpen(true)}
              >
                Modèle de séries
              </Pressable>
              <Pressable
                className="flex-1 rounded-[10px] bg-raised-2 py-2 text-[13px] font-semibold text-ink-2"
                onClick={() => {
                  setEditIdx(null);
                  setReplacingIdx(editIdx);
                  setPickerOpen(true);
                }}
              >
                Remplacer
              </Pressable>
              {editIdx < rows.length - 1 && (
                <Pressable
                  className={`flex-1 rounded-[10px] py-2 text-[13px] font-semibold ${
                    supersetLabels[editIdx] && supersetLabels[editIdx] === supersetLabels[editIdx + 1]
                      ? 'bg-accent text-canvas'
                      : 'bg-raised-2 text-ink-2'
                  }`}
                  onClick={() => toggleSuperset(editIdx)}
                >
                  Superset
                </Pressable>
              )}
            </div>

            {option.sets.map((s, si) => {
              const cycle = () => {
                const next = TYPE_CYCLE[(TYPE_CYCLE.indexOf(s.type) + 1) % TYPE_CYCLE.length];
                const sets = option.sets.map((x, j) =>
                  j !== si
                    ? x
                    : next === 'hold'
                      ? { type: next, durationSec: x.durationSec ?? 20 }
                      : { type: next, repsMin: x.repsMin ?? 8, repsMax: x.repsMax ?? 12 },
                );
                patchOption(editIdx, { sets });
              };
              const patchSet = (p: Partial<TargetSet>) =>
                patchOption(editIdx, {
                  sets: option.sets.map((x, j) => (j !== si ? x : { ...x, ...p })),
                });
              return (
                <div key={si} className="flex items-center gap-2 border-b border-sep py-2.5">
                  <Pressable
                    className="min-w-[86px] rounded-[9px] bg-raised-2 px-2 py-1.5 text-[12px] font-semibold text-ink-2"
                    onClick={cycle}
                  >
                    {s.cluster
                      ? `Cluster ${s.cluster.count}×${s.cluster.reps}`
                      : SET_TYPE_LABEL[s.type] || 'Normale'}
                  </Pressable>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    {isDurationSet(s) ? (
                      <>
                        <Stepper
                          size="sm"
                          value={s.durationSec ?? 20}
                          step={5}
                          min={5}
                          onChange={(v) =>
                            patchSet({
                              durationSec: v,
                              ...(s.durationSecMax != null
                                ? { durationSecMax: Math.max(v, s.durationSecMax) }
                                : {}),
                            })
                          }
                          format={(v) => `${Math.round(v)} s`}
                          ariaLabel="Durée"
                        />
                        {s.durationSecMax != null && (
                          <>
                            <span className="text-ink-3">–</span>
                            <Stepper
                              size="sm"
                              value={s.durationSecMax}
                              step={5}
                              min={s.durationSec ?? 5}
                              onChange={(v) => patchSet({ durationSecMax: v })}
                              format={(v) => `${Math.round(v)} s`}
                              ariaLabel="Durée maximum"
                            />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Stepper
                          size="sm"
                          value={s.repsMin ?? 8}
                          step={1}
                          min={1}
                          onChange={(v) =>
                            patchSet({ repsMin: v, repsMax: Math.max(v, s.repsMax ?? v) })
                          }
                          ariaLabel="Reps minimum"
                        />
                        <span className="text-ink-3">–</span>
                        <Stepper
                          size="sm"
                          value={s.repsMax ?? 12}
                          step={1}
                          min={s.repsMin ?? 1}
                          onChange={(v) => patchSet({ repsMax: v })}
                          ariaLabel="Reps maximum"
                        />
                      </>
                    )}
                    <Pressable
                      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3"
                      aria-label="Supprimer la série"
                      onClick={() =>
                        patchOption(editIdx, {
                          sets: option.sets.filter((_, j) => j !== si),
                        })
                      }
                    >
                      <IconX size={16} />
                    </Pressable>
                  </div>
                </div>
              );
            })}

            <div className="mt-2.5 flex gap-2">
              <Pressable
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-raised-2 py-2.5 text-[14px] font-semibold text-ink-2"
                onClick={() =>
                  patchOption(editIdx, {
                    sets: [
                      ...option.sets,
                      option.sets[option.sets.length - 1] ?? {
                        type: 'normal',
                        repsMin: 8,
                        repsMax: 12,
                      },
                    ],
                  })
                }
              >
                <IconPlus size={16} /> Série
              </Pressable>
              {option.sets.length > 1 && (
                <Pressable
                  className="flex-1 rounded-[12px] bg-raised-2 py-2.5 text-[14px] font-semibold text-ink-2"
                  onClick={() =>
                    patchOption(editIdx, { sets: option.sets.map(() => ({ ...option.sets[0] })) })
                  }
                >
                  Aligner sur la 1re
                </Pressable>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[12px] bg-raised-2 px-4 py-3">
              <span className="text-[14px] font-medium">Repos entre séries</span>
              <Stepper
                size="sm"
                value={editing.item.restSecOverride ?? editingEx?.defaultRestSec ?? 90}
                step={15}
                min={15}
                onChange={(v) => patchItem(editIdx, { restSecOverride: v })}
                format={(v) => fmtTimer(v)}
                ariaLabel="Repos"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <Pressable
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-raised-2 py-2.5 text-[14px] font-semibold text-ink-2"
                onClick={() => {
                  patchItem(editIdx, {
                    variants: [
                      ...(editing.item.variants ?? []),
                      { exerciseId: option.exerciseId, sets: option.sets.map((x) => ({ ...x })) },
                    ],
                  });
                  setOptIdx(options.length);
                }}
              >
                <IconPlus size={16} /> Option « ou »
              </Pressable>
              {optIdx > 0 && (
                <Pressable
                  className="flex-1 rounded-[12px] bg-raised-2 py-2.5 text-[14px] font-semibold text-negative"
                  onClick={() => {
                    patchItem(editIdx, {
                      variants: (editing.item.variants ?? []).filter((_, i) => i !== optIdx - 1),
                    });
                    setOptIdx(0);
                  }}
                >
                  Retirer l’option
                </Pressable>
              )}
            </div>

            <Pressable
              className="mt-4 w-full rounded-[12px] py-3 text-[15px] font-semibold text-negative"
              onClick={() => {
                setEditIdx(null);
                save(rows.filter((_, i) => i !== editIdx));
              }}
            >
              Retirer de la séance
            </Pressable>
          </div>
        )}
      </Sheet>

      {/* Modèles de séries */}
      <Sheet open={presetsOpen} onClose={() => setPresetsOpen(false)} ariaLabel="Modèles de séries">
        <div className="pb-3 pt-1">
          <h2 className="mb-3 text-[20px] font-bold">Modèle de séries</h2>
          {SET_PRESETS.map((p) => (
            <Pressable
              key={p.label}
              className="flex w-full items-baseline justify-between gap-3 border-b border-sep py-3 text-left last:border-b-0"
              onClick={() => {
                if (editIdx !== null) patchOption(editIdx, { sets: p.build() });
                setPresetsOpen(false);
              }}
            >
              <span className="text-[15px] font-semibold">{p.label}</span>
              <span className="shrink-0 text-[12px] text-ink-3">{p.hint}</span>
            </Pressable>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
