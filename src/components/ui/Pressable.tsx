import { motion, type HTMLMotionProps } from 'framer-motion';
import { springMicro } from '../../lib/springs';
import { unlockAudio } from '../../lib/sound';

type Props = HTMLMotionProps<'button'> & {
  /** Échelle au tap (0.96 par défaut, façon iOS) */
  tapScale?: number;
};

/** Bouton de base : scale au tap + retour en spring, débloque l'audio au passage. */
export function Pressable({ tapScale = 0.96, onClick, style, ...props }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: tapScale }}
      transition={springMicro}
      style={{ WebkitTapHighlightColor: 'transparent', ...style }}
      onClick={(e) => {
        unlockAudio();
        onClick?.(e);
      }}
      {...props}
    />
  );
}
