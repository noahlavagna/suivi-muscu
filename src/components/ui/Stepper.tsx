import { useRef, useState } from 'react';
import { Pressable } from './Pressable';
import { AnimatedNumber } from './AnimatedNumber';
import { IconMinus, IconPlus } from './Icons';
import { haptics } from '../../lib/haptics';

interface Props {
  value: number;
  step: number;
  min?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  label?: string;
  size?: 'md' | 'sm';
  ariaLabel: string;
  /**
   * Saisie au clavier : un tap sur la valeur ouvre un champ. Les machines ont
   * des piles aux paliers irréguliers (4,5 · 7 · 11,3 kg) qu'aucun pas fixe
   * n'atteint — les +/− restent pour les réglages courants.
   * `toText` donne le texte de départ, `fromText` convertit la saisie (unité),
   * `onSubmit` remplace `onChange` pour une valeur tapée.
   */
  edit?: {
    toText: (v: number) => string;
    fromText: (n: number) => number;
    onSubmit?: (v: number) => void;
  };
}

/** Stepper +/− avec répétition au maintien. */
export function Stepper({
  value,
  step,
  min = 0,
  onChange,
  format,
  disabled,
  label,
  size = 'md',
  ariaLabel,
  edit,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();
  const repeat = useRef<ReturnType<typeof setInterval>>();
  const latest = useRef({ value, step, min, onChange });
  latest.current = { value, step, min, onChange };

  const bump = (dir: 1 | -1) => {
    const { value, step, min, onChange } = latest.current;
    const next = Math.max(min, Math.round((value + dir * step) * 100) / 100);
    if (next !== value) {
      haptics.light();
      onChange(next);
    }
  };

  const startHold = (dir: 1 | -1) => {
    endHold();
    holdTimer.current = setTimeout(() => {
      repeat.current = setInterval(() => bump(dir), 120);
    }, 450);
  };
  const endHold = () => {
    clearTimeout(holdTimer.current);
    clearInterval(repeat.current);
  };

  const btn =
    size === 'md'
      ? 'flex h-11 w-11 items-center justify-center rounded-[10px] bg-raised-2 text-ink-2 disabled:opacity-35'
      : 'flex h-9 w-9 items-center justify-center rounded-[9px] bg-raised-2 text-ink-2 disabled:opacity-35';
  const valueCls =
    size === 'md'
      ? 'w-[72px] text-center text-[22px] font-semibold leading-7'
      : 'w-[54px] text-center text-[18px] font-semibold leading-6';

  const commit = () => {
    if (draft == null || !edit) return;
    const n = Number(draft.replace(',', '.').trim());
    setDraft(null);
    if (draft.trim() === '' || !Number.isFinite(n)) return;
    const next = Math.max(min, Math.round(edit.fromText(n) * 100) / 100);
    if (next !== value) {
      haptics.light();
      (edit.onSubmit ?? onChange)(next);
    }
  };

  const holdProps = (dir: 1 | -1) => ({
    onPointerDown: () => startHold(dir),
    onPointerUp: endHold,
    onPointerLeave: endHold,
    onPointerCancel: endHold,
  });

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{label}</span>
      )}
      <div className={size === 'md' ? 'flex items-center gap-2' : 'flex items-center gap-1'}>
        <Pressable
          className={btn}
          disabled={disabled}
          onClick={() => bump(-1)}
          {...holdProps(-1)}
          aria-label={`${ariaLabel} : moins`}
        >
          <IconMinus size={size === 'md' ? 20 : 17} />
        </Pressable>
        {draft != null ? (
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            className={`${valueCls} tnum rounded-[8px] bg-raised-2 text-ink outline-none ring-2 ring-accent`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setDraft(null);
            }}
            aria-label={ariaLabel}
          />
        ) : edit && !disabled ? (
          <button
            type="button"
            className="rounded-[8px] underline decoration-ink-3/40 decoration-dotted underline-offset-4"
            onClick={() => setDraft(edit.toText(value))}
            aria-label={`${ariaLabel} : saisir`}
          >
            <AnimatedNumber value={value} format={format} className={valueCls} />
          </button>
        ) : (
          <AnimatedNumber value={value} format={format} className={valueCls} />
        )}
        <Pressable
          className={btn}
          disabled={disabled}
          onClick={() => bump(1)}
          {...holdProps(1)}
          aria-label={`${ariaLabel} : plus`}
        >
          <IconPlus size={size === 'md' ? 20 : 17} />
        </Pressable>
      </div>
    </div>
  );
}
