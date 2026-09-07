/**
 * Le document d'Océane, mis en fiches.
 *
 * Le PDF se lit une fois puis se perd ; ici chaque partie devient une section
 * courte, consultable en salle. Le texte reste celui du document — on ne
 * reformule pas un contenu qui engage son dos.
 */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'note'; tone: 'info' | 'warn' | 'good'; title?: string; text: string }
  | { t: 'kv'; rows: [string, string][] }
  | { t: 'table'; head: string[]; rows: string[][] };

export interface GuideSection {
  id: string;
  title: string;
  /** Une ligne pour savoir si c'est ce qu'on cherche */
  teaser: string;
  /** Quand la lire, d'après le document */
  when: string;
  blocks: Block[];
}

/* ————————————————— Ce qui doit rester sous la main ————————————————— */

/** Les signaux qui font arrêter la série immédiatement. */
export const STOP_SIGNALS = [
  'Douleur vive, en éclair, précise, absente avant la rep',
  'Douleur qui descend dans la fesse ou la jambe',
  'Fourmillements, engourdissement, sensation de décharge',
  'Perte de force soudaine dans un membre',
  'Douleur qui augmente rep après rep',
];

/** Ce qui est normal et n'inquiète pas. */
export const NORMAL_SIGNALS = [
  'Brûlure musculaire pendant l’effort',
  'Courbatures diffuses 24 à 48 h après',
  'Fatigue générale après la séance',
];

export const STOP_RULE =
  'Une gêne à 2-3 sur 10 pendant l’exercice : tu peux continuer en allégeant. Au-delà : tu arrêtes. Si le lendemain ton dos est plus douloureux que d’habitude pendant plus de 48 h, tu réduis les charges à la séance suivante.';

/** Tant que le bilan kiné n'est pas fait. */
export const FORBIDDEN = [
  'Squat et soulevé de terre à la barre',
  'Good morning (buste qui bascule vers l’avant, barre sur les épaules)',
  'Extensions lombaires en amplitude complète',
  'Crunchs, sit-ups, relevés de jambes tendues au sol',
  'Russian twists et toute rotation lestée',
  'Tirage nuque (barre derrière la tête)',
  'Tout ce qui saute',
];

export const REMINDERS = [
  'RPE 7-8, jamais l’échec',
  '2 s de descente freinée sur chaque rep',
  'Buste immobile sur les tirages',
  'Note aussi tes réglages de siège, pas seulement les charges',
  'Mêmes charges et durées des deux côtés',
];

/** La semaine réussie — ce qu'on coche à la place de la balance. */
export const WEEK_CHECKLIST = [
  'Les 2 séances faites',
  'Le bloc mobilité fait au moins 4 jours sur 7',
  'Une charge ou une rep en plus sur au moins 2 exercices',
  'Aucun signal d’arrêt déclenché',
  'Ton dos n’est pas plus douloureux que la semaine précédente',
  'Tu as noté tes charges',
  'Protéines à chaque repas',
];

/* ————————————————— Les sections ————————————————— */

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dos',
    title: 'Ton dos',
    teaser: 'Ton diagnostic en français normal, et pourquoi tes douleurs bougent de place.',
    when: 'À lire une fois, tranquillement, avant de commencer.',
    blocks: [
      { t: 'h', text: 'Ce que dit ton diagnostic' },
      {
        t: 'kv',
        rows: [
          [
            'Sinistro-convexe',
            'Ta colonne fait une courbe qui bombe vers la gauche. Le côté gauche est le côté « ouvert » (muscles étirés), le côté droit le côté « fermé » (muscles plus courts).',
          ],
          [
            'Charnière dorso-lombaire',
            'Le sommet de la courbe se situe à la jonction dos / lombaires, autour de D12-L1 : juste au-dessus de la taille, à hauteur du bas de tes côtes.',
          ],
          [
            'Mesurée à 19°',
            'Scoliose légère. Le diagnostic commence à 10°, on parle de modérée à partir de 25-30°. Ta croissance est finie : le risque d’aggravation est très faible. Tu n’as pas un dos fragile.',
          ],
          [
            'Raideur dorsale discrète',
            'Ton haut du dos manque un peu de souplesse en avant / arrière. « Discrète » = légère. C’est le point le plus utile du compte-rendu.',
          ],
        ],
      },
      { t: 'h', text: 'Pourquoi tes douleurs bougent de place' },
      {
        t: 'p',
        text: 'Quand ton haut du dos raide ne peut pas s’enrouler ou se cambrer, le mouvement doit bien se faire quelque part — et il se reporte juste en dessous, exactement à ta charnière dorso-lombaire, qui est aussi ton sommet de courbe.',
      },
      {
        t: 'p',
        text: 'Autrement dit : le problème n’est probablement pas « il faut renforcer plus », c’est « une zone bouge trop parce qu’une autre ne bouge pas assez ». C’est pour ça que la mobilité du haut du dos est une partie fixe de ton échauffement. Ça reste une hypothèse : c’est au kiné de trancher.',
      },
      { t: 'h', text: 'Les 5 questions à poser au kiné' },
      {
        t: 'ol',
        items: [
          'Mes douleurs sont-elles explicables par cette courbe, ou faut-il chercher ailleurs ?',
          'Ma courbe est sinistro-convexe dorso-lombaire à 19°. Ai-je un intérêt à faire un travail asymétrique en salle — par exemple tenir le gainage latéral plus longtemps à gauche — ou est-ce que je reste symétrique ?',
          'La raideur dorsale est-elle le facteur principal ? Quels exercices de mobilité spécifiquement ?',
          'Est-ce que je relève d’une prise en charge type Schroth ?',
          'Y a-t-il des mouvements que tu m’interdis en salle, en plus de ma liste ?',
        ],
      },
      {
        t: 'note',
        tone: 'info',
        title: 'Tu peux commencer en attendant',
        text: 'Le bilan reste la bonne première étape — mais avec les restrictions de la fiche « Ce qu’on évite », le programme est construit pour être sûr sans lui.',
      },
    ],
  },

  {
    id: 'objectifs',
    title: 'Ce que ça vise (et ne promet pas)',
    teaser: 'Les résultats réalistes sur 12 semaines, sans promesse en l’air.',
    when: 'À lire une fois, avant de commencer.',
    blocks: [
      { t: 'h', text: 'Ce que ça vise' },
      {
        t: 'p',
        text: 'Une sangle abdominale fonctionnelle (qui protège ton dos et se voit un peu), des fessiers plus volumineux, un haut du corps utilisable dans la vraie vie, et une prise de poids progressive sans excès de gras.',
      },
      { t: 'h', text: 'Ce que ça ne promet pas' },
      {
        t: 'ul',
        items: [
          'Aucun délai. Sur 12 semaines à 2 séances par semaine, tu gagneras surtout de la force et de la coordination. Le volume musculaire visible, c’est plutôt 6 mois à un an.',
          'Pas de taille plus fine (voir « Abdos et taille fine »).',
          'Pas de disparition de tes douleurs. Il y a de bonnes chances que ça s’améliore, mais ce n’est pas un traitement.',
          'Aucun exercice ne réduira ta courbe. Il n’existe pas de preuve sérieuse qu’une musculation en salle change un angle de Cobb.',
        ],
      },
      {
        t: 'note',
        tone: 'good',
        text: 'L’objectif, c’est que tu aies moins mal et que tu sois plus forte.',
      },
    ],
  },

  {
    id: 'vocabulaire',
    title: 'Le vocabulaire en 30 secondes',
    teaser: 'Rep, série, RPE, tempo : les six mots qui reviennent partout.',
    when: 'À lire une fois. À relire si un mot t’échappe en séance.',
    blocks: [
      {
        t: 'kv',
        rows: [
          ['Répétition (rep)', 'Un mouvement complet. Tu descends et tu remontes = 1 rep.'],
          ['Série', 'Un bloc de reps enchaînées. « 3 × 10 » = 3 séries de 10 reps.'],
          [
            'Repos',
            'Le temps entre deux séries — l’app le lance toute seule. Écourter le repos ne rend pas la séance plus efficace, ça rend la série suivante plus faible.',
          ],
          ['Charge', 'Le poids que tu utilises.'],
          [
            'Tempo',
            'Sauf mention contraire : 2 secondes pour la phase où tu descends / freines, remontée contrôlée. Jamais en balançant.',
          ],
          [
            'RPE (difficulté, 1 à 10)',
            'Combien de reps tu aurais pu faire en plus à la fin de la série. Si tu aurais pu en faire 2 de plus, c’est un RPE 8. Tu vises RPE 7-8. Jamais l’échec complet.',
          ],
        ],
      },
    ],
  },

  {
    id: 'abdos',
    title: 'Abdos et taille fine',
    teaser: 'Pourquoi zéro crunch dans ce programme, et la vérité sur le tour de taille.',
    when: 'À lire une fois. C’est la partie qui explique la moitié des choix du programme.',
    blocks: [
      { t: 'h', text: 'Pourquoi zéro crunch' },
      {
        t: 'p',
        text: 'Le crunch et le sit-up, c’est de la flexion répétée de la colonne sous contrainte. Sur une colonne déviée, la contrainte ne se répartit pas également entre les vertèbres.',
      },
      {
        t: 'p',
        text: 'Les rotations lestées sont le pire choix. Une scoliose n’est pas qu’une courbure vue de face : les vertèbres sont aussi tournées sur elles-mêmes. Ajouter de la rotation chargée sur une colonne déjà en rotation n’a aucun intérêt et a un vrai coût.',
      },
      {
        t: 'p',
        text: 'Le relevé de jambes tendues ne travaille presque pas les abdos. Il travaille le psoas, qui s’insère sur tes lombaires et tire dessus. C’est le mécanisme classique de déclenchement de douleur lombaire chez une débutante.',
      },
      { t: 'h', text: 'Par quoi on remplace' },
      {
        t: 'p',
        text: 'Le vrai rôle de tes abdos, ce n’est pas de plier ton buste. C’est d’empêcher ta colonne de bouger pendant que tes bras et tes jambes bougent.',
      },
      {
        t: 'table',
        head: ['On travaille', 'Ça veut dire', 'Exercice'],
        rows: [
          ['Anti-extension', 'empêcher le bas du dos de se creuser', 'Dead bug'],
          ['Anti-rotation', 'résister à une force qui veut te faire tourner', 'Pallof press'],
          [
            'Anti-flexion latérale',
            'résister à une force qui veut te plier sur le côté',
            'Gainage latéral, farmer’s walk',
          ],
        ],
      },
      {
        t: 'p',
        text: 'Le seul truc que ça ne fait pas, c’est te donner la « brûlure » du crunch. Cette sensation n’est pas un indicateur d’efficacité.',
      },
      { t: 'h', text: 'La taille fine' },
      {
        t: 'p',
        text: 'On ne choisit pas où on perd du gras. Faire des abdos ne brûle pas le gras du ventre. Ton tour de taille dépend de trois choses : la largeur de ton bassin et de ta cage thoracique (osseux, ça ne bouge pas), la quantité et la répartition de ton gras (ça bouge, mais tu ne pilotes pas la répartition), et le volume de tes obliques — seul levier direct, mais dans le mauvais sens : muscler lourdement les obliques épaissit la taille.',
      },
      {
        t: 'note',
        tone: 'warn',
        title: 'Un conflit dans tes objectifs',
        text: 'Tu veux prendre du poids. Prendre du poids, même bien fait, veut dire prendre un peu de gras, dont une partie ira au ventre. Ton tour de taille a plus de chances d’augmenter légèrement que de diminuer sur ces 12 semaines. C’est un choix conscient, pas une contradiction qu’un exercice résout.',
      },
      {
        t: 'p',
        text: 'Spécifique à ton diagnostic : avec une courbe centrée sur la charnière, ton creux de taille est probablement plus marqué à droite qu’à gauche. Cette asymétrie est structurelle et osseuse — aucun exercice ne l’égalisera, et ce n’est pas un problème d’obliques à corriger.',
      },
      { t: 'h', text: 'Ce que le programme fait vraiment pour ta silhouette' },
      {
        t: 'ul',
        items: [
          'Ne pas grossir tes obliques : zéro flexion latérale lestée, zéro rotation chargée. Ton travail d’obliques est isométrique — ferme sans épaissir.',
          'Développer tes fessiers et tes épaules. Élargir le haut et le bas fait paraître le milieu plus fin, sans toucher au milieu.',
          'Travailler la posture. Un buste plus droit change davantage la silhouette que quelques centimètres de tour de taille.',
        ],
      },
    ],
  },

  {
    id: 'asymetrie',
    title: 'La question de l’asymétrie',
    teaser: 'Faut-il travailler plus à gauche qu’à droite ? Réponse : non, et pourquoi.',
    when: 'À lire une fois, avant de commencer.',
    blocks: [
      {
        t: 'p',
        text: 'Le raisonnement « on renforce le côté convexe, on étire le côté concave » est intuitif et largement non vérifié. Il existe une petite étude sur le gainage latéral tenu du côté convexe, mais c’est une série de cas sans groupe contrôle : un signal faible, pas une preuve.',
      },
      {
        t: 'p',
        text: 'Les vrais protocoles asymétriques (méthode Schroth) reposent sur une évaluation en trois dimensions et une correction respiratoire — pas sur « fais plus de séries d’un côté ». Sur une courbe en rotation, une asymétrie mal orientée peut aggraver la compensation.',
      },
      { t: 'h', text: 'Concrètement' },
      {
        t: 'ol',
        items: [
          'Par défaut, tu restes symétrique. Mêmes charges, mêmes reps, mêmes durées des deux côtés, sur tous les exercices.',
          'Tu notes les différences. Sur le gainage latéral, le Pallof press et le port de valise, note si un côté est nettement plus faible ou plus inconfortable — la note d’exercice est là pour ça.',
          'Tu poses la question au kiné. Il te répondra en 30 secondes. Ça vaut le rendez-vous à soi seul.',
        ],
      },
      {
        t: 'note',
        tone: 'info',
        text: 'À titre indicatif, à faire vérifier : le côté gauche de ta charnière est le côté allongé, le droit le côté raccourci. Ce sont des informations, pas des instructions d’entraînement.',
      },
    ],
  },

  {
    id: 'progression',
    title: 'Les 12 semaines',
    teaser: 'Quand ajouter des reps, quand monter la charge, et la semaine allégée.',
    when: 'À relire au début de chaque nouvelle phase.',
    blocks: [
      { t: 'h', text: 'Semaines 1-2 — apprendre, pas performer' },
      {
        t: 'ul',
        items: [
          '2 séries au lieu de 3 sur chaque exercice.',
          'Charges très légères : tu dois finir en te disant « j’aurais pu en faire 5 de plus » (RPE 5).',
          'Note tout : la charge, le réglage du siège, le nombre de reps. Ce carnet est la partie la plus importante du programme.',
          'Tu auras des courbatures. C’est normal, ça passe en 2-3 séances.',
        ],
      },
      { t: 'h', text: 'Semaines 3-6 — la double progression' },
      {
        t: 'ul',
        items: [
          'Tant que tu n’atteins pas le haut de la fourchette sur toutes tes séries → tu gardes la même charge et tu ajoutes des reps.',
          'Quand tu atteins le haut de la fourchette sur toutes tes séries, deux séances de suite → tu augmentes la charge.',
        ],
      },
      {
        t: 'table',
        head: ['Séance', 'Charge', 'Reps', 'Décision'],
        rows: [
          ['1', '20 kg', '10, 10, 9', 'garde 20 kg'],
          ['2', '20 kg', '12, 11, 10', 'garde 20 kg'],
          ['3', '20 kg', '12, 12, 12', 'garde 20 kg (première fois)'],
          ['4', '20 kg', '12, 12, 12', 'passe à 25 kg, retour à 10 reps'],
        ],
      },
      {
        t: 'table',
        head: ['De combien on augmente', 'Incrément'],
        rows: [
          ['Bas du corps (hip thrust, presse, squat)', '+ 2,5 à 5 kg'],
          ['Haut du corps (développés, tirages)', '+ 1 à 2,5 kg, ou une plaque'],
          ['Machines à plaques', 'une plaque à la fois'],
          ['Abdos (dead bug, Pallof, gainage)', 'en durée, en amplitude, puis en variante'],
          ['Mobilité (rouleau, open book)', 'aucune progression : tu répètes, tous les jours si possible'],
        ],
      },
      { t: 'h', text: 'Semaines 7-8 — ajouter du volume' },
      {
        t: 'ul',
        items: [
          '4 séries sur le hip thrust et la presse à cuisses uniquement.',
          'Le farmer’s walk devient le port de valise (une seule main).',
          'Teste la mobilité au mur pour éventuellement réintroduire le développé épaules.',
        ],
      },
      {
        t: 'note',
        tone: 'info',
        title: 'Le test du mur',
        text: 'Dos plaqué au mur, talons à 10 cm, bas du dos collé au mur, tu montes les bras tendus au-dessus de la tête. Si tu touches le mur avec le dos des mains sans décoller ton bas du dos, tu peux réintroduire le développé épaules à la machine. Sinon, tu continues avec l’incliné. Reteste toutes les 3-4 semaines.',
      },
      { t: 'h', text: 'Semaine 9 — semaine allégée' },
      {
        t: 'p',
        text: 'Deux séances avec la moitié des charges, en 2 séries. Ça a l’air contre-productif, ça ne l’est pas : tes articulations et ton système nerveux récupèrent, et tu repars plus forte. C’est aussi le moment idéal pour retravailler ta technique. Si tu as eu des douleurs qui traînent, allège aussi les semaines 5 et 12.',
      },
      { t: 'h', text: 'Semaines 10-12 — consolider' },
      {
        t: 'ul',
        items: [
          'Reprends aux charges de la semaine 8, remonte progressivement.',
          'Passe le gainage latéral en version jambes tendues si tu tiens 3 × 30 s proprement sur les genoux.',
          'Ajoute une pause de 2 secondes en haut du hip thrust.',
          'Fin de semaine 12 : compare ton carnet à la semaine 3. C’est ta seule vraie mesure de progrès.',
        ],
      },
      { t: 'h', text: 'Quand changer quelque chose' },
      {
        t: 'table',
        head: ['Situation', 'Action'],
        rows: [
          [
            'Stagnation sur un exercice, 3 séances de suite, avec un bon sommeil',
            'Allège de 10 % et remonte. Presque toujours plus efficace que de forcer.',
          ],
          [
            'Un exercice te fait systématiquement mal au dos malgré la variante facile',
            'Tu le retires, tu le notes, tu en parles au kiné.',
          ],
          ['Plus aucune courbature, tout est facile', 'Tu progresses trop lentement en charge.'],
          ['À 12 semaines', 'Change les variantes (autre machine, autre angle), garde la structure.'],
        ],
      },
    ],
  },

  {
    id: 'semaine',
    title: 'Une semaine réussie',
    teaser: 'Ce qu’on coche à la place de la balance — et quoi faire du poids.',
    when: 'Le dimanche soir, 30 secondes.',
    blocks: [
      { t: 'h', text: 'Sur le poids' },
      {
        t: 'p',
        text: 'Vise + 100 à 250 g par semaine, pas plus. Plus vite que ça, c’est du gras. Pèse-toi 3 fois par semaine le matin à jeun et regarde la moyenne sur la semaine, jamais un chiffre isolé : le poids varie de 1 à 2 kg d’un jour à l’autre pour des raisons qui n’ont rien à voir avec le gras ou le muscle.',
      },
      { t: 'h', text: 'Les rappels de salle' },
      { t: 'ul', items: REMINDERS },
    ],
  },

  {
    id: 'nutrition',
    title: 'Manger',
    teaser: 'Protéines végé, 6 repas rapides et pas chers, et ce qui ne sert à rien.',
    when: 'À lire le jour des courses.',
    blocks: [
      { t: 'h', text: 'Les 3 choses qui comptent' },
      {
        t: 'ol',
        items: [
          'Un léger surplus de calories : + 250 à 300 kcal par jour, pas plus. Une collation quotidienne suffit. Pas de prise de poids sur 3 semaines → ajoute une deuxième collation.',
          'Assez de protéines. Végétarienne et débutante, c’est la variable qui fait la différence entre « je m’entraîne » et « je progresse ».',
          'La régularité. 12 semaines de « correct » battent 3 semaines de « parfait » suivies d’un abandon.',
        ],
      },
      {
        t: 'note',
        tone: 'good',
        title: 'Le seul repère à retenir',
        text: '1,4 à 1,6 g de protéines par kg de poids de corps. À 55 kg → 77 à 88 g par jour, soit environ 25 g à chaque repas.',
      },
      { t: 'h', text: 'Les sources végé, par rapport qualité / prix' },
      {
        t: 'table',
        head: ['Source', 'Protéines', 'Prix', 'Note'],
        rows: [
          ['Fromage blanc 0-3 %', '8 g / 100 g', '~2 €/kg', 'Meilleur rapport. 250 g = 20 g'],
          ['Skyr', '10 g / 100 g', '~4 €/kg', 'Plus cher, plus dense'],
          ['Œufs', '6 g / œuf', '~0,25 €/œuf', '3 œufs = 18 g'],
          ['Lentilles (sèches)', '25 g / 100 g', '~2,50 €/kg', 'Le champion du budget'],
          ['Pois chiches (boîte)', '8 g / 100 g', '~0,80 €/boîte', 'Aucune préparation'],
          ['Tofu ferme', '15 g / 100 g', '~2 €/200 g', 'Le ferme, pas le soyeux'],
          ['Edamame surgelés', '11 g / 100 g', '~3 €/500 g', 'Micro-ondes 4 min'],
          ['Flocons d’avoine', '13 g / 100 g', '~1,50 €/kg', 'Base de petit-déjeuner'],
          ['Whey ou protéine de pois', '22 g / dose', '~0,60 €/dose', 'Pratique, pas indispensable'],
        ],
      },
      {
        t: 'note',
        tone: 'info',
        title: 'Céréales + légumineuses',
        text: 'Les céréales manquent de lysine, les légumineuses de méthionine : ensemble elles se complètent, et pas besoin du même repas — il suffit de manger les deux dans la journée.',
      },
      { t: 'h', text: '6 repas rapides et pas chers' },
      {
        t: 'table',
        head: ['Repas', 'Prot.', 'Temps', 'Composition'],
        rows: [
          [
            'Petit-déjeuner',
            '32 g',
            '3 min',
            '250 g de fromage blanc + 50 g de flocons d’avoine + 1 banane + 1 cuillère de beurre de cacahuète. Préparable la veille dans un pot.',
          ],
          [
            'Petit-déj alternatif',
            '26 g',
            '6 min',
            'Omelette 3 œufs + 2 tranches de pain complet + 20 g de fromage râpé.',
          ],
          [
            'Déjeuner froid',
            '28 g',
            '5 min',
            '1 boîte de pois chiches + 80 g de riz ou pâtes complètes déjà cuits + tomates cerises + huile d’olive + citron + cumin. Se transporte.',
          ],
          [
            'Déjeuner chaud',
            '30 g',
            '10 min',
            '200 g de tofu ferme poêlé 5 min avec sauce soja + un sachet de légumes surgelés + 80 g de riz.',
          ],
          [
            'Dîner — batch',
            '25 g',
            '30 min / 4 portions',
            'Dahl de lentilles corail : 250 g de lentilles corail + 1 boîte de tomates + 1 boîte de lait de coco + curry + oignon + ail. ~4 € au total, se congèle.',
          ],
          [
            'Collation',
            '20 g',
            '2 min',
            '200 g de fromage blanc + 30 g de noix + miel. C’est aussi ta collation « surplus » : elle suffit à créer le + 250 kcal.',
          ],
        ],
      },
      { t: 'h', text: 'À surveiller — végétarienne, femme, 20 ans' },
      {
        t: 'ul',
        items: [
          'Le fer végétal s’absorbe mal, mais beaucoup mieux avec de la vitamine C : du citron sur tes lentilles, un kiwi ou une orange au même repas. Évite le thé pendant les repas.',
          'La vitamine B12 : si tu manges des œufs et des laitages tous les jours, tu es probablement couverte.',
          'Une prise de sang une fois par an (fer, ferritine, B12, vitamine D) donne la réponse plutôt que de deviner.',
        ],
      },
      { t: 'h', text: 'Ce qui est secondaire' },
      {
        t: 'ul',
        items: [
          'Le timing des protéines. La « fenêtre anabolique » de 30 minutes est un mythe : ce qui compte est le total sur la journée.',
          'Les compléments, sauf éventuellement la créatine (3 g/jour, efficace et sûre chez les femmes) et la vitamine D en hiver. Brûleurs de graisse, BCAA, détox, tisanes ventre plat : zéro intérêt.',
          'Le nombre de repas. 3 gros ou 5 petits, ça ne change rien tant que le total est là.',
          'Manger « propre ». Aucun aliment n’est disqualifiant. Vise 80 % d’aliments peu transformés et arrête d’y penser.',
          'Compter tes calories. Deux repères suffisent : 25 g de protéines par repas, + 100 à 250 g sur la balance par semaine.',
        ],
      },
    ],
  },

  {
    id: 'demarrer',
    title: 'Les 5 choses à faire cette semaine',
    teaser: 'La liste de départ, dans l’ordre.',
    when: 'Maintenant.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Prendre rendez-vous chez un kiné, avec le compte-rendu et les 5 questions de la fiche « Ton dos ».',
          'Le carnet de charges, c’est cette app : tu notes tout dedans, séance après séance.',
          'Commencer le bloc mobilité — rouleau + open book — dès aujourd’hui, tous les jours.',
          'Première séance : 2 séries, charges très légères. L’objectif est de trouver les machines et de noter les réglages, pas de forcer.',
          'Ajouter une collation protéinée par jour.',
        ],
      },
      {
        t: 'note',
        tone: 'good',
        title: 'Le bloc mobilité, tous les jours',
        text: 'Rouleau + open book, 5 minutes, même les jours sans salle. C’est le seul élément à faire quotidiennement — la raideur se travaille par la fréquence, pas par l’intensité.',
      },
    ],
  },
];

export const sectionById = (id: string): GuideSection | undefined =>
  GUIDE_SECTIONS.find((s) => s.id === id);
