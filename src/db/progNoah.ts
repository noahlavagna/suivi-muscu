import { db } from './db';
import type { BlockRow, TargetSet, TemplateItem, WorkoutTemplate } from './types';
import { startOfWeek, toISODate } from '../lib/dates';
import { restLabel } from '../lib/block';

/**
 * « TRAIN PROG NOAH » — transcription fidèle du programme papier.
 *
 * Quatre semaines de la même trame Push / Pull / Legs & Abs (+ Upper
 * facultatif), à intensité croissante : le RIR descend, la récup monte, le
 * volume se resserre. La semaine 4 est le programme final : une fois atteinte,
 * le bloc y reste (`holdLastWeek`).
 *
 * Deux exercices portent un « OU » du programme, alterné une semaine sur deux
 * tant que l'Upper n'est pas ajouté — voir `alternateByWeek`.
 */

export const NOAH_BLOCK_ID = 'block-noah';

export const NOAH_PRESET_META = {
  id: NOAH_BLOCK_ID,
  name: 'TRAIN PROG NOAH',
  daysLabel: 'Lun · Mer · Ven',
  desc: 'Push · Pull · Legs & Abs sur 4 paliers — RIR décroissant, récup croissante, Upper en option. Le palier monte quand tu as bouclé toutes ses séances.',
};

const WEEKS: BlockRow['weeks'] = [
  { week: 1, rir: 'RIR 3/4', restSec: 90 },
  { week: 2, rir: 'RIR 2/3', restSec: 120 },
  { week: 3, rir: 'RIR 1/2', restSec: 150 },
  { week: 4, rir: 'RIR 0/1', restSec: 180, restSecMax: 210 },
];

/* ————————————————— Fabriques de séries ————————————————— */

/** `n` séries de `r` répétitions — le programme donne des cibles exactes. */
const reps = (n: number, r: number): TargetSet[] =>
  Array.from({ length: n }, () => ({ type: 'normal' as const, repsMin: r, repsMax: r }));

/** « 3 séries de 3-3-3 reps (15 sec entre) » */
const clusters = (n: number): TargetSet[] =>
  Array.from({ length: n }, () => ({
    type: 'cluster' as const,
    cluster: { reps: 3, count: 3, restSec: 15 },
  }));

/** « 2 séries de 45 à 60 sec » */
const holds = (n: number, sec: number, secMax: number): TargetSet[] =>
  Array.from({ length: n }, () => ({
    type: 'hold' as const,
    durationSec: sec,
    durationSecMax: secMax,
  }));

/**
 * Une entrée d'échauffement — sans objectif chiffré : le programme n'en donne
 * aucun, et la consigne réelle est « jusqu'à ce que ce soit bon ».
 */
const warm1 = (): TargetSet[] => [{ type: 'échauffement' }];

/** Sélectionne la variante de la semaine `w` (1-indexée) dans un tableau de 4. */
const byWeek = <T,>(w: number, all: [T, T, T, T]): T => all[w - 1];

/* ————————————————— Échauffements ————————————————— */

/**
 * Le programme place l'échauffement « avant le début de la montée en gamme du
 * premier exo » : il ouvre donc la séance, en un seul enchaînement (superset)
 * pour ne pas déclencher de repos complet entre deux postures.
 *
 * Aucune posture n'est chiffrée : chacune se valide à la sensation.
 */
const WARM_KEY = 'echauffement';

const warm = (exerciseId: string, sets: TargetSet[], note?: string): TemplateItem => ({
  exerciseId,
  sets,
  supersetKey: WARM_KEY,
  restSecOverride: 15,
  ...(note ? { note } : {}),
});

const ROTATION_EXTERNE = warm(
  'rotation-externe-elastique',
  warm1(),
  'Élastique ou poulie hauteur coude',
);
const ROTATIONS_EPAULES = warm('rotation-epaules-uni', warm1(), 'Unilatéral');
const CHIEN_CHAT: TemplateItem[] = [
  warm('chien-tete-en-bas', warm1()),
  warm('chat-vache', warm1(), 'Chat tête en haut'),
];

const WARMUP_PUSH: TemplateItem[] = [
  warm('etirement-pectoraux', warm1(), 'Grand pectoral'),
  ROTATIONS_EPAULES,
  ROTATION_EXTERNE,
];

const WARMUP_PULL: TemplateItem[] = [
  warm('etirement-trapezes', warm1()),
  ROTATIONS_EPAULES,
  ROTATION_EXTERNE,
  ...CHIEN_CHAT,
];

const WARMUP_LEGS: TemplateItem[] = [
  warm('etirement-quadriceps', warm1(), 'Unilatéral, suivi des montées de genoux'),
  warm('montee-genoux', warm1(), 'Unilatéral'),
  warm('etirement-ischios', warm1(), 'Unilatéral, suivi des talons-fesses'),
  warm('talons-fesses', warm1(), 'Unilatéral'),
  warm('balancement-jambes', warm1(), 'Unilatéral'),
  ...CHIEN_CHAT,
  warm('superman', warm1()),
];

const WARMUP_UPPER: TemplateItem[] = [
  warm('etirement-trapezes', warm1()),
  ROTATIONS_EPAULES,
  ROTATION_EXTERNE,
  warm('etirement-pectoraux', warm1(), 'Grand pectoral'),
  ...CHIEN_CHAT,
];

/* ————————————————— Séances ————————————————— */

const push = (w: number): TemplateItem[] => [
  {
    // « Développé incliné smith OU Pec fly (1 sem sur 2 si pas upper ajouté) »
    exerciseId: 'dev-incline-smith',
    sets: byWeek(w, [reps(4, 8), reps(3, 8), clusters(3), clusters(3)]),
    alternateByWeek: true,
    variants: [
      {
        exerciseId: 'pec-fly-vav',
        sets: byWeek(w, [reps(3, 10), reps(3, 10), reps(3, 8), reps(3, 10)]),
      },
    ],
  },
  {
    exerciseId: 'dev-epaules-machine',
    sets: byWeek(w, [reps(3, 12), reps(3, 10), reps(2, 8), reps(2, 8)]),
    note: 'Assis, cran 2',
  },
  {
    exerciseId: 'elev-lat-banc-incline',
    sets: byWeek(w, [reps(3, 12), reps(3, 12), reps(3, 10), reps(3, 10)]),
    note: 'Banc incliné 45°',
  },
  {
    exerciseId: 'skull-crusher-incline',
    sets: reps(2, 12),
    note: w === 1 ? 'Barre EZ, banc incliné' : 'Barre EZ, banc incliné 15 ou 30°',
  },
];

const pull = (w: number): TemplateItem[] => [
  {
    exerciseId: 'rowing-machine',
    sets: byWeek(w, [reps(4, 10), reps(3, 10), reps(3, 10), reps(3, 10)]),
    note: 'Prise pronation, coudes ouverts',
  },
  {
    // « Tirage vertical prise neutre OU pronation (1 sem sur 2 si pas upper ajouté) »
    exerciseId: 'tirage-vertical-neutre',
    sets: byWeek(w, [reps(3, 10), reps(3, 10), reps(3, 10), reps(3, 8)]),
    alternateByWeek: true,
    variants: [
      {
        exerciseId: 'tirage-vertical-barre',
        sets: byWeek(w, [reps(3, 10), reps(3, 10), reps(3, 10), reps(3, 8)]),
        note: 'Prise pronation',
      },
    ],
  },
  {
    exerciseId: 'oiseau-poulie-uni',
    sets: byWeek(w, [reps(3, 12), reps(3, 12), reps(2, 12), reps(2, 12)]),
    note: 'Unilatéral',
  },
  { exerciseId: 'curl-pupitre', sets: reps(2, 12), note: 'Barre EZ' },
];

const legs = (w: number): TemplateItem[] => [
  {
    exerciseId: 'souleve-roumain',
    sets: byWeek(w, [reps(4, 10), reps(3, 10), reps(3, 10), reps(3, 8)]),
    note: 'RDL',
  },
  { exerciseId: 'hack-squat', sets: reps(3, 8) },
  {
    exerciseId: 'machine-adducteurs',
    sets: byWeek(w, [reps(3, 12), reps(3, 12), reps(2, 10), reps(2, 10)]),
  },
  { exerciseId: 'planche', sets: holds(2, 45, 60), note: 'Planche frontale sur les coudes' },
];

const upper = (w: number): TemplateItem[] => [
  { exerciseId: 'face-pull', sets: reps(3, 10) },
  {
    exerciseId: 'pec-fly-vav',
    sets: byWeek(w, [reps(3, 10), reps(3, 10), reps(2, 10), reps(2, 8)]),
  },
  {
    exerciseId: 'elev-lat-banc-incline',
    sets: byWeek(w, [reps(3, 12), reps(2, 12), reps(3, 10), reps(3, 10)]),
    note: 'Banc incliné 45°',
  },
  {
    exerciseId: 'tirage-vertical-barre',
    sets: byWeek(w, [reps(3, 10), reps(3, 10), reps(2, 10), reps(2, 8)]),
    note: 'Prise pronation',
  },
];

interface DaySpec {
  key: string;
  name: string;
  weekday: number;
  warmup: TemplateItem[];
  build: (week: number) => TemplateItem[];
  optional?: boolean;
}

const DAYS: DaySpec[] = [
  { key: 'push', name: 'Push', weekday: 1, warmup: WARMUP_PUSH, build: push },
  { key: 'pull', name: 'Pull', weekday: 3, warmup: WARMUP_PULL, build: pull },
  { key: 'legs', name: 'Legs & Abs', weekday: 5, warmup: WARMUP_LEGS, build: legs },
  {
    key: 'upper',
    name: 'Upper',
    weekday: 6,
    warmup: WARMUP_UPPER,
    build: upper,
    optional: true,
  },
];

export function buildTemplates(): WorkoutTemplate[] {
  const templates: WorkoutTemplate[] = [];
  for (const week of WEEKS) {
    for (const day of DAYS) {
      const working = day.build(week.week).map((item) => ({
        ...item,
        restSecOverride: week.restSec,
      }));
      templates.push({
        id: `noah-${day.key}-${week.week}`,
        name: day.name,
        weekdays: [day.weekday],
        order: 0, // renuméroté à l'installation
        blockId: NOAH_BLOCK_ID,
        week: week.week,
        ...(day.optional ? { optionalDay: true } : {}),
        note: `${week.rir} · récup ${restLabel(week.restSec, week.restSecMax)}`,
        items: [...day.warmup, ...working],
      });
    }
  }
  return templates;
}

/**
 * Installe (ou réinstalle) le bloc. Les réglages qui appartiennent à
 * l'utilisateur survivent à une réinstallation : jours de la semaine choisis
 * pour chaque séance, ancre du bloc, Upper activé ou non.
 */
export async function applyNoahProgram(): Promise<void> {
  const [previousBlock, allTemplates] = await Promise.all([
    db.blocks.get(NOAH_BLOCK_ID),
    db.templates.toArray(),
  ]);
  const previousDays = new Map(
    allTemplates.filter((t) => t.blockId === NOAH_BLOCK_ID).map((t) => [t.id, t]),
  );
  const others = allTemplates.filter((t) => t.blockId !== NOAH_BLOCK_ID);
  const orderStart = others.length > 0 ? Math.max(...others.map((t) => t.order)) + 1 : 0;

  const block: BlockRow = {
    id: NOAH_BLOCK_ID,
    name: NOAH_PRESET_META.name,
    desc: NOAH_PRESET_META.desc,
    startDate: previousBlock?.startDate ?? toISODate(startOfWeek(new Date())),
    weeks: WEEKS,
    currentWeek: previousBlock?.currentWeek ?? 1,
    weekStartedAt: previousBlock?.weekStartedAt ?? Date.now(),
    holdLastWeek: true, // « Semaine 4 : programme final à conserver »
    optionalEnabled: previousBlock?.optionalEnabled ?? false,
  };

  const templates = buildTemplates().map((t, i) => ({
    ...t,
    order: orderStart + i,
    weekdays: previousDays.get(t.id)?.weekdays ?? t.weekdays,
  }));

  await db.transaction('rw', ['blocks', 'templates'], async () => {
    if (previousDays.size > 0) await db.templates.bulkDelete([...previousDays.keys()]);
    await db.blocks.put(block);
    await db.templates.bulkPut(templates);
  });
}
