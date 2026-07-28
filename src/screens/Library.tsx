import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../db/types';
import { Screen, BackHeader } from '../components/Screen';
import { Pressable } from '../components/ui/Pressable';
import { Sheet } from '../components/ui/Sheet';
import { Stepper } from '../components/ui/Stepper';
import { Toggle } from '../components/ui/Toggle';
import { IconSearch } from '../components/ui/Icons';
import { fmtTimer } from '../lib/format';
import { matches } from '../lib/search';

export function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [only, setOnly] = useState<MuscleGroup | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const editing = exercises?.find((e) => e.id === editId) ?? null;

  const groups = useMemo(() => {
    const filtered = (exercises ?? []).filter(
      (e) => matches(e, query) && (only === null || e.muscleGroups[0] === only),
    );
    const byGroup = new Map<MuscleGroup, Exercise[]>();
    for (const g of MUSCLE_GROUPS) byGroup.set(g, []);
    for (const e of filtered) byGroup.get(e.muscleGroups[0])?.push(e);
    return [...byGroup.entries()].filter(([, list]) => list.length > 0);
  }, [exercises, query, only]);

  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  const patch = (p: Partial<Exercise>) => {
    if (editId) void db.exercises.update(editId, p);
  };

  return (
    <Screen bottomPadding={40}>
      <BackHeader title="Bibliothèque" />
      <div className="mb-4 flex items-center gap-2 rounded-[12px] bg-raised px-3">
        <IconSearch size={17} className="shrink-0 text-ink-3" />
        <input
          type="text"
          className="w-full bg-transparent py-2.5 text-[16px] text-ink placeholder:text-ink-3"
          placeholder="Rechercher un exercice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* 228 exercices au catalogue : le filtre par groupe évite le mur de liste */}
      <div className="scroll-x mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {MUSCLE_GROUPS.map((g) => (
          <Pressable
            key={g}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium capitalize ${
              only === g ? 'bg-accent text-canvas' : 'bg-raised text-ink-2'
            }`}
            onClick={() => setOnly(only === g ? null : g)}
          >
            {g}
          </Pressable>
        ))}
      </div>

      <p className="mb-3 text-[12px] text-ink-3">
        {total} exercice{total > 1 ? 's' : ''}
      </p>

      {groups.map(([group, list]) => (
        <section key={group} className="mb-5">
          <p className="mb-1.5 text-[13px] font-medium uppercase tracking-wide text-ink-3">
            {group}
          </p>
          <div className="rounded-[16px] bg-raised px-4">
            {list
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e) => (
                <Pressable
                  key={e.id}
                  className={`flex w-full items-baseline justify-between gap-3 border-b border-sep py-3 text-left last:border-b-0 ${
                    e.archivedAt ? 'opacity-45' : ''
                  }`}
                  onClick={() => setEditId(e.id)}
                >
                  <span className="min-w-0 truncate text-[15px] font-medium">{e.name}</span>
                  <span className="tnum shrink-0 text-[12px] text-ink-3">
                    {e.archivedAt ? 'archivé' : `±${e.weightIncrementKg} kg · ${fmtTimer(e.defaultRestSec)}`}
                  </span>
                </Pressable>
              ))}
          </div>
        </section>
      ))}

      <Sheet open={editing !== null} onClose={() => setEditId(null)} ariaLabel="Modifier l’exercice">
        {editing && (
          <div className="pb-3 pt-1">
            <input
              type="text"
              className="mb-4 w-full rounded-[12px] bg-raised-2 px-3.5 py-3 text-[17px] font-bold text-ink"
              value={editing.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
            <p className="mb-1.5 text-[13px] font-medium uppercase tracking-wide text-ink-3">
              Groupe principal
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((g) => (
                <Pressable
                  key={g}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    editing.muscleGroups[0] === g
                      ? 'bg-accent text-canvas'
                      : 'bg-raised-2 text-ink-2'
                  }`}
                  onClick={() =>
                    patch({ muscleGroups: [g, ...editing.muscleGroups.filter((x) => x !== g)] })
                  }
                >
                  {g}
                </Pressable>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-[12px] bg-raised-2 px-4 py-3">
                <span className="text-[14px] font-medium">Incrément de poids</span>
                <Stepper
                  size="sm"
                  value={editing.weightIncrementKg}
                  step={0.5}
                  min={0.5}
                  onChange={(v) => patch({ weightIncrementKg: v })}
                  format={(v) => `${v} kg`}
                  ariaLabel="Incrément"
                />
              </div>
              <div className="flex items-center justify-between rounded-[12px] bg-raised-2 px-4 py-3">
                <span className="text-[14px] font-medium">Repos par défaut</span>
                <Stepper
                  size="sm"
                  value={editing.defaultRestSec}
                  step={15}
                  min={15}
                  onChange={(v) => patch({ defaultRestSec: v })}
                  format={(v) => fmtTimer(v)}
                  ariaLabel="Repos"
                />
              </div>
              <div className="flex items-center justify-between rounded-[12px] bg-raised-2 px-4 py-3">
                <span className="text-[14px] font-medium">Exercice en durée (secondes)</span>
                <Toggle
                  checked={editing.isTimeBased}
                  onChange={(v) => patch({ isTimeBased: v })}
                  ariaLabel="Exercice en durée"
                />
              </div>
            </div>

            <Pressable
              className="mt-4 w-full rounded-[12px] py-3 text-[15px] font-semibold text-negative"
              onClick={() => {
                patch({ archivedAt: editing.archivedAt ? undefined : Date.now() });
                setEditId(null);
              }}
            >
              {editing.archivedAt ? 'Restaurer l’exercice' : 'Archiver l’exercice'}
            </Pressable>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
