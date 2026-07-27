import { motion } from 'framer-motion';
import { Pressable } from './Pressable';
import { springMicro } from '../../lib/springs';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}

/**
 * Pilule animée en transform pur (pas de layoutId : les shared layout animations
 * bloquent le démontage quand le contrôle vit dans une sheet qui se ferme).
 */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div role="tablist" aria-label={ariaLabel} className="relative flex rounded-[10px] bg-raised-2 p-[3px]">
      <motion.span
        aria-hidden
        className="absolute inset-y-[3px] left-[3px] rounded-[8px] bg-raised shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
        style={{ width: `calc((100% - 6px) / ${options.length})` }}
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={springMicro}
      />
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            role="tab"
            aria-selected={selected}
            tapScale={0.97}
            className="relative flex-1 rounded-[8px] px-3 py-1.5"
            onClick={() => onChange(o.value)}
          >
            <span
              className={`relative text-[13px] font-medium ${selected ? 'text-ink' : 'text-ink-2'}`}
            >
              {o.label}
            </span>
          </Pressable>
        );
      })}
    </div>
  );
}
