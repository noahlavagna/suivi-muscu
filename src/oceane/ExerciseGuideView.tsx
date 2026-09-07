import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Figure } from './Figures';
import { guideFor } from './exerciseGuide';

/**
 * La fiche d'un exercice : schéma, prescription, et les rubriques du document.
 *
 * Le même bloc sert de fiche autonome (onglet Guide) et de contenu de la
 * feuille « Comment faire » ouverte en pleine séance — c'est le sens de
 * « tout au même endroit » : jamais deux versions à maintenir.
 */

function Rubric({
  label,
  tone = 'neutral',
  children,
}: {
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'rule';
  children: ReactNode;
}) {
  const tones = {
    neutral: 'bg-raised text-ink',
    good: 'bg-accent-dim text-ink',
    warn: 'bg-raised text-ink',
    rule: 'bg-accent-dim text-ink',
  } as const;
  const labelTone = {
    neutral: 'text-ink-3',
    good: 'text-accent',
    warn: 'text-negative',
    rule: 'text-accent',
  } as const;
  return (
    <div className={`mb-2.5 rounded-[var(--radius-card)] px-4 py-3 ${tones[tone]}`}>
      <p
        className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${labelTone[tone]}`}
      >
        {label}
      </p>
      <div className="text-[14px] leading-5.5 text-ink-2">{children}</div>
    </div>
  );
}

export function ExerciseGuideView({ exerciseId }: { exerciseId: string }) {
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  const g = guideFor(exerciseId);

  if (!g) {
    return (
      <p className="text-[14px] text-ink-2">
        Pas de fiche détaillée pour cet exercice — demande à Noah de t’en écrire une.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="rounded-full bg-accent-dim px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
          {g.tag}
        </span>
        <span className="tnum text-[13px] font-semibold text-ink-2">{g.prescription}</span>
      </div>
      <h2 className="text-[22px] font-bold leading-7 tracking-[-0.01em]">
        {exercise?.name ?? exerciseId}
      </h2>
      <p className="mt-1 text-[14px] leading-5.5 text-ink-2">{g.setup}</p>

      <div className="grad-bloom mt-4 mb-4 rounded-[var(--radius-card)] px-3 py-2">
        <Figure name={g.figure} />
      </div>

      {g.how && <Rubric label="Comment faire">{g.how}</Rubric>}
      {g.rule && (
        <Rubric label="Règle absolue" tone="rule">
          {g.rule}
        </Rubric>
      )}
      {g.why && (
        <Rubric label="À quoi ça sert pour toi" tone="good">
          {g.why}
        </Rubric>
      )}
      {g.feel && <Rubric label="Ce que tu dois sentir">{g.feel}</Rubric>}
      {g.wrong && (
        <Rubric label="Mal exécuté si" tone="warn">
          {g.wrong}
        </Rubric>
      )}
      {g.specific && <Rubric label="Spécifique à ton dos">{g.specific}</Rubric>}
      {g.mistakes && g.mistakes.length > 0 && (
        <Rubric label="Erreurs typiques">
          <ol className="ml-4 list-decimal space-y-1.5">
            {g.mistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ol>
        </Rubric>
      )}
      {g.easier && <Rubric label="Variante plus facile">{g.easier}</Rubric>}
      {g.harder && <Rubric label="Variante plus dure">{g.harder}</Rubric>}
    </div>
  );
}
