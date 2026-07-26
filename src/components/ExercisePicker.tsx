import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '../db/db';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../db/types';
import { useSettings } from '../state/settings';
import { Sheet } from './ui/Sheet';
import { Pressable } from './ui/Pressable';
import { IconPlus, IconSearch } from './ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}

export function ExercisePicker({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('pectoraux');
  const defaultRestSec = useSettings((s) => s.defaultRestSec);
  const exercises = useLiveQuery(
    () => db.exercises.filter((e) => !e.archivedAt).toArray(),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (exercises ?? []).filter(
      (e) => q === '' || e.name.toLowerCase().includes(q) || e.muscleGroups.some((g) => g.includes(q)),
    );
    return list.sort(
      (a, b) =>
        a.muscleGroups[0].localeCompare(b.muscleGroups[0]) || a.name.localeCompare(b.name),
    );
  }, [exercises, query]);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const exercise: Exercise = {
      id: nanoid(),
      name,
      muscleGroups: [newGroup],
      weightIncrementKg: 2.5,
      defaultRestSec,
      isTimeBased: false,
    };
    await db.exercises.put(exercise);
    setCreating(false);
    setNewName('');
    onPick(exercise);
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Choisir un exercice">
      <div className="pb-2 pt-1">
        <h2 className="mb-3 text-[20px] font-bold">Ajouter un exercice</h2>
        <div className="mb-3 flex items-center gap-2 rounded-[12px] bg-raised-2 px-3">
          <IconSearch size={17} className="shrink-0 text-ink-3" />
          <input
            type="text"
            className="w-full bg-transparent py-2.5 text-[16px] text-ink placeholder:text-ink-3"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!creating ? (
          <Pressable
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-sep py-2.5 text-[14px] font-semibold text-accent"
            onClick={() => {
              setCreating(true);
              setNewName(query.trim());
            }}
          >
            <IconPlus size={16} /> Créer un exercice
          </Pressable>
        ) : (
          <div className="mb-3 rounded-[12px] bg-raised-2 p-3">
            <input
              type="text"
              className="mb-2.5 w-full rounded-[10px] bg-raised px-3 py-2.5 text-[16px] text-ink placeholder:text-ink-3"
              placeholder="Nom de l’exercice"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((g) => (
                <Pressable
                  key={g}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    newGroup === g ? 'bg-accent text-canvas' : 'bg-raised text-ink-2'
                  }`}
                  onClick={() => setNewGroup(g)}
                >
                  {g}
                </Pressable>
              ))}
            </div>
            <div className="flex gap-2">
              <Pressable
                className="flex-1 rounded-[10px] bg-accent py-2.5 text-[14px] font-semibold text-canvas disabled:opacity-40"
                disabled={newName.trim() === ''}
                onClick={() => void create()}
              >
                Créer et ajouter
              </Pressable>
              <Pressable
                className="rounded-[10px] bg-raised px-4 py-2.5 text-[14px] font-semibold text-ink-2"
                onClick={() => setCreating(false)}
              >
                Annuler
              </Pressable>
            </div>
          </div>
        )}

        <ul className="pb-4">
          {filtered.map((e) => (
            <li key={e.id}>
              <Pressable
                className="flex w-full items-baseline justify-between gap-3 border-b border-sep py-3 text-left last:border-b-0"
                onClick={() => onPick(e)}
              >
                <span className="min-w-0 truncate text-[15px] font-medium">{e.name}</span>
                <span className="shrink-0 text-[12px] text-ink-3">{e.muscleGroups[0]}</span>
              </Pressable>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
