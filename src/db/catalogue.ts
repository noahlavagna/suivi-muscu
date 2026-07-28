import type { Equipment, Exercise, ExerciseFamily, MuscleGroup } from './types';

/**
 * Catalogue d'exercices livré avec l'app.
 *
 * Les identifiants sont définitifs : l'historique, les records et les séances
 * types y font référence. Ne jamais en renommer un — ajouter une nouvelle
 * entrée à la place. Les 24 premiers identifiants viennent de la version
 * d'origine de l'app et sont conservés tels quels.
 *
 * La synchronisation (voir `syncCatalogue`) n'ajoute que les manquants et ne
 * touche jamais aux réglages modifiés par l'utilisateur.
 */

type Seed = [
  id: string,
  name: string,
  groups: MuscleGroup[],
  equipment: Equipment,
  family: ExerciseFamily,
  incr: number,
  rest: number,
  timeBased?: boolean,
  aliases?: string[],
];

/* ————————————————— Pectoraux ————————————————— */
const PECTORAUX: Seed[] = [
  ['dev-couche-barre', 'Développé couché barre', ['pectoraux', 'triceps', 'épaules'], 'barre', 'polyarticulaire', 2.5, 180, false, ['bench press', 'dc']],
  ['dev-couche-halteres', 'Développé couché haltères', ['pectoraux', 'triceps'], 'haltères', 'polyarticulaire', 2, 150, false, ['dumbbell bench']],
  ['dev-couche-smith', 'Développé couché Smith', ['pectoraux', 'triceps'], 'smith', 'polyarticulaire', 2.5, 150],
  ['dev-incline-barre', 'Développé incliné barre', ['pectoraux', 'épaules', 'triceps'], 'barre', 'polyarticulaire', 2.5, 180, false, ['incline bench']],
  ['dev-incline-halteres', 'Développé incliné haltères', ['pectoraux', 'épaules'], 'haltères', 'polyarticulaire', 2, 150],
  ['dev-incline-smith', 'Développé incliné Smith', ['pectoraux', 'épaules', 'triceps'], 'smith', 'polyarticulaire', 2.5, 150],
  ['dev-decline-barre', 'Développé décliné barre', ['pectoraux', 'triceps'], 'barre', 'polyarticulaire', 2.5, 150],
  ['dev-decline-halteres', 'Développé décliné haltères', ['pectoraux', 'triceps'], 'haltères', 'polyarticulaire', 2, 150],
  ['dev-machine', 'Développé machine', ['pectoraux', 'triceps'], 'machine', 'polyarticulaire', 2.5, 120, false, ['chest press']],
  ['dev-convergent', 'Développé convergent machine', ['pectoraux'], 'machine', 'polyarticulaire', 2.5, 120],
  ['dev-couche-serre', 'Développé couché prise serrée', ['triceps', 'pectoraux'], 'barre', 'polyarticulaire', 2.5, 150, false, ['close grip']],
  ['pec-deck', 'Pec deck', ['pectoraux'], 'machine', 'isolation', 2.5, 90, false, ['butterfly']],
  ['pec-fly-vav', 'Pec fly poulie vis-à-vis', ['pectoraux'], 'poulie', 'isolation', 1, 90],
  ['ecarte-incline-vav', 'Écarté incliné banc 30° poulie', ['pectoraux'], 'poulie', 'isolation', 1, 90],
  ['ecarte-halteres', 'Écarté haltères banc plat', ['pectoraux'], 'haltères', 'isolation', 2, 90, false, ['fly']],
  ['ecarte-incline-halteres', 'Écarté incliné haltères', ['pectoraux'], 'haltères', 'isolation', 2, 90],
  ['ecarte-poulie-haute', 'Écarté poulie haute vis-à-vis', ['pectoraux'], 'poulie', 'isolation', 1, 90],
  ['ecarte-poulie-basse', 'Écarté poulie basse vis-à-vis', ['pectoraux'], 'poulie', 'isolation', 1, 90],
  ['pull-over-haltere', 'Pull-over haltère', ['pectoraux', 'dos'], 'haltères', 'isolation', 2, 90],
  ['pompes', 'Pompes', ['pectoraux', 'triceps'], 'poids du corps', 'polyarticulaire', 1, 90, false, ['push up']],
  ['pompes-lestees', 'Pompes lestées', ['pectoraux', 'triceps'], 'poids du corps', 'polyarticulaire', 2.5, 120],
  ['pompes-inclinees', 'Pompes inclinées', ['pectoraux'], 'poids du corps', 'polyarticulaire', 1, 60],
  ['pompes-declinees', 'Pompes déclinées', ['pectoraux', 'épaules'], 'poids du corps', 'polyarticulaire', 1, 90],
  ['pompes-diamant', 'Pompes diamant', ['triceps', 'pectoraux'], 'poids du corps', 'polyarticulaire', 1, 90],
  ['dips-lestees', 'Dips lestés', ['pectoraux', 'triceps'], 'poids du corps', 'polyarticulaire', 2.5, 150],
  ['dips', 'Dips', ['pectoraux', 'triceps'], 'poids du corps', 'polyarticulaire', 1, 120],
];

/* ————————————————— Dos ————————————————— */
const DOS: Seed[] = [
  ['traction-pronation', 'Tractions pronation', ['dos', 'biceps'], 'poids du corps', 'polyarticulaire', 1, 150, false, ['pull up']],
  ['traction-supination', 'Tractions supination', ['dos', 'biceps'], 'poids du corps', 'polyarticulaire', 1, 150, false, ['chin up']],
  ['traction-neutre', 'Tractions prise neutre', ['dos', 'biceps'], 'poids du corps', 'polyarticulaire', 1, 150],
  ['traction-lestee', 'Tractions lestées', ['dos', 'biceps'], 'poids du corps', 'polyarticulaire', 2.5, 180],
  ['traction-verticale', 'Traction verticale machine', ['dos', 'biceps'], 'machine', 'polyarticulaire', 2.5, 150],
  ['tirage-vertical-barre', 'Tirage vertical barre', ['dos', 'biceps'], 'poulie', 'polyarticulaire', 2.5, 120, false, ['lat pulldown']],
  ['tirage-vertical-neutre', 'Tirage vertical prise neutre', ['dos', 'biceps'], 'poulie', 'polyarticulaire', 2.5, 120],
  ['tirage-vertical-uni', 'Tirage vertical unilatéral poulie', ['dos'], 'poulie', 'polyarticulaire', 1, 90],
  ['rowing-barre', 'Rowing barre buste penché', ['dos', 'trapèzes', 'biceps'], 'barre', 'polyarticulaire', 2.5, 180, false, ['barbell row']],
  ['rowing-pendlay', 'Rowing Pendlay', ['dos', 'trapèzes'], 'barre', 'polyarticulaire', 2.5, 180],
  ['rowing-yates', 'Rowing Yates supination', ['dos', 'biceps'], 'barre', 'polyarticulaire', 2.5, 150],
  ['rowing-haltere-uni', 'Rowing haltère unilatéral', ['dos', 'trapèzes'], 'haltères', 'polyarticulaire', 2, 120],
  ['rowing-t-bar', 'Rowing T-bar', ['dos', 'trapèzes'], 'barre', 'polyarticulaire', 2.5, 150],
  ['rowing-machine', 'Rowing machine assis', ['dos'], 'machine', 'polyarticulaire', 2.5, 120],
  ['rowing-poulie-basse', 'Tirage horizontal poulie basse', ['dos', 'biceps'], 'poulie', 'polyarticulaire', 2.5, 120, false, ['seated row']],
  ['rowing-smith', 'Rowing Smith', ['dos'], 'smith', 'polyarticulaire', 2.5, 150],
  ['seal-row', 'Seal row banc', ['dos', 'trapèzes'], 'barre', 'polyarticulaire', 2.5, 120],
  ['tirage-gorilla', 'Tirage gorilla poulie', ['dos'], 'poulie', 'polyarticulaire', 2.5, 90],
  ['pull-over-poulie', 'Pull-over poulie haute', ['dos'], 'poulie', 'isolation', 2.5, 90, false, ['straight arm pulldown']],
  ['souleve-de-terre', 'Soulevé de terre', ['dos', 'ischios', 'fessiers', 'lombaires'], 'barre', 'polyarticulaire', 5, 240, false, ['sdt', 'deadlift']],
  ['deadlift-smith', 'Deadlift Smith', ['ischios', 'fessiers', 'dos'], 'smith', 'polyarticulaire', 2.5, 150, false, ['sdt smith']],
  ['souleve-roumain', 'Soulevé de terre roumain', ['ischios', 'fessiers', 'dos'], 'barre', 'polyarticulaire', 2.5, 180, false, ['rdl', 'romanian deadlift']],
  ['souleve-sumo', 'Soulevé de terre sumo', ['fessiers', 'quadriceps', 'dos'], 'barre', 'polyarticulaire', 5, 240],
  ['souleve-jambes-tendues', 'Soulevé de terre jambes tendues', ['ischios', 'lombaires'], 'barre', 'polyarticulaire', 2.5, 180],
  ['souleve-trap-bar', 'Soulevé de terre trap bar', ['quadriceps', 'fessiers', 'dos'], 'barre', 'polyarticulaire', 5, 240],
  ['good-morning', 'Good morning', ['ischios', 'lombaires', 'fessiers'], 'barre', 'polyarticulaire', 2.5, 150],
  ['face-pull', 'Face pull corde assis', ['épaules', 'dos'], 'poulie', 'isolation', 2.5, 90],
  ['hyperextension', 'Extensions lombaires banc', ['lombaires', 'fessiers'], 'poids du corps', 'isolation', 2.5, 90, false, ['back extension']],
  ['reverse-hyper', 'Reverse hyperextension', ['lombaires', 'fessiers'], 'machine', 'isolation', 2.5, 90],
  ['superman', 'Superman au sol', ['lombaires'], 'poids du corps', 'gainage', 1, 45, true],
];

/* ————————————————— Trapèzes ————————————————— */
const TRAPEZES: Seed[] = [
  ['shrug-barre', 'Shrug barre', ['trapèzes'], 'barre', 'isolation', 2.5, 90],
  ['shrug-halteres', 'Shrug haltères', ['trapèzes'], 'haltères', 'isolation', 2, 90],
  ['shrug-smith', 'Shrug Smith', ['trapèzes'], 'smith', 'isolation', 2.5, 90],
  ['shrug-poulie', 'Shrug poulie basse', ['trapèzes'], 'poulie', 'isolation', 2.5, 90],
  ['tirage-menton', 'Tirage menton', ['trapèzes', 'épaules'], 'barre', 'polyarticulaire', 2.5, 90, false, ['upright row']],
  ['farmer-walk', 'Farmer walk', ['trapèzes', 'avant-bras'], 'haltères', 'polyarticulaire', 2.5, 120, true],
];

/* ————————————————— Épaules ————————————————— */
const EPAULES: Seed[] = [
  ['dev-militaire', 'Développé militaire haltères', ['épaules', 'triceps'], 'haltères', 'polyarticulaire', 2, 150],
  ['dev-militaire-barre', 'Développé militaire barre debout', ['épaules', 'triceps'], 'barre', 'polyarticulaire', 2.5, 180, false, ['ohp', 'overhead press']],
  ['dev-epaules-assis-barre', 'Développé épaules assis barre', ['épaules', 'triceps'], 'barre', 'polyarticulaire', 2.5, 150],
  ['dev-epaules-assis-halteres', 'Développé épaules assis haltères', ['épaules', 'triceps'], 'haltères', 'polyarticulaire', 2, 150],
  ['dev-arnold', 'Développé Arnold', ['épaules'], 'haltères', 'polyarticulaire', 2, 120],
  ['dev-epaules-machine', 'Développé épaules machine', ['épaules'], 'machine', 'polyarticulaire', 2.5, 120, false, ['shoulder press']],
  ['dev-epaules-smith', 'Développé épaules Smith', ['épaules', 'triceps'], 'smith', 'polyarticulaire', 2.5, 150],
  ['push-press', 'Push press', ['épaules', 'triceps', 'quadriceps'], 'barre', 'explosif', 2.5, 180],
  ['elev-lat-halteres', 'Élévations latérales haltères', ['épaules'], 'haltères', 'isolation', 1, 90, false, ['lateral raise']],
  ['elev-lat-poulie', 'Élévations latérales poulie unilatérale', ['épaules'], 'poulie', 'isolation', 1, 90],
  ['elev-lat-machine', 'Élévations latérales machine', ['épaules'], 'machine', 'isolation', 2.5, 90],
  ['elev-lat-allonge', 'Élévations latérales allongé', ['épaules'], 'haltères', 'isolation', 2, 90],
  ['elev-lat-elastique', 'Élévations latérales élastique', ['épaules'], 'élastique', 'isolation', 1, 60],
  ['elev-front-halteres', 'Élévations frontales haltères', ['épaules'], 'haltères', 'isolation', 1, 90],
  ['elev-front-cuffs', 'Élévations frontales cuffs poulie', ['épaules'], 'poulie', 'isolation', 1, 90],
  ['elev-front-barre', 'Élévations frontales barre', ['épaules'], 'barre', 'isolation', 2.5, 90],
  ['oiseau-halteres', 'Oiseau haltères buste penché', ['épaules', 'dos'], 'haltères', 'isolation', 1, 90, false, ['rear delt fly']],
  ['oiseau-vav-cuffs', 'Oiseau poulie vis-à-vis cuffs', ['épaules'], 'poulie', 'isolation', 1, 90],
  ['oiseau-machine', 'Oiseau machine', ['épaules'], 'machine', 'isolation', 2.5, 90, false, ['reverse pec deck']],
  ['rear-delt-row', 'Rowing deltoïde postérieur corde', ['épaules', 'dos'], 'poulie', 'isolation', 2.5, 90],
  ['y-raise', 'Y-raise banc incliné', ['épaules', 'trapèzes'], 'haltères', 'isolation', 1, 90],
  ['rotation-externe-elastique', 'Rotation externe épaule élastique', ['épaules'], 'élastique', 'isolation', 1, 60],
];

/* ————————————————— Biceps ————————————————— */
const BICEPS: Seed[] = [
  ['curl-barre', 'Curl barre droite', ['biceps'], 'barre', 'isolation', 2.5, 90],
  ['curl-ez', 'Curl barre EZ', ['biceps'], 'barre', 'isolation', 2.5, 90],
  ['curl-ez-elastique', 'Curl barre EZ + élastique', ['biceps'], 'barre', 'isolation', 2.5, 90],
  ['curl-halteres', 'Curl haltères', ['biceps'], 'haltères', 'isolation', 2, 90],
  ['curl-alterne', 'Curl alterné haltères', ['biceps'], 'haltères', 'isolation', 2, 90],
  ['curl-marteau', 'Curl marteau haltères', ['biceps', 'avant-bras'], 'haltères', 'isolation', 2, 90, false, ['hammer curl']],
  ['curl-marteau-cuffs', 'Curl marteau poulie basse cuffs', ['biceps'], 'poulie', 'isolation', 1, 90],
  ['curl-incline', 'Curl incliné haltères', ['biceps'], 'haltères', 'isolation', 2, 90],
  ['curl-pupitre', 'Curl pupitre', ['biceps'], 'barre', 'isolation', 2.5, 90, false, ['preacher curl', 'larry scott']],
  ['curl-poulie-basse', 'Curl poulie basse', ['biceps'], 'poulie', 'isolation', 2.5, 90],
  ['curl-poulie-haute', 'Curl poulie haute bilatéral', ['biceps'], 'poulie', 'isolation', 1, 90],
  ['curl-concentration', 'Curl concentration', ['biceps'], 'haltères', 'isolation', 1, 60],
  ['curl-spider', 'Spider curl', ['biceps'], 'haltères', 'isolation', 2, 90],
  ['curl-inverse', 'Curl inversé', ['avant-bras', 'biceps'], 'barre', 'isolation', 2.5, 90],
  ['drag-curl', 'Drag curl', ['biceps'], 'barre', 'isolation', 2.5, 90],
];

/* ————————————————— Triceps ————————————————— */
const TRICEPS: Seed[] = [
  ['ext-triceps-barre', 'Extension triceps barre', ['triceps'], 'barre', 'isolation', 2.5, 90],
  ['overhead-ext-barre', 'Overhead extension barre', ['triceps'], 'barre', 'isolation', 2.5, 90],
  ['ext-triceps-corde', 'Extension triceps corde', ['triceps'], 'poulie', 'isolation', 2.5, 90, false, ['pushdown']],
  ['ext-triceps-barre-poulie', 'Extension triceps barre poulie', ['triceps'], 'poulie', 'isolation', 2.5, 90],
  ['ext-triceps-uni', 'Extension triceps unilatérale poulie', ['triceps'], 'poulie', 'isolation', 1, 60],
  ['overhead-corde', 'Extension overhead corde poulie', ['triceps'], 'poulie', 'isolation', 2.5, 90],
  ['overhead-haltere', 'Extension overhead haltère', ['triceps'], 'haltères', 'isolation', 2, 90],
  ['skull-crusher', 'Barre au front', ['triceps'], 'barre', 'isolation', 2.5, 90, false, ['skull crusher']],
  ['jm-press', 'JM press', ['triceps'], 'barre', 'polyarticulaire', 2.5, 120],
  ['dips-machine', 'Dips machine', ['triceps', 'pectoraux'], 'machine', 'polyarticulaire', 2.5, 120],
  ['dips-banc', 'Dips entre bancs', ['triceps'], 'poids du corps', 'polyarticulaire', 2.5, 90],
  ['kickback-haltere', 'Kickback haltère', ['triceps'], 'haltères', 'isolation', 1, 60],
  ['kickback-poulie', 'Kickback poulie', ['triceps'], 'poulie', 'isolation', 1, 60],
];

/* ————————————————— Avant-bras ————————————————— */
const AVANT_BRAS: Seed[] = [
  ['curl-poignets', 'Curl poignets barre', ['avant-bras'], 'barre', 'isolation', 1, 60],
  ['curl-poignets-inverse', 'Curl poignets inversé', ['avant-bras'], 'barre', 'isolation', 1, 60],
  ['pince-grip', 'Travail de pince', ['avant-bras'], 'autre', 'isolation', 1, 60, true],
  ['dead-hang', 'Suspension à la barre', ['avant-bras', 'dos'], 'poids du corps', 'gainage', 1, 60, true],
  ['rotation-poignets-elastique', 'Rotations poignets élastique', ['avant-bras'], 'élastique', 'isolation', 1, 45],
];

/* ————————————————— Quadriceps ————————————————— */
const QUADRICEPS: Seed[] = [
  ['squat-barre', 'Squat barre', ['quadriceps', 'fessiers'], 'barre', 'polyarticulaire', 2.5, 240, false, ['back squat']],
  ['squat-avant', 'Squat avant', ['quadriceps'], 'barre', 'polyarticulaire', 2.5, 180, false, ['front squat']],
  ['squat-gobelet', 'Squat gobelet', ['quadriceps', 'fessiers'], 'haltères', 'polyarticulaire', 2, 120, false, ['goblet squat']],
  ['squat-smith', 'Squat Smith', ['quadriceps', 'fessiers'], 'smith', 'polyarticulaire', 2.5, 180],
  ['squat-sumo-haltere', 'Squat sumo haltère', ['fessiers', 'adducteurs', 'quadriceps'], 'haltères', 'polyarticulaire', 2, 120],
  ['hack-squat', 'Hack squat machine', ['quadriceps'], 'machine', 'polyarticulaire', 5, 180],
  ['presse-cuisses', 'Presse à cuisses', ['quadriceps', 'fessiers'], 'machine', 'polyarticulaire', 5, 180, false, ['leg press']],
  ['presse-uni', 'Presse à cuisses unilatérale', ['quadriceps', 'fessiers'], 'machine', 'polyarticulaire', 2.5, 120],
  ['leg-extension', 'Leg extension', ['quadriceps'], 'machine', 'isolation', 2.5, 120],
  ['leg-extension-uni', 'Leg extension unilatéral', ['quadriceps'], 'machine', 'isolation', 1, 90],
  ['fentes-bulgares', 'Fentes bulgares', ['quadriceps', 'fessiers'], 'haltères', 'polyarticulaire', 2, 120, false, ['bulgarian split squat']],
  ['fentes-marchees', 'Fentes marchées', ['quadriceps', 'fessiers'], 'haltères', 'polyarticulaire', 2, 120],
  ['fentes-avant', 'Fentes avant', ['quadriceps', 'fessiers'], 'haltères', 'polyarticulaire', 2, 120],
  ['fentes-arriere', 'Fentes arrière', ['fessiers', 'quadriceps'], 'haltères', 'polyarticulaire', 2, 120],
  ['step-up', 'Step-up sur banc', ['quadriceps', 'fessiers'], 'haltères', 'polyarticulaire', 2, 120],
  ['sissy-squat', 'Sissy squat', ['quadriceps'], 'poids du corps', 'isolation', 1, 90],
  ['pistol-squat', 'Pistol squat', ['quadriceps', 'fessiers'], 'poids du corps', 'polyarticulaire', 1, 120],
  ['chaise-mur', 'Chaise contre le mur', ['quadriceps'], 'poids du corps', 'gainage', 1, 60, true, ['wall sit']],
];

/* ————————————————— Ischios ————————————————— */
const ISCHIOS: Seed[] = [
  ['leg-curl', 'Leg curl allongé', ['ischios'], 'machine', 'isolation', 2.5, 120],
  ['leg-curl-assis', 'Leg curl assis', ['ischios'], 'machine', 'isolation', 2.5, 120],
  ['leg-curl-debout', 'Leg curl debout unilatéral', ['ischios'], 'machine', 'isolation', 1, 90],
  ['nordic-curl', 'Nordic hamstring curl', ['ischios'], 'poids du corps', 'isolation', 1, 120],
  ['glute-ham-raise', 'Glute-ham raise', ['ischios', 'fessiers'], 'machine', 'polyarticulaire', 2.5, 120],
];

/* ————————————————— Fessiers ————————————————— */
const FESSIERS: Seed[] = [
  ['hip-thrust', 'Hip thrust barre', ['fessiers', 'ischios'], 'barre', 'polyarticulaire', 5, 150],
  ['hip-thrust-machine', 'Hip thrust machine', ['fessiers'], 'machine', 'polyarticulaire', 5, 120],
  ['pont-fessier', 'Pont fessier au sol', ['fessiers'], 'poids du corps', 'isolation', 2.5, 90],
  ['abduction-machine', 'Machine abducteurs', ['fessiers'], 'machine', 'isolation', 2.5, 90],
  ['abduction-poulie', 'Abduction hanche poulie', ['fessiers'], 'poulie', 'isolation', 1, 60],
  ['kickback-fessier', 'Kickback fessier poulie', ['fessiers'], 'poulie', 'isolation', 1, 60],
  ['fire-hydrant', 'Fire hydrant', ['fessiers'], 'poids du corps', 'isolation', 1, 45],
  ['marche-laterale-elastique', 'Marche latérale élastique', ['fessiers'], 'élastique', 'isolation', 1, 60],
];

/* ————————————————— Adducteurs ————————————————— */
const ADDUCTEURS: Seed[] = [
  ['machine-adducteurs', 'Machine adducteurs', ['adducteurs'], 'machine', 'isolation', 2.5, 90],
  ['adduction-poulie', 'Adduction hanche poulie', ['adducteurs'], 'poulie', 'isolation', 1, 60],
  ['copenhagen', 'Copenhagen plank', ['adducteurs', 'abdos'], 'poids du corps', 'gainage', 1, 60, true],
];

/* ————————————————— Mollets ————————————————— */
const MOLLETS: Seed[] = [
  ['mollets-debout', 'Extensions mollets debout', ['mollets'], 'machine', 'isolation', 2.5, 90, false, ['standing calf raise']],
  ['mollets-assis', 'Extensions mollets assis', ['mollets'], 'machine', 'isolation', 2.5, 90, false, ['seated calf raise']],
  ['mollets-presse', 'Mollets à la presse', ['mollets'], 'machine', 'isolation', 5, 90],
  ['mollets-smith', 'Mollets Smith', ['mollets'], 'smith', 'isolation', 2.5, 90],
  ['mollets-uni-haltere', 'Mollets unilatéral haltère', ['mollets'], 'haltères', 'isolation', 2, 60],
];

/* ————————————————— Abdos et gainage ————————————————— */
const ABDOS: Seed[] = [
  ['planche', 'Planche', ['abdos'], 'poids du corps', 'gainage', 1, 60, true, ['plank']],
  ['planche-laterale', 'Planche latérale', ['abdos'], 'poids du corps', 'gainage', 1, 45, true],
  ['hollow-hold', 'Hollow hold', ['abdos'], 'poids du corps', 'gainage', 1, 60, true],
  ['l-sit', 'L-sit', ['abdos'], 'poids du corps', 'gainage', 1, 60, true],
  ['crunch', 'Crunch au sol', ['abdos'], 'poids du corps', 'isolation', 1, 60],
  ['crunch-poulie', 'Crunch à la poulie', ['abdos'], 'poulie', 'isolation', 2.5, 90],
  ['crunch-machine', 'Crunch machine', ['abdos'], 'machine', 'isolation', 2.5, 90],
  ['releve-jambes-suspendu', 'Relevé de jambes suspendu', ['abdos'], 'poids du corps', 'isolation', 1, 90],
  ['releve-genoux-suspendu', 'Relevé de genoux suspendu', ['abdos'], 'poids du corps', 'isolation', 1, 90],
  ['releve-jambes-sol', 'Relevé de jambes au sol', ['abdos'], 'poids du corps', 'isolation', 1, 60],
  ['roue-abdominale', 'Roue abdominale', ['abdos'], 'autre', 'gainage', 1, 90, false, ['ab wheel']],
  ['pallof-press', 'Pallof press poulie', ['abdos'], 'poulie', 'gainage', 1, 60],
  ['dead-bug', 'Dead bug', ['abdos'], 'poids du corps', 'gainage', 1, 45],
  ['bird-dog', 'Bird dog', ['abdos', 'lombaires'], 'poids du corps', 'gainage', 1, 45],
  ['russian-twist', 'Russian twist', ['abdos'], 'poids du corps', 'isolation', 1, 60],
  ['mountain-climber', 'Mountain climbers', ['abdos', 'cardio'], 'poids du corps', 'cardio', 1, 60, true],
  ['v-up', 'V-up', ['abdos'], 'poids du corps', 'isolation', 1, 60],
  ['toes-to-bar', 'Toes to bar', ['abdos'], 'poids du corps', 'polyarticulaire', 1, 90],
  ['woodchopper', 'Woodchopper poulie', ['abdos'], 'poulie', 'isolation', 2.5, 60],
];

/* ————————————————— Explosif et haltérophilie ————————————————— */
const EXPLOSIF: Seed[] = [
  ['epaule-jete', 'Épaulé-jeté', ['quadriceps', 'épaules', 'trapèzes'], 'barre', 'explosif', 2.5, 240, false, ['clean and jerk']],
  ['epaule', 'Épaulé debout', ['quadriceps', 'trapèzes'], 'barre', 'explosif', 2.5, 210, false, ['clean']],
  ['power-clean', 'Power clean', ['quadriceps', 'trapèzes', 'dos'], 'barre', 'explosif', 2.5, 210],
  ['arrache', 'Arraché', ['épaules', 'quadriceps', 'trapèzes'], 'barre', 'explosif', 2.5, 240, false, ['snatch']],
  ['jete-fente', 'Jeté fente', ['épaules', 'quadriceps'], 'barre', 'explosif', 2.5, 210, false, ['split jerk']],
  ['swing-kettlebell', 'Kettlebell swing', ['fessiers', 'ischios'], 'kettlebell', 'explosif', 4, 90],
  ['clean-kettlebell', 'Kettlebell clean', ['quadriceps', 'trapèzes'], 'kettlebell', 'explosif', 4, 120],
  ['snatch-kettlebell', 'Kettlebell snatch', ['épaules', 'fessiers'], 'kettlebell', 'explosif', 4, 120],
  ['turkish-get-up', 'Turkish get-up', ['abdos', 'épaules'], 'kettlebell', 'explosif', 4, 150],
  ['box-jump', 'Box jump', ['quadriceps', 'fessiers'], 'poids du corps', 'explosif', 1, 120],
  ['saut-vertical', 'Saut vertical', ['quadriceps', 'mollets'], 'poids du corps', 'explosif', 1, 120],
  ['saut-longueur', 'Saut en longueur', ['quadriceps', 'fessiers'], 'poids du corps', 'explosif', 1, 120],
  ['medecine-ball-slam', 'Slam medecine ball', ['abdos', 'dos'], 'autre', 'explosif', 1, 90],
];

/* ————————————————— Cardio et conditionnement ————————————————— */
const CARDIO: Seed[] = [
  ['rameur', 'Rameur', ['cardio'], 'machine', 'cardio', 1, 120, true, ['rowing erg']],
  ['assault-bike', 'Assault bike', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['velo', 'Vélo', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['tapis-course', 'Tapis de course', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['marche-inclinee', 'Marche inclinée', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['elliptique', 'Elliptique', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['stairmaster', 'Stairmaster', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['ski-erg', 'Ski erg', ['cardio'], 'machine', 'cardio', 1, 120, true],
  ['corde-a-sauter', 'Corde à sauter', ['cardio', 'mollets'], 'autre', 'cardio', 1, 90, true],
  ['burpees', 'Burpees', ['cardio'], 'poids du corps', 'cardio', 1, 90],
  ['battle-rope', 'Battle rope', ['cardio', 'épaules'], 'autre', 'cardio', 1, 90, true],
  ['sled-push', 'Poussée de traîneau', ['quadriceps', 'cardio'], 'autre', 'cardio', 5, 120],
  ['sled-pull', 'Traction de traîneau', ['dos', 'cardio'], 'autre', 'cardio', 5, 120],
];

/* ————————————————— Mobilité et étirements ————————————————— */
const MOBILITE: Seed[] = [
  ['decompression', 'Décompression articulaire', ['mobilité'], 'autre', 'mobilité', 2.5, 45, true],
  ['etirement-ischios', 'Étirement ischios debout', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-quadriceps', 'Étirement quadriceps debout', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-fessiers', 'Étirement fessiers figure 4', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-psoas', 'Étirement psoas en fente', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-adducteurs', 'Étirement adducteurs papillon', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-mollets', 'Étirement mollets au mur', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-pectoraux', 'Étirement pectoraux à la porte', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-dorsaux', 'Étirement grand dorsal suspendu', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-triceps', 'Étirement triceps overhead', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['etirement-nuque', 'Étirement nuque', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['chat-vache', 'Chat-vache', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['chien-tete-en-bas', 'Chien tête en bas', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['pigeon', 'Posture du pigeon', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['hanches-90-90', 'Hanches 90/90', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['rotation-thoracique', 'Rotation thoracique quadrupédie', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['ouverture-thoracique', 'Ouverture thoracique allongé', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['dislocation-elastique', 'Dislocations d’épaules élastique', ['mobilité'], 'élastique', 'mobilité', 1, 45, true],
  ['mobilite-cheville', 'Mobilité cheville au mur', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['mobilite-poignets', 'Mobilité poignets au sol', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['squat-profond-tenu', 'Squat profond tenu', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['couch-stretch', 'Couch stretch', ['mobilité'], 'poids du corps', 'mobilité', 1, 45, true],
  ['scorpion', 'Scorpion allongé', ['mobilité'], 'poids du corps', 'mobilité', 1, 30, true],
  ['foam-roll-dos', 'Foam roller dos', ['mobilité'], 'autre', 'mobilité', 1, 45, true],
  ['foam-roll-quadriceps', 'Foam roller quadriceps', ['mobilité'], 'autre', 'mobilité', 1, 45, true],
  ['foam-roll-ischios', 'Foam roller ischios', ['mobilité'], 'autre', 'mobilité', 1, 45, true],
  ['foam-roll-mollets', 'Foam roller mollets', ['mobilité'], 'autre', 'mobilité', 1, 45, true],
];

const ALL: Seed[] = [
  ...PECTORAUX,
  ...DOS,
  ...TRAPEZES,
  ...EPAULES,
  ...BICEPS,
  ...TRICEPS,
  ...AVANT_BRAS,
  ...QUADRICEPS,
  ...ISCHIOS,
  ...FESSIERS,
  ...ADDUCTEURS,
  ...MOLLETS,
  ...ABDOS,
  ...EXPLOSIF,
  ...CARDIO,
  ...MOBILITE,
];

export const CATALOGUE: Exercise[] = ALL.map(
  ([id, name, muscleGroups, equipment, family, weightIncrementKg, defaultRestSec, isTimeBased, aliases]) => ({
    id,
    name,
    muscleGroups,
    equipment,
    family,
    weightIncrementKg,
    defaultRestSec,
    isTimeBased: isTimeBased ?? false,
    ...(aliases ? { aliases } : {}),
  }),
);

export const CATALOGUE_BY_ID = new Map(CATALOGUE.map((e) => [e.id, e]));
