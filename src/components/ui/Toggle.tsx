import { motion } from 'framer-motion';
import { springMicro } from '../../lib/springs';
import { haptics } from '../../lib/haptics';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}

export function Toggle({ checked, onChange, ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`flex h-[30px] w-[50px] items-center rounded-full p-[3px] transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-raised-2'
      }`}
      onClick={() => {
        haptics.light();
        onChange(!checked);
      }}
    >
      <motion.span
        className="h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={springMicro}
      />
    </button>
  );
}
