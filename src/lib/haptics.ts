// navigator.vibrate n'existe pas sur iOS Safari — les guards rendent l'appel inoffensif.
// Sur iOS, le retour « physique » passe par le son (voir sound.ts).

let enabled = true;
export const setHapticsEnabled = (v: boolean) => (enabled = v);

function vibrate(pattern: number | number[]) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supporté */
  }
}

export const haptics = {
  light: () => vibrate(10),
  setDone: () => vibrate(22),
  exerciseDone: () => vibrate([26, 50, 26, 50, 70]),
  tick: () => vibrate(8),
  restEnd: () => vibrate([120, 70, 120, 70, 180]),
  pr: () => vibrate([30, 40, 30, 40, 60]),
  levelUp: () => vibrate([40, 50, 40, 50, 40, 60, 200]),
};
