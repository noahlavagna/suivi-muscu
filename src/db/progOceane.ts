import { db } from './db';
import type { BlockRow, TargetSet, TemplateItem, WorkoutTemplate } from './types';
import { startOfWeek, toISODate } from '../lib/dates';

/**
 * « Programme renforcement — scoliose 19° » — transcription fidèle du document
 * d'Océane (débutante, 2 séances par semaine, scoliose sinistro-convexe
 * dorso-lombaire).
 *
 * Le cycle fait 12 semaines et chaque semaine est un palier du bloc : deux
 * séances (A et B) la valident, et le palier monte alors d'un cran. Les
 * phases du document (apprentissage, double progression, volume, semaine
 * allégée, consolidation) pilotent le nombre de séries et les consignes.
 *
 * Les récupérations sont propres à chaque exercice — 2 min sur les gros
 * mouvements, 45 s sur le gainage — et non à la semaine : elles sont posées
 * item par item, pas par le palier.
 */

export const OCEANE_BLOCK_ID = 'block-oceane';

export const OCEANE_PRESET_META = {
  id: OCEANE_BLOCK_ID,
  name: 'Mon programme — 12 semaines',
  daysLabel: 'Mar · Ven',
  desc: 'Séance A et séance B, adaptées à ta scoliose : fessiers, abdos anti-mouvement, force du haut du corps. Zéro crunch, zéro rotation chargée.',
};

/* ————————————————— Phases du cycle ————————————————— */

export interface OceanePhase {
  key: 'apprendre' | 'progression' | 'volume' | 'allegee' | 'consolider';
  label: string;
  weeks: number[];
  /** Ce que la semaine change, en une phrase — affiché en tête de séance */
  headline: string;
  /** Séries sur les exercices ordinaires */
  sets: number;
  /** Séries sur hip thrust et presse à cuisses (exercices prioritaires) */
  setsPriority: number;
  rpe: string;
}

export const OCEANE_PHASES: OceanePhase[] = [
  {
    key: 'apprendre',
    label: 'Apprendre, pas performer',
    weeks: [1, 2],
    headline: '2 séries, charges très légères. Tu notes tout : charges et réglages de siège.',
    sets: 2,
    setsPriority: 2,
    rpe: 'RPE 5 — « j’aurais pu en faire 5 de plus »',
  },
  {
    key: 'progression',
    label: 'Double progression',
    weeks: [3, 4, 5, 6],
    headline:
      'Haut de la fourchette partout, deux séances de suite → tu montes la charge. Sinon tu ajoutes des reps.',
    sets: 3,
    setsPriority: 3,
    rpe: 'RPE 7-8 — jamais l’échec',
  },
  {
    key: 'volume',
    label: 'Ajouter du volume',
    weeks: [7, 8],
    headline:
      '4 séries sur le hip thrust et la presse. Le farmer’s walk passe au port de valise, une seule main.',
    sets: 3,
    setsPriority: 4,
    rpe: 'RPE 7-8 — jamais l’échec',
  },
  {
    key: 'allegee',
    label: 'Semaine allégée',
    weeks: [9],
    headline:
      'Moitié des charges, 2 séries. Ça a l’air contre-productif, ça ne l’est pas : tu repars plus forte.',
    sets: 2,
    setsPriority: 2,
    rpe: 'RPE 4-5 — technique propre avant tout',
  },
  {
    key: 'consolider',
    label: 'Consolider',
    weeks: [10, 11, 12],
    headline:
      'Retour aux charges de la semaine 8, puis on remonte. Pause de 2 s en haut du hip thrust.',
    sets: 3,
    setsPriority: 4,
    rpe: 'RPE 7-8 — jamais l’échec',
  },
];

export const phaseOfWeek = (week: number): OceanePhase =>
  OCEANE_PHASES.find((p) => p.weeks.includes(week)) ?? OCEANE_PHASES[0];

/* ————————————————— Fabriques de séries ————————————————— */

const reps = (n: number, min: number, max = min): TargetSet[] =>
  Array.from({ length: n }, () => ({ type: 'normal' as const, repsMin: min, repsMax: max }));

const holds = (n: number, sec: number, secMax?: number): TargetSet[] =>
  Array.from({ length: n }, () => ({
    type: 'hold' as const,
    durationSec: sec,
    ...(secMax ? { durationSecMax: secMax } : {}),
  }));

/** Posture d'échauffement : validée à la sensation, sans chiffre à tenir. */
const warmSet = (): TargetSet[] => [{ type: 'échauffement' }];

/* ————————————————— Échauffement — 12 min, identique aux deux séances ————————————————— */

const WARM_KEY = 'echauffement-oceane';

const warm = (exerciseId: string, sets: TargetSet[], note: string): TemplateItem => ({
  exerciseId,
  sets,
  supersetKey: WARM_KEY,
  restSecOverride: 15,
  note,
});

/**
 * Le bloc mobilité vient avant le cardio — c'est la partie ajoutée après le
 * diagnostic, et la seule à refaire aussi les jours sans salle.
 */
const WARMUP: TemplateItem[] = [
  // Une seule série par posture : l'échauffement s'enchaîne comme un superset,
  // et plusieurs séries feraient tourner les postures les unes après les autres
  // au lieu de finir celle qu'on est en train de faire.
  warm(
    'ext-thoracique-rouleau',
    warmSet(),
    '3 positions × 5 reps, en remontant de 3-4 cm — jamais sous les côtes',
  ),
  warm('open-book', warmSet(), '8 reps de chaque côté, genoux collés au sol'),
  warm('velo', warmSet(), '5 min faciles — tu dois pouvoir parler'),
  warm('chat-vache', warmSet(), '10 allers-retours, le mouvement vient du haut du dos'),
  warm('pont-fessier', warmSet(), '15 reps, pour réveiller les fessiers'),
];

/* ————————————————— Séances A et B ————————————————— */

const seanceA = (week: number): TemplateItem[] => {
  const p = phaseOfWeek(week);
  const carry = week >= 7;
  return [
    {
      exerciseId: 'hip-thrust-machine',
      sets: reps(p.setsPriority, 10, 12),
      restSecOverride: 120,
      note:
        p.key === 'consolider'
          ? 'Pause de 2 s en haut, fesses serrées'
          : 'Pause d’1 s en haut, fesses serrées · tibias verticaux',
      variants: [
        {
          exerciseId: 'pont-fessier',
          sets: reps(3, 15),
          note: 'Repli si ça tire dans le dos : au sol, sans charge',
        },
      ],
    },
    {
      exerciseId: 'presse-cuisses',
      sets: reps(p.setsPriority, 10, 12),
      restSecOverride: 120,
      note: 'Pieds hauts, largeur épaules · le bassin ne décolle jamais du dossier',
    },
    {
      exerciseId: 'dev-machine',
      sets: reps(p.sets, 10, 12),
      restSecOverride: 90,
      note: 'Poignées au milieu de la poitrine — note le numéro de réglage',
      variants: [
        {
          exerciseId: 'dev-incline-halteres',
          sets: reps(p.sets, 10, 12),
          note: 'Variante plus facile : banc incliné, 2 ou 3 kg',
        },
      ],
    },
    {
      exerciseId: 'rowing-poulie-basse',
      sets: reps(p.sets, 10, 12),
      restSecOverride: 90,
      note: 'Prise neutre serrée (poignée en V) · buste immobile, sans exception',
      variants: [
        {
          exerciseId: 'rowing-machine',
          sets: reps(p.sets, 10, 12),
          note: 'Variante plus facile : appui pectoral, impossible de balancer',
        },
      ],
    },
    {
      exerciseId: 'dead-bug',
      sets: reps(p.sets, 8),
      restSecOverride: 60,
      note: '8 reps de chaque côté · le bas du dos reste plaqué au sol',
    },
    carry
      ? {
          exerciseId: 'suitcase-carry',
          sets: holds(p.sets, 40),
          restSecOverride: 90,
          note: '≈30 m, une seule haltère · change de main à chaque série',
          variants: [
            {
              exerciseId: 'farmer-walk',
              sets: holds(p.sets, 40),
              note: 'Repli : une haltère dans chaque main',
            },
          ],
        }
      : {
          exerciseId: 'farmer-walk',
          sets: holds(p.sets, 40),
          restSecOverride: 90,
          note: '≈30 m · commence à 6-8 kg par main, petits pas, regard devant',
        },
  ];
};

const seanceB = (week: number): TemplateItem[] => {
  const p = phaseOfWeek(week);
  return [
    {
      exerciseId: 'squat-gobelet',
      sets: reps(p.sets, 8, 10),
      restSecOverride: 120,
      note: 'Sur box : tu touches sans t’asseoir · descente freinée sur 3 s · sans haltère si besoin',
    },
    {
      exerciseId: 'leg-curl-assis',
      sets: reps(p.sets, 12, 15),
      restSecOverride: 90,
      note: 'Retour freiné sur 3 s · coussin juste au-dessus du talon',
      variants: [
        { exerciseId: 'leg-curl', sets: reps(p.sets, 12, 15), note: 'Version allongée' },
      ],
    },
    {
      exerciseId: 'abduction-machine',
      sets: reps(p.sets, 15),
      restSecOverride: 60,
      note: '2 s pour ouvrir, pause, 2 s pour fermer · buste vertical',
    },
    {
      exerciseId: 'tirage-vertical-neutre',
      sets: reps(p.sets, 10, 12),
      restSecOverride: 90,
      note: 'Poignée en V · jamais derrière la nuque · amène les coudes aux côtes',
    },
    {
      exerciseId: 'dev-incline-halteres',
      sets: reps(p.sets, 10, 12),
      restSecOverride: 90,
      note: 'Banc à 45°, pas plus · le bas du dos reste collé au banc',
    },
    {
      exerciseId: 'elev-lat-halteres',
      sets: reps(p.sets, 12, 15),
      restSecOverride: 60,
      note: 'Commence à 2-3 kg · pas plus haut que les épaules',
    },
    {
      exerciseId: 'pallof-press',
      sets: reps(p.sets, 10),
      restSecOverride: 60,
      note: '10 reps de chaque côté · tout le travail est de ne pas tourner',
    },
    {
      exerciseId: 'planche-laterale',
      sets: holds(p.sets, 20, 30),
      restSecOverride: 45,
      note:
        p.key === 'consolider'
          ? 'Jambes tendues si 3 × 30 s passent proprement sur les genoux'
          : 'Genoux au sol, chaque côté · 20 s propres valent mieux que 45 s affaissées',
    },
  ];
};

/* ————————————————— Construction du bloc ————————————————— */

const WEEK_COUNT = 12;

/** Un palier par semaine du cycle : deux séances le valident. */
const WEEKS: BlockRow['weeks'] = Array.from({ length: WEEK_COUNT }, (_, i) => {
  const week = i + 1;
  const p = phaseOfWeek(week);
  return { week, rir: `Semaine ${week} · ${p.label}`, restSec: 90 };
});

interface DaySpec {
  key: 'a' | 'b';
  name: string;
  weekday: number;
  build: (week: number) => TemplateItem[];
}

const DAYS: DaySpec[] = [
  { key: 'a', name: 'Séance A', weekday: 2, build: seanceA },
  { key: 'b', name: 'Séance B', weekday: 5, build: seanceB },
];

export function buildOceaneTemplates(): WorkoutTemplate[] {
  const templates: WorkoutTemplate[] = [];
  for (let week = 1; week <= WEEK_COUNT; week++) {
    const p = phaseOfWeek(week);
    for (const day of DAYS) {
      templates.push({
        id: `oceane-${day.key}-${week}`,
        name: day.name,
        weekdays: [day.weekday],
        order: 0, // renuméroté à l'installation
        blockId: OCEANE_BLOCK_ID,
        week,
        note: `${p.label} · ${p.rpe}`,
        items: [...WARMUP, ...day.build(week)],
      });
    }
  }
  return templates;
}

/** L'exercice d'une semaine donnée, pour l'aperçu du guide hors séance. */
export function oceaneTemplateFor(day: 'a' | 'b', week: number): TemplateItem[] {
  return day === 'a' ? seanceA(week) : seanceB(week);
}

export const OCEANE_WARMUP = WARMUP;

/**
 * Installe (ou réinstalle) le programme. Comme pour le bloc de Noah, ce qui
 * appartient à l'utilisatrice survit : jours de la semaine choisis, palier en
 * cours, date d'installation.
 */
export async function applyOceaneProgram(): Promise<void> {
  const [previousBlock, allTemplates] = await Promise.all([
    db.blocks.get(OCEANE_BLOCK_ID),
    db.templates.toArray(),
  ]);
  const previousDays = new Map(
    allTemplates.filter((t) => t.blockId === OCEANE_BLOCK_ID).map((t) => [t.id, t]),
  );
  const others = allTemplates.filter((t) => t.blockId !== OCEANE_BLOCK_ID);
  const orderStart = others.length > 0 ? Math.max(...others.map((t) => t.order)) + 1 : 0;

  const block: BlockRow = {
    id: OCEANE_BLOCK_ID,
    name: OCEANE_PRESET_META.name,
    desc: OCEANE_PRESET_META.desc,
    startDate: previousBlock?.startDate ?? toISODate(startOfWeek(new Date())),
    weeks: WEEKS,
    currentWeek: previousBlock?.currentWeek ?? 1,
    weekStartedAt: previousBlock?.weekStartedAt ?? Date.now(),
    holdLastWeek: true, // fin de cycle : on compare le carnet, on ne relance pas tout seul
    optionalEnabled: false,
  };

  const templates = buildOceaneTemplates().map((t, i) => ({
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
