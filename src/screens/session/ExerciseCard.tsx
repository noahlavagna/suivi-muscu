import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { isDurationSet, isWarmupSets } from '../../db/types';
import { useSession, type SessionEntry } from '../../state/session';
import { useSettings } from '../../state/settings';
import { fmtNumber, fmtTimer, kgToUnit } from '../../lib/format';
import { fmtDateShort } from '../../lib/dates';
import { SetRow } from './SetRow';
import { Pressable } from '../../components/ui/Pressable';
import { IconCrown, IconNote, IconPlus, IconTimer, IconWrench, IconZap } from '../../components/ui/Icons';
import { ToolsSheet } from './ToolsSheet';

interface Props {
  entry: SessionEntry;
  entryIndex: number;
}

export function ExerciseCard({ entry, entryIndex }: Props) {
  const unit = useSettings((s) => s.unit);
  const addSet = useSession((s) => s.addSet);
  const setEntryNote = useSession((s) => s.setEntryNote);
  const [noteOpen, setNoteOpen] = useState(entry.note.length > 0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const exercise = useLiveQuery(() => db.exercises.get(entry.exerciseId), [entry.exerciseId]);
  const chargePR = useLiveQuery(
    () => db.prs.get(`${entry.exerciseId}:charge`),
    [entry.exerciseId],
  );
  const switchOption = useSession((s) => s.switchOption);
  const options = useLiveQuery(
    async () =>
      entry.optionExerciseIds.length > 1
        ? await db.exercises.bulkGet(entry.optionExerciseIds)
        : [],
    [entry.optionExerciseIds.join('|')],
  );

  if (!exercise) return null;

  // Le « OU » du programme : verrouillé dès qu'une série est validée
  const optionsLocked = entry.sets.some((s) => s.done);
  // Échauffement : ni disques ni séries d'approche à calculer, et pas de superset
  const warmup = isWarmupSets(entry.sets.map((s) => s.target));

  // La couronne : record de charge en jeu quand une série à venir s'en approche (< 5 %)
  const pendingWeights = entry.sets
    .filter((s) => !s.done && !isDurationSet(s.target) && s.weightKg > 0)
    .map((s) => s.weightKg);
  const pendingMax = pendingWeights.length > 0 ? Math.max(...pendingWeights) : 0;
  const crown =
    chargePR && pendingMax >= chargePR.value * 0.95
      ? pendingMax >= chargePR.value
        ? { text: `Couronne en jeu — record actuel ${fmtNumber(kgToUnit(chargePR.value, unit))} ${unit}` }
        : {
            text: `La couronne est à +${fmtNumber(kgToUnit(chargePR.value - pendingMax, unit))} ${unit}`,
          }
      : null;

  const lastLine = entry.last
    ? entry.last.sets
        .map((s) =>
          s.reps != null
            ? `${fmtNumber(kgToUnit(s.weightKg, unit))}×${s.reps}`
            : `${s.durationSec ?? 0} s`,
        )
        .join(' · ')
    : null;

  const doneCount = entry.sets.filter((s) => s.done).length;

  return (
    <div className="scroll-y h-full px-5 pb-56 pt-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-md bg-raised-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-2">
          {exercise.muscleGroups[0]}
        </span>
        {entry.supersetKey && (
          <span className="rounded-md bg-accent-dim px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            {/* Les postures s'enchaînent par le même mécanisme que les supersets,
                mais un échauffement n'en est pas un — le mot serait faux. */}
            {warmup ? 'Enchaîné' : 'Superset'}
          </span>
        )}
        <span className="flex items-center gap-1 text-[12px] text-ink-3">
          <IconTimer size={14} />
          <span className="tnum">{fmtTimer(entry.restSec)}</span>
        </span>
        <span className="tnum ml-auto text-[12px] font-medium text-ink-3">
          {doneCount}/{entry.sets.length}
        </span>
      </div>
      <h2 className="text-[22px] font-bold leading-7 tracking-[-0.01em]">{exercise.name}</h2>
      {entry.templateNote && (
        <p className="mt-0.5 text-[13px] font-medium text-accent">{entry.templateNote}</p>
      )}

      {options && options.length > 1 && (
        <div className="mt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              ou
            </span>
            {options.map((opt, oi) => {
              const on = oi === entry.optionIndex;
              return (
                <Pressable
                  key={opt?.id ?? oi}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                    on ? 'bg-accent text-canvas' : 'bg-raised text-ink-2'
                  } ${optionsLocked && !on ? 'opacity-40' : ''}`}
                  disabled={optionsLocked}
                  onClick={() => void switchOption(entryIndex, oi)}
                >
                  {opt?.name ?? '—'}
                </Pressable>
              );
            })}
          </div>
          {optionsLocked && (
            <p className="mt-1 text-[11px] text-ink-3">
              Choix figé : une série est déjà validée.
            </p>
          )}
        </div>
      )}
      {lastLine ? (
        <p className="tnum mt-1.5 text-[13px] text-ink-2">
          Dernière fois ({fmtDateShort(entry.last!.date)}) : {lastLine}
        </p>
      ) : (
        <p className="mt-1.5 text-[13px] text-ink-3">Première fois sur cet exercice</p>
      )}

      {entry.coach && (
        <p
          className={`tnum mt-1.5 flex items-center gap-1.5 text-[13px] font-medium ${
            entry.coach.kind === 'increase' ? 'text-accent' : 'text-ink-3'
          }`}
        >
          <IconZap size={14} /> {entry.coach.text}
        </p>
      )}

      {crown && (
        <div className="mt-2.5 flex items-center gap-2 rounded-[12px] bg-accent-dim px-3 py-2">
          <IconCrown size={16} className="shrink-0 text-accent" />
          <span className="tnum text-[13px] font-semibold text-accent">{crown.text}</span>
        </div>
      )}

      <div className="mt-4 rounded-[16px] bg-raised px-4 py-1">
        {entry.sets.map((set, si) => (
          <SetRow
            key={si}
            entryIndex={entryIndex}
            setIndex={si}
            set={set}
            exercise={exercise}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Pressable
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-raised py-2.5 text-[14px] font-semibold text-ink-2"
          onClick={() => addSet(entryIndex)}
        >
          <IconPlus size={16} /> Ajouter une série
        </Pressable>
        {!exercise.isTimeBased && !warmup && (
          <Pressable
            className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-raised text-ink-2"
            onClick={() => setToolsOpen(true)}
            aria-label="Outils : échauffement et disques"
          >
            <IconWrench size={18} />
          </Pressable>
        )}
        <Pressable
          className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${
            noteOpen || entry.note ? 'bg-accent-dim text-accent' : 'bg-raised text-ink-2'
          }`}
          onClick={() => setNoteOpen((v) => !v)}
          aria-label="Note sur cet exercice"
        >
          <IconNote size={18} />
        </Pressable>
      </div>

      <ToolsSheet
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        entry={entry}
        entryIndex={entryIndex}
        exercise={exercise}
      />

      {noteOpen && (
        <textarea
          className="mt-3 w-full rounded-[12px] bg-raised p-3 text-[15px] text-ink placeholder:text-ink-3"
          rows={2}
          placeholder="Note (sensations, réglage du banc…)"
          value={entry.note}
          onChange={(e) => setEntryNote(entryIndex, e.target.value)}
        />
      )}
    </div>
  );
}
