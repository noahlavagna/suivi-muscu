/**
 * Fiches d'exercices — le contenu des parties 5, 7 et 8 du document, découpé
 * par mouvement pour être lisible sur un téléphone, en salle, entre deux
 * séries.
 *
 * Rien n'est inventé ici : chaque champ reprend une rubrique du document
 * (« à quoi ça sert pour toi », « ce que tu dois sentir », « mal exécuté si »,
 * « erreurs typiques », variantes). Les identifiants sont ceux du catalogue.
 */

export interface ExerciseGuide {
  /** Repère du document : A1, B5b, Échauffement 2… */
  tag: string;
  /** Ce qu'il faut trouver dans la salle */
  setup: string;
  /** Le schéma de séries tel que le document le donne */
  prescription: string;
  /** Le déroulé du mouvement, quand le document le détaille */
  how?: string;
  why?: string;
  feel?: string;
  wrong?: string;
  mistakes?: string[];
  /** Règle absolue / consigne non négociable */
  rule?: string;
  /** Point propre à la scoliose */
  specific?: string;
  easier?: string;
  harder?: string;
  /** Clé du schéma dans `Figures.tsx` */
  figure: string;
}

export const EXERCISE_GUIDE: Record<string, ExerciseGuide> = {
  /* ————————————————— Échauffement (12 min, les deux séances) ————————————————— */

  'ext-thoracique-rouleau': {
    tag: 'Échauffement 1',
    setup: 'Rouleau en mousse (foam roller), posé au sol perpendiculairement à toi.',
    prescription: '5 reps × 3 positions',
    how: 'Tu t’allonges sur le rouleau, rouleau au milieu du dos, mains derrière la tête (coudes vers le plafond, pas ouverts), fesses au sol. Tu laisses ton haut du dos s’ouvrir par-dessus le rouleau, lentement, 2-3 secondes, puis tu reviens. 5 fois. Puis tu remontes le rouleau de 3-4 cm et tu refais 5 fois. Puis encore une fois plus haut.',
    rule: 'Tu ne descends jamais le rouleau sous tes côtes. Plus bas, tu forces exactement à l’endroit à ne pas forcer.',
    feel: 'Un étirement d’ouverture dans le haut du dos, éventuellement des craquements (sans importance). Si ça se cambre en bas du dos, tu es descendue trop bas avec le rouleau.',
    why: 'C’est la partie la plus importante ajoutée après ton diagnostic : ta raideur dorsale est probablement ce qui reporte le mouvement sur ta charnière.',
    figure: 'rouleau',
  },

  'open-book': {
    tag: 'Échauffement 2',
    setup: 'Au sol, sur un tapis. Pas de matériel.',
    prescription: '8 reps par côté',
    how: 'Allongée sur le côté, genoux repliés à 90° l’un sur l’autre, bras tendus devant toi, paumes jointes. Tu gardes les genoux collés au sol et tu ouvres le bras du dessus vers l’arrière, comme on ouvre un livre, en suivant ta main du regard. Jusqu’à la limite confortable, tu tiens 2 secondes, tu reviens.',
    why: 'Ce n’est pas contradictoire avec l’interdiction des rotations : ce qui est interdit, c’est la rotation chargée. Ici tu es allongée, sans charge, et c’est ton haut du dos qui tourne pendant que ton bassin est bloqué par tes genoux. Tu redonnes de la rotation là où elle manque, pour éviter qu’elle soit volée à ta charnière.',
    figure: 'openBook',
  },

  velo: {
    tag: 'Échauffement 3',
    setup: 'Vélo ou elliptique.',
    prescription: '5 min',
    how: 'Allure facile, tu dois pouvoir parler.',
    figure: 'velo',
  },

  'chat-vache': {
    tag: 'Échauffement 4',
    setup: 'À quatre pattes, sur un tapis.',
    prescription: '10 allers-retours',
    how: 'Tu creuses puis tu arrondis le dos lentement.',
    feel: 'Concentre-toi sur le mouvement du haut du dos, entre les omoplates. Ne cherche pas à creuser au maximum en bas.',
    figure: 'chatVache',
  },

  'pont-fessier': {
    tag: 'Échauffement 5',
    setup: 'Allongée au sol, pieds au sol.',
    prescription: '15 reps',
    how: 'Tu montes le bassin, tu serres les fesses en haut, tu redescends en contrôlant.',
    why: 'Ça réveille les fessiers pour la suite. C’est aussi le repli du hip thrust si celui-ci tire dans le dos : le sol t’empêche de te cambrer.',
    figure: 'pontFessier',
  },

  /* ————————————————— Séance A ————————————————— */

  'hip-thrust-machine': {
    tag: 'A1',
    setup: 'Machine où tu es assise, dos calé contre un dossier, une barre rembourrée sur les hanches. Si ta salle n’en a pas : dos appuyé sur un banc plat, barre rembourrée sur le bassin.',
    prescription: '3 séries × 10-12 reps — repos 2 min',
    why: 'C’est l’exercice le plus efficace pour le volume des fessiers, ton objectif n°2. Et il charge tes fessiers sans mettre de compression sur ta colonne, contrairement au squat.',
    feel: 'Une contraction forte dans les fesses en haut du mouvement. Tu marques une pause d’une seconde en haut, fesses serrées.',
    wrong: 'Tu le sens dans le bas du dos ou à l’avant des cuisses. Signe que tu montes trop haut en te cambrant, ou que tu pousses avec les quadriceps.',
    mistakes: [
      'Monter trop haut en cambrant les lombaires. En haut, ton buste et tes cuisses forment une ligne, tu ne vas pas plus loin. Menton légèrement rentré, regard vers l’avant, pas vers le plafond.',
      'Pieds mal placés. Quand tu es en haut, tes tibias doivent être verticaux. Trop près du corps = les quadriceps prennent le relais.',
      'Descendre trop vite en laissant le poids retomber.',
    ],
    easier: 'Si ça tire dans le dos : pont fessier au sol, sans charge, 3 × 15. Le sol t’empêche de te cambrer.',
    figure: 'hipThrust',
  },

  'presse-cuisses': {
    tag: 'A2',
    setup: 'La grosse machine où tu es assise / inclinée et tu pousses une plateforme avec les pieds.',
    prescription: '3 × 10-12 — repos 2 min',
    why: 'Développer les jambes et les fessiers sans aucune charge sur ta colonne. C’est ton substitut au squat barre tant que tu n’as pas ton bilan.',
    feel: 'Les cuisses et les fesses. Pour cibler davantage les fessiers : pieds hauts sur la plateforme, écartés largeur épaules ou un peu plus.',
    wrong: 'Ton bassin décolle du dossier en bas du mouvement et ton bas du dos s’arrondit. C’est le seul vrai danger de cette machine.',
    mistakes: [
      'Descendre trop bas. Cuisses à environ 90° avec les tibias, et tu t’arrêtes avant que tes fesses ne décollent. Filme-toi une fois pour repérer ton point limite.',
      'Verrouiller les genoux à fond en haut. Laisse toujours une légère flexion.',
      'Mettre lourd tout de suite parce que « c’est facile ». Cette machine permet de charger énormément, ce n’est pas une raison.',
    ],
    easier: 'Si ça tire dans le dos : réduis l’amplitude (descends moins bas) et allège.',
    figure: 'presse',
  },

  'dev-machine': {
    tag: 'A3',
    setup: 'Machine où tu es assise et tu pousses deux poignées devant toi (chest press).',
    prescription: '3 × 10-12 — repos 90 s',
    why: 'Force de poussée du haut du corps : pectoraux, épaules, triceps. Dossier = colonne soutenue.',
    feel: 'La poitrine et l’arrière des bras. Épaules basses, omoplates plaquées contre le dossier tout du long.',
    wrong: 'Tes épaules montent vers tes oreilles, ou ton dos décolle du dossier pour t’aider.',
    mistakes: [
      'Régler le siège au hasard. Les poignées doivent arriver à hauteur du milieu de ta poitrine. Note le numéro de réglage.',
      'Tendre les bras d’un coup en verrouillant les coudes.',
      'Aller trop loin en arrière au retour. Tu t’arrêtes quand tes mains arrivent au niveau de ton torse.',
    ],
    easier: 'Développé aux haltères sur banc incliné, 2 ou 3 kg. Plus léger, mais demande plus de stabilité.',
    figure: 'chestPress',
  },

  'rowing-poulie-basse': {
    tag: 'A4',
    setup: 'Assise face à une poulie basse, pieds calés, tu tires une poignée en V vers ton ventre. Prise neutre serrée.',
    prescription: '3 × 10-12 — repos 90 s',
    why: 'Un dos fort qui soutient directement ta colonne et améliore ta posture, plus de la force de traction (tirer une porte lourde, porter des sacs). Avec ton haut du dos raide, cet exercice devient plus important, pas moins.',
    feel: 'Entre les omoplates. Tu tires les coudes vers l’arrière, tu serres les omoplates une seconde, tu reviens en contrôlant.',
    wrong: 'Ton buste part loin en arrière puis revient vers l’avant en balançant. Ton buste reste quasi immobile, seuls les bras bougent.',
    mistakes: [
      'Le balancement du buste. C’est l’erreur n°1, et avec ton diagnostic c’est celle qui te coûtera le plus cher : ce balancement se fait pile à ta charnière, sous charge, des dizaines de fois par séance. Sans exception.',
      'Tirer avec les mains et les biceps au lieu de partir des coudes.',
      'Laisser les épaules s’enrouler vers l’avant au retour. Le retour est contrôlé, pas relâché.',
    ],
    specific:
      'Sur ta crainte du « dos large » : la largeur vient des grands dorsaux, développés surtout par les tirages verticaux bras écartés. Ici, prise serrée et neutre, tu travailles le milieu du dos, ce qui te redresse au lieu de t’élargir.',
    easier: 'Rowing à la machine avec appui pectoral. Ton buste est calé, tu ne peux pas balancer.',
    figure: 'rowing',
  },

  'rowing-machine': {
    tag: 'A4 · variante',
    setup: 'Machine de rowing avec appui pectoral (chest-supported row).',
    prescription: '3 × 10-12 — repos 90 s',
    why: 'Même travail que le rowing à la poulie, mais le buste est calé : le balancement — l’erreur qui te coûte le plus cher — devient impossible.',
    feel: 'Entre les omoplates. Les coudes partent vers l’arrière, la poitrine reste collée au coussin.',
    figure: 'rowing',
  },

  'dead-bug': {
    tag: 'A5',
    setup: 'Au sol, sur un tapis. Pas de matériel.',
    prescription: '3 × 8 reps par côté — repos 60 s',
    how: 'Allongée sur le dos, bras tendus vers le plafond, genoux pliés à 90° au-dessus des hanches. Tu plaques ton bas du dos contre le sol (pas d’espace sous tes lombaires). Puis tu descends lentement un bras vers l’arrière et la jambe opposée vers l’avant, sans que ton dos ne décolle. Tu reviens. Tu alternes.',
    why: 'Ton exercice d’abdos principal. Anti-extension : tu apprends à garder ton bassin stable pendant que tes membres bougent. C’est exactement la fonction protectrice dont ton dos a besoin.',
    feel: 'Une tension profonde dans le ventre, du nombril au bas-ventre. Tu respires normalement, tu ne bloques pas.',
    wrong: 'Ton bas du dos se creuse et décolle du sol quand tu descends la jambe. C’est le seul critère qui compte. Glisse une main sous tes lombaires : si tu sens la pression disparaître, tu es allée trop loin.',
    mistakes: [
      'Descendre la jambe trop bas trop tôt. Tu descends seulement jusqu’où tu gardes le dos plaqué, même si c’est 20 cm.',
      'Aller vite. C’est un exercice lent : 3 secondes pour descendre, 3 pour revenir.',
      'Bloquer sa respiration.',
    ],
    easier:
      'Ne bouge que les jambes, bras posés au sol le long du corps. Ou ne bouge qu’une jambe à la fois, bras immobiles.',
    figure: 'deadBug',
  },

  'farmer-walk': {
    tag: 'A6',
    setup: 'Deux haltères, une dans chaque main. Tu marches.',
    prescription: '3 × 30 mètres (ou 40 secondes) — repos 90 s',
    why: 'Trois de tes objectifs d’un coup. Force de préhension — ton pot de cornichons, c’est très largement une histoire de poigne et d’avant-bras. Anti-flexion latérale pour tes abdos : tes obliques travaillent en isométrie pour t’empêcher de pencher. Et stabilité globale du tronc.',
    feel: 'Les avant-bras qui brûlent, les épaules et le haut du dos qui travaillent pour rester droits, et une tension sur les côtés du ventre.',
    wrong: 'Tu penches d’un côté, tu creuses le dos, ou tes épaules s’enroulent vers l’avant.',
    mistakes: [
      'Prendre trop lourd et marcher penchée. Commence à 6-8 kg par main.',
      'Regarder ses pieds. Regard devant, buste droit, épaules en arrière et basses.',
      'Marcher à grands pas. Petits pas, contrôlés.',
    ],
    easier: 'Allège et raccourcis à 20 m.',
    harder: 'À partir de la semaine 7 : une seule haltère, dans une main (port de valise).',
    figure: 'farmer',
  },

  'suitcase-carry': {
    tag: 'A6 · semaine 7+',
    setup: 'Une seule haltère, dans une main. Tu marches.',
    prescription: '3 × 30 mètres (ou 40 secondes) — repos 90 s',
    why: 'La version dure du farmer’s walk : avec une charge d’un seul côté, tes obliques doivent empêcher tout le buste de pencher. Beaucoup plus exigeant en anti-flexion latérale.',
    feel: 'Une tension marquée sur le côté du ventre opposé à l’haltère.',
    wrong: 'Tu penches du côté de l’haltère, ou tu contres en penchant de l’autre côté. Les épaules restent au même niveau.',
    mistakes: [
      'Trop lourd d’emblée : commence plus léger que ton farmer’s walk par main.',
      'Oublier de changer de main. Même charge, même distance des deux côtés.',
    ],
    specific:
      'C’est un des exercices où tu notes si un côté est nettement plus faible ou plus inconfortable — c’est une donnée utile pour le kiné, pas une raison de compenser toute seule.',
    easier: 'Reviens au farmer’s walk, une haltère dans chaque main.',
    figure: 'suitcase',
  },

  /* ————————————————— Séance B ————————————————— */

  'squat-gobelet': {
    tag: 'B1',
    setup: 'Tu tiens une haltère verticalement contre ta poitrine, à deux mains, et tu t’assois sur un banc ou une box derrière toi.',
    prescription: '3 × 8-10 — repos 2 min',
    why: 'Apprendre le mouvement de squat sans charge sur la colonne. La box te donne un repère de profondeur et te rassure. La charge devant toi t’oblige à garder le buste droit.',
    feel: 'Cuisses et fessiers. Tu touches le banc sans t’asseoir complètement, puis tu remontes.',
    wrong: 'Ton bas du dos s’arrondit en bas (regarde de profil dans un miroir), ou tu te laisses tomber sur le banc.',
    specific:
      'Surveille l’inclinaison du buste. Avec ton sommet de courbe juste au-dessus de la taille, un buste très penché en avant sous charge est exactement le levier à éviter. Prends une box un peu plus haute au début pour rester plus verticale.',
    mistakes: [
      'Descendre plus bas que ce que ta mobilité permet. Choisis un banc assez haut au début.',
      'Les genoux qui rentrent vers l’intérieur en remontant. Pense à « pousser le sol vers l’extérieur » avec les pieds.',
      'Se laisser tomber sur la box. La descente est freinée, sur 3 secondes.',
    ],
    easier: 'Sans haltère, bras tendus devant pour l’équilibre, box plus haute.',
    figure: 'gobletSquat',
  },

  'leg-curl-assis': {
    tag: 'B2',
    setup: 'Machine où tu plies les genoux contre une résistance, assise ou allongée.',
    prescription: '3 × 12-15 — repos 90 s',
    why: 'L’arrière des cuisses, qui travaille peu dans les autres exercices. Un arrière de cuisse fort équilibre l’avant et participe à la stabilité du bassin — ce qui compte pour ton dos.',
    feel: 'L’arrière des cuisses. Uniquement.',
    wrong: 'Ton bassin décolle du siège, ou tu ressens quoi que ce soit dans le bas du dos.',
    mistakes: [
      'Décoller les fesses pour finir la rep. Allège.',
      'Laisser la charge remonter d’un coup. Le retour se fait sur 3 secondes, c’est là que se passe la moitié du travail.',
      'Mal régler la position du coussin : il doit être juste au-dessus du talon, pas sur le mollet.',
    ],
    easier: 'Allège, réduis l’amplitude.',
    figure: 'legCurl',
  },

  'leg-curl': {
    tag: 'B2 · variante',
    setup: 'Leg curl allongée, à plat ventre sur la machine.',
    prescription: '3 × 12-15 — repos 90 s',
    why: 'Même travail que la version assise. Choisis celle où ton bassin reste le plus stable.',
    wrong: 'Tu décolles le bassin de la machine pour finir la rep, ou tu sens quelque chose dans le bas du dos.',
    figure: 'legCurl',
  },

  'abduction-machine': {
    tag: 'B3',
    setup: 'Machine assise où tu écartes les genoux contre une résistance.',
    prescription: '3 × 15 — repos 60 s',
    why: 'Le moyen fessier, sur le côté de la hanche. C’est lui qui donne la forme arrondie sur les côtés des fesses, et c’est aussi lui qui stabilise ton bassin quand tu marches. Bassin stable = moins de contraintes latérales sur tes lombaires.',
    feel: 'Une brûlure assez nette sur le côté externe des hanches.',
    wrong: 'Tu le sens dans le bas du dos, ou tu te penches en arrière pour aider.',
    mistakes: [
      'Aller trop vite et rebondir. 2 secondes pour ouvrir, pause, 2 secondes pour fermer.',
      'Ne pas ouvrir assez large.',
      'Se pencher en avant ou en arrière. Buste vertical, dos contre le dossier.',
    ],
    easier: 'Élastique autour des genoux, allongée sur le côté.',
    figure: 'abduction',
  },

  'tirage-vertical-neutre': {
    tag: 'B4',
    setup: 'La poulie haute, avec une poignée en V ou une barre à poignées parallèles. Pas la longue barre prise large.',
    prescription: '3 × 10-12 — repos 90 s',
    why: 'Force de traction verticale (soulever, tirer vers le bas, se hisser) et renforcement du haut du dos. Prise neutre et serrée = moins d’accent sur la largeur, plus sur l’épaisseur et la posture.',
    feel: 'Le dos, sous les aisselles et entre les omoplates, plus les biceps.',
    wrong: 'Tu te penches beaucoup en arrière et tu utilises l’élan de tout le corps. Une légère inclinaison du buste (10-15°) est normale, un balancement ne l’est pas.',
    rule: 'Jamais derrière la nuque.',
    mistakes: [
      'Tirer trop lourd et compenser avec le corps entier.',
      'Ne pas caler les cuisses sous les coussins, donc décoller du siège.',
      'Tirer avec les mains. Pense à « amener les coudes vers les côtes ».',
    ],
    easier: 'Allège, ou utilise la machine à tirage vertical guidée si ta salle en a une.',
    figure: 'pulldown',
  },

  'dev-incline-halteres': {
    tag: 'B5a',
    setup: 'Banc réglé à 45°, pas plus. Une haltère dans chaque main, tu pousses vers le haut en diagonale.',
    prescription: '3 × 10-12 — repos 90 s',
    why: 'Remplace le développé épaules classique. Avec un haut du dos raide, tu ne peux pas amener les bras à la verticale au-dessus de la tête sans que ton corps triche — et il triche en cambrant les lombaires, sous charge, à quelques centimètres de ton sommet de courbe. À 45°, ton épaule atteint la position sans exiger l’extension du haut du dos.',
    feel: 'Les épaules et le haut des pectoraux.',
    rule: 'Ton bas du dos reste en contact avec le banc pendant toute la série. Si tu dois te décoller, allège.',
    mistakes: [
      'Cogner les haltères en haut. Garde 5 cm d’écart.',
      'Descendre trop bas et étirer l’épaule.',
      'Incliner le banc à 60-70° « pour mieux faire » — tu recrées exactement le problème.',
    ],
    figure: 'inclinePress',
  },

  'elev-lat-halteres': {
    tag: 'B5b',
    setup: 'Deux haltères légères. Debout, ou assise sur un banc avec dossier.',
    prescription: '3 × 12-15 — repos 60 s',
    how: 'Une haltère dans chaque main le long du corps, coudes très légèrement fléchis. Tu lèves les bras sur les côtés jusqu’à hauteur d’épaules, pas plus haut. Tu redescends sur 3 secondes.',
    why: 'C’est l’exercice qui élargit visuellement les épaules, donc ton meilleur levier pour l’effet « taille plus fine ». Et il n’exige aucune mobilité du haut du dos.',
    feel: 'Le côté de l’épaule. Uniquement.',
    mistakes: [
      'Trop lourd. Commence à 2-3 kg, sérieusement — c’est un des exercices où on met le plus léger.',
      'Monter au-dessus des épaules.',
      'Se balancer d’avant en arrière pour lancer la charge, ou hausser les épaules vers les oreilles.',
    ],
    easier: 'Assise sur un banc avec dossier, ce qui supprime toute possibilité de balancement.',
    figure: 'lateralRaise',
  },

  'pallof-press': {
    tag: 'B6',
    setup: 'Poulie réglée à hauteur de ta poitrine, poignée simple. Tu te places de profil par rapport à la poulie.',
    prescription: '3 × 10 par côté — repos 60 s',
    how: 'Debout de profil à la poulie, pieds largeur bassin, tu tiens la poignée à deux mains contre ta poitrine. Tu pousses les bras droit devant toi, tu tiens 2 secondes, tu ramènes. La poulie essaie de te faire tourner : tout ton travail consiste à ne pas tourner.',
    why: 'Ton exercice d’anti-rotation. Il travaille tes obliques et ton transverse sans faire tourner ta colonne — le remplaçant intelligent des rotations lestées, et exactement ce dont une colonne en rotation a besoin.',
    feel: 'Une tension forte sur tout le pourtour du ventre, surtout du côté opposé à la poulie.',
    wrong: 'Ton buste pivote vers la poulie, ou tu penches sur le côté pour compenser. Allège.',
    mistakes: [
      'Trop lourd. La difficulté est de résister, pas de pousser.',
      'Se pencher en arrière.',
      'Bloquer sa respiration. Tu respires pendant les 2 secondes de tenue.',
    ],
    easier: 'Allège, ou fais-le à genoux (les deux genoux au sol) pour supprimer la variable équilibre.',
    figure: 'pallof',
  },

  'planche-laterale': {
    tag: 'B7',
    setup: 'Au sol, sur un tapis. Pas de matériel. Genoux au sol.',
    prescription: '3 × 20-30 s par côté — repos 45 s',
    how: 'Allongée sur le côté, appuyée sur l’avant-bras (coude exactement sous l’épaule) et sur les genoux pliés. Tu montes les hanches pour former une ligne droite de la tête aux genoux. Tu tiens.',
    why: 'Anti-flexion latérale. Un des rares exercices qui travaille les muscles latéraux du tronc en isométrie, donc sans épaissir la taille. Il renforce aussi le carré des lombes, souvent impliqué dans les douleurs lombaires.',
    feel: 'Le côté du ventre et la hanche du bas.',
    wrong: 'Tes hanches s’affaissent progressivement, ou tu bascules vers l’avant / l’arrière. Dès que la position se dégrade, tu arrêtes le chrono. Une tenue de 20 s propre vaut mieux qu’une tenue de 45 s dégradée.',
    mistakes: [
      'Coude mal placé, trop en avant ou trop loin du corps.',
      'Laisser tomber la tête. La tête prolonge la colonne.',
      'Tenir jusqu’à l’échec. Inutile ici.',
    ],
    specific:
      'Si tu sens une grosse différence entre les deux côtés, note-la et ne compense pas toute seule : sur une scoliose, le choix du côté à renforcer ne se devine pas. C’est la question à poser au kiné.',
    harder: 'Quand 3 × 30 s devient facile : jambes tendues, appui sur les pieds.',
    figure: 'sidePlank',
  },
};

export const guideFor = (exerciseId: string): ExerciseGuide | undefined =>
  EXERCISE_GUIDE[exerciseId];
