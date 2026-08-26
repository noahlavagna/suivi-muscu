// Sons générés en WebAudio : aucun asset, latence minimale.
// L'AudioContext doit être créé/débloqué par un geste utilisateur (contrainte iOS).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export const setSoundEnabled = (v: boolean) => (enabled = v);

/**
 * Chaîne maître : gain généreux suivi d'un compresseur.
 *
 * Sur le haut-parleur d'un téléphone posé au sol dans une salle bruyante, un
 * simple gain fort sature et devient inaudible ; le compresseur laisse monter
 * le niveau perçu sans écrêter, ce qui rend la fin de repos vraiment entendue.
 */
function ensureChain(): void {
  if (!ctx || master) return;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 8;
  comp.attack.value = 0.002;
  comp.release.value = 0.16;
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp).connect(ctx.destination);
}

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    ctx = new AudioContext();
    ensureChain();
  } catch {
    ctx = null;
  }
}

type Wave = OscillatorType;

/** Note simple, enveloppe percussive. `glide` fait monter la hauteur pendant la note. */
function tone(
  freq: number,
  at: number,
  duration: number,
  peak: number,
  wave: Wave = 'sine',
  glide?: number,
) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  const t = ctx.currentTime + at;
  osc.frequency.setValueAtTime(freq, t);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Deux oscillateurs légèrement désaccordés : timbre métallique, plus « corps ». */
function metal(freq: number, at: number, duration: number, peak: number) {
  tone(freq, at, duration, peak, 'triangle');
  tone(freq * 2.02, at, duration * 0.55, peak * 0.35, 'sine');
}

/** Bruit filtré court — le choc du marteau sur l'enclume. */
function strike(at: number, duration: number, peak: number, cutoff = 2600) {
  if (!ctx || !master) return;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Décroissance exponentielle : l'attaque porte tout, la queue s'efface
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = cutoff;
  filter.Q.value = 0.9;
  const gain = ctx.createGain();
  gain.gain.value = peak;
  src.connect(filter).connect(gain).connect(master);
  src.start(ctx.currentTime + at);
}

const ready = () => enabled && ctx !== null && master !== null;

export const sounds = {
  /** Série validée : le coup de marteau — court, sec, jamais fatigant. */
  setDone() {
    if (!ready()) return;
    strike(0, 0.09, 0.32, 3200);
    tone(196, 0, 0.14, 0.3, 'sine');
    tone(1568, 0.01, 0.13, 0.1, 'triangle');
  },

  /** Exercice bouclé : trois notes montantes, franches. */
  exerciseDone() {
    if (!ready()) return;
    metal(523.25, 0, 0.22, 0.3);
    metal(659.25, 0.1, 0.24, 0.3);
    metal(880, 0.2, 0.5, 0.34);
  },

  /** Décompte des dernières secondes de repos. */
  restTick() {
    if (!ready()) return;
    tone(1046.5, 0, 0.07, 0.22, 'triangle');
  },

  /**
   * Fin de repos : trois pulsations à deux tons, au niveau le plus haut de
   * l'app. C'est le seul son qui doit percer un casque ou une salle bruyante.
   */
  restEnd() {
    if (!ready()) return;
    for (let i = 0; i < 3; i++) {
      const at = i * 0.22;
      strike(at, 0.05, 0.3, 4200);
      metal(1046.5, at, 0.18, 0.55);
      metal(1567.98, at + 0.08, 0.2, 0.5);
    }
    tone(2093, 0.66, 0.6, 0.34, 'triangle');
  },

  /** Nouveau record : arpège ascendant, plus riche que les autres. */
  pr() {
    if (!ready()) return;
    strike(0, 0.07, 0.22, 3600);
    metal(659.25, 0, 0.26, 0.34);
    metal(830.61, 0.09, 0.26, 0.34);
    metal(987.77, 0.18, 0.3, 0.36);
    metal(1318.51, 0.28, 0.7, 0.4);
  },

  /** Montée de palier : fanfare de forge, la récompense la plus rare. */
  levelUp() {
    if (!ready()) return;
    strike(0, 0.16, 0.34, 1800);
    tone(130.81, 0, 0.5, 0.28, 'sine');
    const arp = [392, 523.25, 659.25, 783.99, 1046.5];
    arp.forEach((f, i) => metal(f, 0.1 + i * 0.085, 0.35, 0.32));
    metal(1318.51, 0.1 + arp.length * 0.085, 1.1, 0.42);
    tone(1975.53, 0.14 + arp.length * 0.085, 1.3, 0.16, 'sine', 2093);
  },
};
