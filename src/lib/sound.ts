// Sons générés en WebAudio : aucun asset, latence minimale.
// L'AudioContext doit être créé/débloqué par un geste utilisateur (contrainte iOS).

let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (v: boolean) => (enabled = v);

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    ctx = new AudioContext();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, at: number, duration: number, gainPeak: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t = ctx.currentTime + at;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(gainPeak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sounds = {
  /** Fin de repos : deux notes ascendantes, discrètes */
  restEnd() {
    if (!enabled || !ctx) return;
    tone(880, 0, 0.35, 0.18);
    tone(1174.66, 0.16, 0.5, 0.18);
  },
  /** Nouveau record : arpège court */
  pr() {
    if (!enabled || !ctx) return;
    tone(659.25, 0, 0.25, 0.14);
    tone(830.61, 0.09, 0.25, 0.14);
    tone(987.77, 0.18, 0.45, 0.16);
  },
};
