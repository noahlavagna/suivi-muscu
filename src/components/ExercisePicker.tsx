import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '../db/db';
import {
  EQUIPMENTS,
  FAMILIES,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type ExerciseFamily,
  type MuscleGroup,
} from '../db/types';
import { useSettings } from '../state/settings';
import { matches, relevance } from '../lib/search';
import { Sheet } from './ui/Sheet';
import { Pressable } from './ui/Pressable';
import { IconCheck, IconPlus, IconSearch, IconX } from './ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Reçoit tout ce qui a été coché en une fois */
  onPick: (exercises: Exercise[]) => void;
  /** Exercices déjà dans la séance : signalés pour éviter les doublons */
  alreadyIn?: string[];
}

type Filter =
  | { kind: 'none' }
  | { kind: 'group'; value: MuscleGroup }
  | { kind: 'equipment'; value: Equipment }
  | { kind: 'family'; value: ExerciseFamily };

/** Chip de filtre — même rendu pour les trois dimensions */
function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <Pressable
      className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium capitalize ${
        on ? 'bg-accent text-canvas' : 'bg-raised-2 text-ink-2'
      }`}
      onClick={onClick}
    >
      {label}
    </Pressable>
  );
}

export function ExercisePicker({ open, onClose, onPick, alreadyIn = [] }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>({ kind: 'none' });
  const [tab, setTab] = useState<'groupe' | 'matériel' | 'type'>('groupe');
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('pectoraux');
  const defaultRestSec = useSettings((s) => s.defaultRestSec);

  const exercises = useLiveQuery(() => db.exercises.filter((e) => !e.archivedAt).toArray(), []);

  // Fréquence d'usage, pour remonter les habitués quand aucune recherche n'est tapée
  const usage = useLiveQuery(async () => {
    const logs = await db.setLogs.toArray();
    const count = new Map<string, number>();
    for (const l of logs) count.set(l.exerciseId, (count.get(l.exerciseId) ?? 0) + 1);
    return count;
  }, []);

  // Repart d'une feuille propre à chaque ouverture
  useEffect(() => {
    if (open) {
      setQuery('');
      setFilter({ kind: 'none' });
      setPicked([]);
      setCreating(false);
    }
  }, [open]);

  const inSession = useMemo(() => new Set(alreadyIn), [alreadyIn]);

  const filtered = useMemo(() => {
    const list = (exercises ?? []).filter((e) => {
      if (!matches(e, query)) return false;
      if (filter.kind === 'group') return e.muscleGroups.includes(filter.value);
      if (filter.kind === 'equipment') return e.equipment === filter.value;
      if (filter.kind === 'family') return e.family === filter.value;
      return true;
    });
    const used = usage ?? new Map<string, number>();
    return list.sort((a, b) => {
      if (query.trim() !== '') {
        const r = relevance(a, query) - relevance(b, query);
        if (r !== 0) return r;
      } else {
        // Sans recherche : les plus pratiqués d'abord, ils sont le plus souvent voulus
        const u = (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0);
        if (u !== 0) return u;
      }
      return a.name.localeCompare(b.name);
    });
  }, [exercises, query, filter, usage]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const confirm = () => {
    const byId = new Map((exercises ?? []).map((e) => [e.id, e]));
    const chosen = picked.map((id) => byId.get(id)).filter((e): e is Exercise => e !== undefined);
    if (chosen.length > 0) onPick(chosen);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const exercise: Exercise = {
      id: nanoid(),
      name,
      muscleGroups: [newGroup],
      equipment: 'autre',
      family: newGroup === 'mobilité' ? 'mobilité' : 'isolation',
      weightIncrementKg: 2.5,
      defaultRestSec,
      isTimeBased: newGroup === 'mobilité',
    };
    await db.exercises.put(exercise);
    setCreating(false);
    setNewName('');
    onPick([exercise]);
  };

  const chips =
    tab === 'groupe' ? MUSCLE_GROUPS : tab === 'matériel' ? EQUIPMENTS : FAMILIES;
  const activeValue = filter.kind === 'none' ? null : filter.value;

  const setChip = (value: string) => {
    if (activeValue === value) return setFilter({ kind: 'none' });
    if (tab === 'groupe') return setFilter({ kind: 'group', value: value as MuscleGroup });
    if (tab === 'matériel') return setFilter({ kind: 'equipment', value: value as Equipment });
    setFilter({ kind: 'family', value: value as ExerciseFamily });
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Choisir un exercice">
      <div className="flex max-h-[72vh] flex-col pt-1">
        <h2 className="mb-3 text-[20px] font-bold">Ajouter des exercices</h2>

        <div className="mb-2.5 flex items-center gap-2 rounded-[12px] bg-raised-2 px-3">
          <IconSearch size={17} className="shrink-0 text-ink-3" />
          <input
            type="text"
            className="w-full bg-transparent py-2.5 text-[16px] text-ink placeholder:text-ink-3"
            placeholder="Rechercher — accents inutiles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query !== '' && (
            <button type="button" className="shrink-0 text-ink-3" onClick={() => setQuery('')}>
              <IconX size={16} />
            </button>
          )}
        </div>

        {/* Dimension de filtrage puis valeurs, pour tenir sur deux lignes */}
        <div className="mb-2 flex gap-1.5">
          {(['groupe', 'matériel', 'type'] as const).map((t) => (
            <Pressable
              key={t}
              className={`flex-1 rounded-[10px] py-1.5 text-[13px] font-semibold capitalize ${
                tab === t ? 'bg-raised-2 text-ink' : 'text-ink-3'
              }`}
              onClick={() => {
                setTab(t);
                setFilter({ kind: 'none' });
              }}
            >
              {t}
            </Pressable>
          ))}
        </div>
        <div className="scroll-x mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {chips.map((c) => (
            <Chip key={c} label={c} on={activeValue === c} onClick={() => setChip(c)} />
          ))}
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
                <Chip key={g} label={g} on={newGroup === g} onClick={() => setNewGroup(g)} />
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

        <ul className="scroll-y -mx-1 min-h-0 flex-1 px-1">
          {filtered.length === 0 && (
            <li className="py-8 text-center text-[14px] text-ink-3">
              Aucun exercice ne correspond.
            </li>
          )}
          {filtered.map((e) => {
            const on = picked.includes(e.id);
            return (
              <li key={e.id}>
                <Pressable
                  className="flex w-full items-center gap-3 border-b border-sep py-2.5 text-left last:border-b-0"
                  onClick={() => toggle(e.id)}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${
                      on ? 'bg-accent text-canvas' : 'bg-raised-2 text-transparent'
                    }`}
                  >
                    <IconCheck size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate text-[15px] font-medium">{e.name}</span>
                      {inSession.has(e.id) && (
                        <span className="shrink-0 rounded-full bg-raised-2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-3">
                          déjà
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[12px] text-ink-3">
                      {e.muscleGroups[0]}
                      {e.equipment ? ` · ${e.equipment}` : ''}
                    </span>
                  </span>
                </Pressable>
              </li>
            );
          })}
        </ul>

        <div className="pt-2.5">
          <Pressable
            className="w-full rounded-[12px] bg-accent py-3 text-[15px] font-semibold text-canvas disabled:opacity-40"
            disabled={picked.length === 0}
            onClick={confirm}
          >
            {picked.length === 0
              ? 'Sélectionne des exercices'
              : `Ajouter ${picked.length} exercice${picked.length > 1 ? 's' : ''}`}
          </Pressable>
        </div>
      </div>
    </Sheet>
  );
}
