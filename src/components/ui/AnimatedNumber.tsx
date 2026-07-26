import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface Props {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

const defaultFormat = (v: number) => Math.round(v).toLocaleString('fr-FR');

/** Compteur interpolé en spring — jamais de saut de valeur. */
export function AnimatedNumber({ value, format = defaultFormat, className }: Props) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    if (reduced) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(current.current, value, {
      type: 'spring',
      stiffness: 180,
      damping: 26,
      onUpdate: (v) => {
        current.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span className={`tnum ${className ?? ''}`}>{format(display)}</span>
  );
}
