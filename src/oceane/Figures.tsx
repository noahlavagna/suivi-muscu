import type { ReactNode } from 'react';

/**
 * Schémas d'exercices — deux vignettes par mouvement : la position de départ,
 * puis la position d'arrivée.
 *
 * La première version superposait les deux positions dans un même dessin, la
 * seconde en pointillé. Résultat : des enchevêtrements de traits qu'il fallait
 * décoder. Une débutante ne doit pas avoir à deviner quelle jambe appartient à
 * quelle position — deux vignettes côte à côte, c'est la convention des
 * planches d'exercices, et ça se lit sans mode d'emploi. Le pointillé ne sert
 * plus qu'à une chose : montrer l'erreur, barrée d'une croix.
 *
 * Repère : deux cellules de 170 × 156, sol à y = 118, tout en `currentColor`
 * pour suivre le thème clair / sombre sans variante d'image.
 */

type P = [number, number];

const CELL = 170;
const GROUND_Y = 118;

/* ————————————————— Primitives ————————————————— */

/**
 * Corps : tête, cou, tronc, bras et jambes. Les mains sont marquées d'un point
 * et les pieds d'un petit trait — sans eux, un membre tendu ne se distingue
 * pas d'un trait de matériel.
 */
function Body({
  head,
  sh,
  hip,
  el,
  ha,
  kn,
  an,
  el2,
  ha2,
  kn2,
  an2,
  facing = 1,
  faded = false,
}: {
  head: P;
  sh: P;
  hip: P;
  el?: P;
  ha?: P;
  kn?: P;
  an?: P;
  el2?: P;
  ha2?: P;
  kn2?: P;
  an2?: P;
  /** Sens des pieds : 1 vers la droite, -1 vers la gauche, 0 aucun pied dessiné */
  facing?: 1 | -1 | 0;
  /** Silhouette d'erreur : pointillé, effacée */
  faded?: boolean;
}) {
  const arm = (a?: P, b?: P) =>
    a && b ? (
      <>
        <polyline points={`${sh[0]},${sh[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`} />
        {!faded && <circle cx={b[0]} cy={b[1]} r={3} fill="currentColor" stroke="none" />}
      </>
    ) : null;
  const leg = (a?: P, b?: P) =>
    a && b ? (
      <>
        <polyline points={`${hip[0]},${hip[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`} />
        {!faded && facing !== 0 && (
          <line x1={b[0]} y1={b[1]} x2={b[0] + 10 * facing} y2={b[1]} strokeWidth={4} />
        )}
      </>
    ) : null;
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={faded ? 3 : 5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={faded ? '7 6' : undefined}
      opacity={faded ? 0.4 : 1}
    >
      {/* Membres du fond d'abord : le tronc passe par-dessus */}
      {arm(el2, ha2)}
      {leg(kn2, an2)}
      <line x1={head[0]} y1={head[1]} x2={sh[0]} y2={sh[1]} strokeWidth={faded ? 3 : 4} />
      <line x1={sh[0]} y1={sh[1]} x2={hip[0]} y2={hip[1]} />
      <circle cx={head[0]} cy={head[1]} r={9} />
      {arm(el, ha)}
      {leg(kn, an)}
    </g>
  );
}

const Ground = ({ y = GROUND_Y }: { y?: number }) => (
  <line
    x1={10}
    y1={y}
    x2={160}
    y2={y}
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    className="text-ink-3"
    opacity={0.5}
  />
);

/** Matériel : banc, machine, box, poulie — trait neutre, jamais l'accent. */
const Gear = ({ children }: { children: ReactNode }) => (
  <g
    fill="none"
    stroke="currentColor"
    strokeWidth={4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-ink-3"
    opacity={0.8}
  >
    {children}
  </g>
);

/** Charge et câbles : ce qu'on manipule, donc à l'accent. */
const Load = ({ children }: { children: ReactNode }) => (
  <g
    fill="none"
    stroke="currentColor"
    strokeWidth={4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-accent"
  >
    {children}
  </g>
);

const Dumbbell = ({ at, angle = 0, s = 1 }: { at: P; angle?: number; s?: number }) => (
  <g transform={`translate(${at[0]} ${at[1]}) rotate(${angle}) scale(${s})`}>
    <line x1={-8} y1={0} x2={8} y2={0} strokeWidth={3} />
    <line x1={-8} y1={-6} x2={-8} y2={6} strokeWidth={5} />
    <line x1={8} y1={-6} x2={8} y2={6} strokeWidth={5} />
  </g>
);

/** Flèche du sens du mouvement. */
function Arrow({ from, to, curve = 0 }: { from: P; to: P; curve?: number }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2 + curve;
  const my = (y1 + y2) / 2 - Math.abs(curve) * 0.35;
  const angle = (Math.atan2(y2 - my, x2 - mx) * 180) / Math.PI;
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    >
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} />
      <g transform={`translate(${x2} ${y2}) rotate(${angle})`}>
        <polyline points="-9,-6 0,0 -9,6" />
      </g>
    </g>
  );
}

/**
 * Le geste à ne pas faire : trait plein, en rouge. Le pointillé, lui, se
 * lisait comme un brouillon — on ne voyait plus la posture.
 */
const Wrong = ({ children }: { children: ReactNode }) => (
  <g className="text-negative">{children}</g>
);

/** Croix : cette vignette montre l'erreur, pas le geste à copier. */
const Cross = ({ at }: { at: P }) => (
  <g className="text-negative" stroke="currentColor" strokeLinecap="round" fill="none">
    <circle cx={at[0]} cy={at[1]} r={11} strokeWidth={3} />
    <line x1={at[0] - 5} y1={at[1] - 5} x2={at[0] + 5} y2={at[1] + 5} strokeWidth={4} />
    <line x1={at[0] + 5} y1={at[1] - 5} x2={at[0] - 5} y2={at[1] + 5} strokeWidth={4} />
  </g>
);

/** Une vignette : son titre, son dessin. */
function Panel({
  i,
  title,
  wrong = false,
  children,
}: {
  i: number;
  title: string;
  wrong?: boolean;
  children: ReactNode;
}) {
  return (
    <g transform={`translate(${i * CELL} 0)`}>
      <text
        x={CELL / 2}
        y={16}
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
        fill="currentColor"
        className={wrong ? 'text-negative' : 'text-accent'}
      >
        {title}
      </text>
      <g className="text-ink">{children}</g>
    </g>
  );
}

/** Note commune aux deux vignettes, en pied de schéma. */
const Note = ({ children }: { children: string }) => (
  <text
    x={CELL}
    y={150}
    fontSize={11}
    fontWeight={600}
    textAnchor="middle"
    fill="currentColor"
    className="text-ink-2"
  >
    {children}
  </text>
);

/* ————————————————— Les schémas ————————————————— */

const FIGURES: Record<string, ReactNode> = {
  /* — Échauffement — */

  rouleau: (
    <>
      <Panel i={0} title="1 · Allongée sur le rouleau">
        <Ground />
        <Load>
          <circle cx={84} cy={106} r={12} />
        </Load>
        <Body
          head={[112, 84]}
          sh={[88, 92]}
          hip={[44, 110]}
          el={[108, 68]}
          ha={[88, 64]}
          kn={[24, 94]}
          an={[16, 112]}
          facing={-1}
        />
      </Panel>
      <Panel i={1} title="2 · Tu t’ouvres par-dessus">
        <Ground />
        <Load>
          <circle cx={84} cy={106} r={12} />
        </Load>
        <Body
          head={[120, 94]}
          sh={[90, 90]}
          hip={[44, 110]}
          el={[114, 74]}
          ha={[94, 68]}
          kn={[24, 94]}
          an={[16, 112]}
          facing={-1}
        />
        <Arrow from={[132, 72]} to={[142, 96]} curve={14} />
      </Panel>
      <Note>Le rouleau reste sur les côtes, jamais plus bas · 5 reps, puis on remonte.</Note>
    </>
  ),

  openBook: (
    <>
      <Panel i={0} title="1 · Sur le côté, bras joints">
        <Body
          head={[126, 84]}
          sh={[102, 84]}
          hip={[56, 84]}
          el={[102, 64]}
          ha={[102, 42]}
          kn={[34, 96]}
          an={[48, 112]}
          facing={0}
        />
      </Panel>
      <Panel i={1} title="2 · Tu ouvres le bras">
        <Body
          head={[126, 84]}
          sh={[102, 84]}
          hip={[56, 84]}
          el={[118, 98]}
          ha={[134, 110]}
          kn={[34, 96]}
          an={[48, 112]}
          facing={0}
        />
        <Arrow from={[106, 42]} to={[146, 98]} curve={36} />
      </Panel>
      <Note>Les genoux restent collés au sol : seul le haut du dos tourne.</Note>
    </>
  ),

  velo: (
    <>
      <Panel i={0} title="Vélo ou elliptique">
        <Ground />
        <Gear>
          <circle cx={44} cy={98} r={18} />
          <circle cx={132} cy={98} r={18} />
          <line x1={44} y1={98} x2={94} y2={98} />
          <line x1={94} y1={98} x2={74} y2={60} />
          <line x1={74} y1={60} x2={132} y2={98} />
          <line x1={110} y1={68} x2={128} y2={60} />
        </Gear>
        <Body
          head={[80, 34]}
          sh={[80, 52]}
          hip={[72, 74]}
          el={[100, 58]}
          ha={[122, 58]}
          kn={[100, 84]}
          an={[94, 98]}
          facing={1}
        />
      </Panel>
      <Panel i={1} title="Allure facile">
        <g className="text-ink-2">
          <text
            x={CELL / 2}
            y={68}
            fontSize={32}
            fontWeight={800}
            textAnchor="middle"
            fill="currentColor"
          >
            5 min
          </text>
          <text x={CELL / 2} y={92} fontSize={13} textAnchor="middle" fill="currentColor">
            tu dois pouvoir parler
          </text>
          <text x={CELL / 2} y={110} fontSize={13} textAnchor="middle" fill="currentColor">
            en pédalant
          </text>
        </g>
      </Panel>
      <Note>Le bloc mobilité vient avant le cardio, jamais l’inverse.</Note>
    </>
  ),

  chatVache: (
    <>
      <Panel i={0} title="1 · Dos creusé">
        <Ground />
        <Gear>
          <line x1={46} y1={118} x2={50} y2={86} />
          <line x1={126} y1={118} x2={122} y2={88} />
        </Gear>
        <g fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round">
          <path d="M 50 86 Q 86 102 122 88" />
          <line x1={40} y1={80} x2={50} y2={86} strokeWidth={4} />
          <circle cx={32} cy={76} r={9} />
        </g>
      </Panel>
      <Panel i={1} title="2 · Dos arrondi">
        <Ground />
        <Gear>
          <line x1={46} y1={118} x2={50} y2={86} />
          <line x1={126} y1={118} x2={122} y2={88} />
        </Gear>
        <g fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round">
          <path d="M 50 86 Q 86 54 122 88" />
          <line x1={40} y1={94} x2={50} y2={88} strokeWidth={4} />
          <circle cx={32} cy={98} r={9} />
        </g>
        <Arrow from={[86, 84]} to={[86, 56]} />
      </Panel>
      <Note>Le mouvement vient du haut du dos, entre les omoplates.</Note>
    </>
  ),

  pontFessier: (
    <>
      <Panel i={0} title="1 · Bassin au sol">
        <Ground />
        <Body
          head={[24, 106]}
          sh={[44, 112]}
          hip={[92, 112]}
          el={[62, 116]}
          ha={[80, 116]}
          kn={[124, 94]}
          an={[130, 118]}
          facing={1}
        />
      </Panel>
      <Panel i={1} title="2 · Tu montes le bassin">
        <Ground />
        <Body
          head={[24, 106]}
          sh={[44, 112]}
          hip={[94, 86]}
          el={[62, 116]}
          ha={[80, 116]}
          kn={[126, 92]}
          an={[130, 118]}
          facing={1}
        />
        <Arrow from={[94, 110]} to={[94, 76]} />
      </Panel>
      <Note>Fesses serrées une seconde en haut, sans cambrer le bas du dos.</Note>
    </>
  ),

  /* — Séance A — */

  hipThrust: (
    <>
      <Panel i={0} title="1 · Bassin en bas">
        <Ground />
        <Gear>
          <line x1={14} y1={82} x2={50} y2={82} />
          <line x1={20} y1={82} x2={20} y2={118} />
        </Gear>
        <Body
          head={[28, 70]}
          sh={[48, 78]}
          hip={[96, 104]}
          el={[62, 62]}
          ha={[80, 64]}
          kn={[132, 90]}
          an={[134, 118]}
          facing={1}
        />
        <Load>
          <line x1={84} y1={96} x2={110} y2={96} strokeWidth={6} />
          <circle cx={84} cy={96} r={6} />
          <circle cx={110} cy={96} r={6} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Buste et cuisses alignés">
        <Ground />
        <Gear>
          <line x1={14} y1={82} x2={50} y2={82} />
          <line x1={20} y1={82} x2={20} y2={118} />
        </Gear>
        <Body
          head={[28, 68]}
          sh={[48, 76]}
          hip={[100, 80]}
          el={[62, 60]}
          ha={[80, 62]}
          kn={[134, 82]}
          an={[134, 118]}
          facing={1}
        />
        <Load>
          <line x1={88} y1={72} x2={114} y2={72} strokeWidth={6} />
          <circle cx={88} cy={72} r={6} />
          <circle cx={114} cy={72} r={6} />
        </Load>
        <Arrow from={[120, 104]} to={[120, 76]} />
      </Panel>
      <Note>Tibias verticaux en haut · menton rentré, on ne monte pas plus loin.</Note>
    </>
  ),

  presse: (
    <>
      <Panel i={0} title="1 · Cuisses à 90°">
        <Gear>
          <line x1={10} y1={48} x2={44} y2={104} />
          <line x1={44} y1={104} x2={78} y2={104} />
        </Gear>
        <Body
          head={[22, 50]}
          sh={[34, 66]}
          hip={[70, 96]}
          el={[50, 86]}
          ha={[70, 80]}
          kn={[98, 62]}
          an={[120, 80]}
          facing={0}
        />
        <Load>
          <line x1={114} y1={60} x2={138} y2={96} strokeWidth={7} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu pousses">
        <Gear>
          <line x1={10} y1={48} x2={44} y2={104} />
          <line x1={44} y1={104} x2={78} y2={104} />
        </Gear>
        <Body
          head={[22, 50]}
          sh={[34, 66]}
          hip={[70, 96]}
          el={[50, 86]}
          ha={[70, 80]}
          kn={[106, 72]}
          an={[142, 56]}
          facing={0}
        />
        <Load>
          <line x1={136} y1={36} x2={158} y2={70} strokeWidth={7} />
        </Load>
        <Arrow from={[96, 108]} to={[132, 96]} />
      </Panel>
      <Note>Le bassin ne décolle jamais du dossier · genoux jamais verrouillés en haut.</Note>
    </>
  ),

  chestPress: (
    <>
      <Panel i={0} title="1 · Mains au niveau du torse">
        <Gear>
          <line x1={40} y1={42} x2={40} y2={104} />
          <line x1={40} y1={104} x2={80} y2={104} />
        </Gear>
        <Body
          head={[54, 44]}
          sh={[54, 62]}
          hip={[54, 100]}
          el={[62, 80]}
          ha={[84, 76]}
          kn={[88, 106]}
          an={[88, 118]}
          facing={1}
        />
        <Load>
          <line x1={90} y1={62} x2={90} y2={90} strokeWidth={6} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu pousses devant">
        <Gear>
          <line x1={40} y1={42} x2={40} y2={104} />
          <line x1={40} y1={104} x2={80} y2={104} />
        </Gear>
        <Body
          head={[54, 44]}
          sh={[54, 62]}
          hip={[54, 100]}
          el={[84, 68]}
          ha={[114, 66]}
          kn={[88, 106]}
          an={[88, 118]}
          facing={1}
        />
        <Load>
          <line x1={120} y1={52} x2={120} y2={80} strokeWidth={6} />
        </Load>
        <Arrow from={[100, 100]} to={[134, 100]} />
      </Panel>
      <Note>Omoplates plaquées au dossier, épaules basses, coudes non verrouillés.</Note>
    </>
  ),

  rowing: (
    <>
      <Panel i={0} title="1 · Bras tendus">
        <Gear>
          <line x1={30} y1={104} x2={116} y2={104} />
          <line x1={16} y1={72} x2={16} y2={112} />
        </Gear>
        <Body
          head={[96, 42]}
          sh={[96, 60]}
          hip={[96, 100]}
          el={[70, 76]}
          ha={[44, 80]}
          kn={[58, 96]}
          an={[30, 100]}
          facing={-1}
        />
        <Load>
          <line x1={16} y1={88} x2={44} y2={80} />
          <line x1={44} y1={74} x2={44} y2={86} strokeWidth={5} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Coudes vers l’arrière">
        <Gear>
          <line x1={30} y1={104} x2={116} y2={104} />
          <line x1={16} y1={72} x2={16} y2={112} />
        </Gear>
        <Body
          head={[96, 42]}
          sh={[96, 60]}
          hip={[96, 100]}
          el={[122, 72]}
          ha={[86, 78]}
          kn={[58, 96]}
          an={[30, 100]}
          facing={-1}
        />
        <Load>
          <line x1={16} y1={88} x2={86} y2={78} />
          <line x1={86} y1={72} x2={86} y2={84} strokeWidth={5} />
        </Load>
        <Arrow from={[124, 50]} to={[150, 50]} />
      </Panel>
      <Note>Le buste est identique sur les deux images : seuls les bras bougent.</Note>
    </>
  ),

  deadBug: (
    <>
      <Panel i={0} title="1 · 90/90, dos plaqué">
        <Ground />
        <Body
          head={[26, 108]}
          sh={[52, 112]}
          hip={[98, 112]}
          el={[56, 92]}
          ha={[48, 70]}
          kn={[100, 80]}
          an={[128, 74]}
          facing={0}
        />
        <g className="text-accent">
          <line
            x1={64}
            y1={116}
            x2={92}
            y2={116}
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      </Panel>
      <Panel i={1} title="2 · Bras et jambe opposés">
        <Ground />
        <Body
          head={[26, 108]}
          sh={[52, 112]}
          hip={[98, 112]}
          el={[34, 96]}
          ha={[12, 88]}
          kn={[124, 92]}
          an={[152, 100]}
          facing={0}
        />
        <g className="text-accent">
          <line
            x1={64}
            y1={116}
            x2={92}
            y2={116}
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
        <Arrow from={[50, 64]} to={[20, 76]} curve={-14} />
        <Arrow from={[126, 68]} to={[152, 88]} curve={12} />
      </Panel>
      <Note>Le trait rose, c’est ton bas du dos : il reste collé au sol tout du long.</Note>
    </>
  ),

  farmer: (
    <>
      <Panel i={0} title="1 · Une haltère dans chaque main">
        <Ground />
        <Body
          head={[84, 32]}
          sh={[84, 50]}
          hip={[84, 86]}
          el={[68, 66]}
          ha={[66, 86]}
          el2={[100, 66]}
          ha2={[102, 86]}
          kn={[76, 102]}
          an={[74, 118]}
          kn2={[92, 102]}
          an2={[94, 118]}
          facing={1}
        />
        <Load>
          <Dumbbell at={[66, 96]} angle={90} />
          <Dumbbell at={[102, 96]} angle={90} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu marches, buste droit">
        <Ground />
        <g className="text-ink-3" opacity={0.4}>
          <line
            x1={84}
            y1={24}
            x2={84}
            y2={118}
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </g>
        <Body
          head={[84, 32]}
          sh={[84, 50]}
          hip={[84, 86]}
          el={[68, 66]}
          ha={[66, 86]}
          el2={[100, 66]}
          ha2={[102, 86]}
          kn={[68, 102]}
          an={[60, 118]}
          kn2={[100, 100]}
          an2={[108, 118]}
          facing={1}
        />
        <Load>
          <Dumbbell at={[66, 96]} angle={90} />
          <Dumbbell at={[102, 96]} angle={90} />
        </Load>
        <Arrow from={[126, 74]} to={[152, 74]} />
      </Panel>
      <Note>Petits pas, regard devant, épaules basses · 6-8 kg par main pour commencer.</Note>
    </>
  ),

  suitcase: (
    <>
      <Panel i={0} title="1 · Épaules à niveau">
        <Ground />
        <g className="text-ink-3" opacity={0.4}>
          <line
            x1={54}
            y1={50}
            x2={114}
            y2={50}
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </g>
        <Body
          head={[84, 32]}
          sh={[84, 50]}
          hip={[84, 86]}
          el={[68, 66]}
          ha={[66, 86]}
          el2={[100, 64]}
          ha2={[104, 80]}
          kn={[76, 102]}
          an={[74, 118]}
          kn2={[92, 102]}
          an2={[94, 118]}
          facing={1}
        />
        <Load>
          <Dumbbell at={[66, 96]} angle={90} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Pencher du côté de l’haltère" wrong>
        <Ground />
        <Wrong>
          <Body
            head={[72, 40]}
            sh={[78, 58]}
            hip={[92, 90]}
            el={[58, 72]}
            ha={[54, 92]}
            kn={[84, 104]}
            an={[82, 118]}
            facing={1}
          />
          <Dumbbell at={[54, 102]} angle={90} />
        </Wrong>
        <Cross at={[130, 52]} />
      </Panel>
      <Note>Tout le travail est de rester droite. Même charge, même distance des deux côtés.</Note>
    </>
  ),

  /* — Séance B — */

  gobletSquat: (
    <>
      <Panel i={0} title="1 · Debout, haltère au torse">
        <Ground />
        <Gear>
          <line x1={110} y1={96} x2={152} y2={96} />
          <line x1={114} y1={96} x2={114} y2={118} />
          <line x1={148} y1={96} x2={148} y2={118} />
        </Gear>
        <Body
          head={[62, 32]}
          sh={[62, 50]}
          hip={[62, 84]}
          el={[48, 64]}
          ha={[54, 54]}
          kn={[62, 102]}
          an={[62, 118]}
          facing={1}
        />
        <Load>
          <Dumbbell at={[44, 56]} angle={90} s={0.9} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu touches la box">
        <Ground />
        <Gear>
          <line x1={110} y1={96} x2={152} y2={96} />
          <line x1={114} y1={96} x2={114} y2={118} />
          <line x1={148} y1={96} x2={148} y2={118} />
        </Gear>
        <Body
          head={[74, 44]}
          sh={[78, 60]}
          hip={[112, 90]}
          el={[68, 70]}
          ha={[70, 56]}
          kn={[92, 104]}
          an={[70, 118]}
          facing={1}
        />
        <Load>
          <Dumbbell at={[58, 52]} angle={90} s={0.9} />
        </Load>
        <Arrow from={[136, 60]} to={[136, 86]} />
      </Panel>
      <Note>Tu touches sans t’asseoir · descente freinée sur 3 s · buste le plus droit possible.</Note>
    </>
  ),

  legCurl: (
    <>
      <Panel i={0} title="1 · Jambes tendues">
        <Gear>
          <line x1={22} y1={42} x2={22} y2={92} />
          <line x1={22} y1={92} x2={72} y2={92} />
        </Gear>
        <Body
          head={[36, 44]}
          sh={[36, 60]}
          hip={[70, 90]}
          el={[52, 78]}
          ha={[72, 74]}
          kn={[106, 90]}
          an={[142, 86]}
          facing={0}
        />
        <Load>
          <circle cx={140} cy={96} r={8} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu plies les genoux">
        <Gear>
          <line x1={22} y1={42} x2={22} y2={92} />
          <line x1={22} y1={92} x2={72} y2={92} />
        </Gear>
        <Body
          head={[36, 44]}
          sh={[36, 60]}
          hip={[70, 90]}
          el={[52, 78]}
          ha={[72, 74]}
          kn={[106, 90]}
          an={[112, 116]}
          facing={0}
        />
        <Load>
          <circle cx={118} cy={114} r={8} />
        </Load>
        <Arrow from={[142, 92]} to={[128, 110]} curve={10} />
      </Panel>
      <Note>Coussin juste au-dessus du talon · le retour se freine sur 3 s.</Note>
    </>
  ),

  abduction: (
    <>
      <Panel i={0} title="1 · Genoux serrés">
        <Gear>
          <line x1={62} y1={92} x2={62} y2={112} />
          <line x1={108} y1={92} x2={108} y2={112} />
          <line x1={68} y1={94} x2={102} y2={94} />
        </Gear>
        <Body
          head={[85, 32]}
          sh={[85, 50]}
          hip={[85, 84]}
          el={[71, 62]}
          ha={[71, 80]}
          el2={[99, 62]}
          ha2={[99, 80]}
          kn={[76, 100]}
          an={[74, 118]}
          kn2={[94, 100]}
          an2={[96, 118]}
          facing={0}
        />
      </Panel>
      <Panel i={1} title="2 · Tu écartes">
        <Gear>
          <line x1={46} y1={92} x2={46} y2={112} />
          <line x1={124} y1={92} x2={124} y2={112} />
          <line x1={68} y1={94} x2={102} y2={94} />
        </Gear>
        <Body
          head={[85, 32]}
          sh={[85, 50]}
          hip={[85, 84]}
          el={[71, 62]}
          ha={[71, 80]}
          el2={[99, 62]}
          ha2={[99, 80]}
          kn={[58, 98]}
          an={[48, 118]}
          kn2={[112, 98]}
          an2={[122, 118]}
          facing={0}
        />
        <Arrow from={[40, 74]} to={[18, 74]} />
        <Arrow from={[130, 74]} to={[152, 74]} />
      </Panel>
      <Note>2 s pour ouvrir, pause, 2 s pour fermer · buste vertical, dos au dossier.</Note>
    </>
  ),

  pulldown: (
    <>
      <Panel i={0} title="1 · Bras tendus en haut">
        <Gear>
          <line x1={26} y1={30} x2={140} y2={30} />
          <line x1={68} y1={100} x2={126} y2={100} />
          <line x1={98} y1={86} x2={130} y2={86} />
        </Gear>
        <Load>
          <line x1={84} y1={30} x2={84} y2={44} strokeWidth={3} />
          <polyline points="74,58 84,44 94,58" />
        </Load>
        <Body
          head={[104, 66]}
          sh={[100, 82]}
          hip={[98, 100]}
          el={[92, 68]}
          ha={[86, 56]}
          kn={[126, 100]}
          an={[128, 118]}
          facing={1}
        />
      </Panel>
      <Panel i={1} title="2 · Coudes vers les côtes">
        <Gear>
          <line x1={26} y1={30} x2={140} y2={30} />
          <line x1={68} y1={100} x2={126} y2={100} />
          <line x1={98} y1={86} x2={130} y2={86} />
        </Gear>
        <Load>
          <line x1={84} y1={30} x2={84} y2={62} strokeWidth={3} />
          <polyline points="74,76 84,62 94,76" />
        </Load>
        <Body
          head={[106, 54]}
          sh={[102, 72]}
          hip={[98, 100]}
          el={[76, 84]}
          ha={[88, 68]}
          kn={[126, 100]}
          an={[128, 118]}
          facing={1}
        />
        <Arrow from={[44, 42]} to={[44, 80]} />
      </Panel>
      <Note>Prise neutre et serrée · jamais derrière la nuque · buste presque immobile.</Note>
    </>
  ),

  inclinePress: (
    <>
      <Panel i={0} title="1 · Haltères aux épaules">
        <Ground />
        <Gear>
          <line x1={40} y1={116} x2={98} y2={52} />
          <line x1={26} y1={116} x2={46} y2={104} />
        </Gear>
        <Body
          head={[104, 48]}
          sh={[88, 62]}
          hip={[48, 102]}
          el={[100, 80]}
          ha={[112, 66]}
          kn={[28, 108]}
          an={[18, 118]}
          facing={-1}
        />
        <Load>
          <Dumbbell at={[118, 62]} angle={-45} s={0.9} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu pousses en diagonale">
        <Ground />
        <Gear>
          <line x1={40} y1={116} x2={98} y2={52} />
          <line x1={26} y1={116} x2={46} y2={104} />
        </Gear>
        <Body
          head={[104, 48]}
          sh={[88, 62]}
          hip={[48, 102]}
          el={[112, 50]}
          ha={[130, 34]}
          kn={[28, 108]}
          an={[18, 118]}
          facing={-1}
        />
        <Load>
          <Dumbbell at={[136, 30]} angle={-45} s={0.9} />
        </Load>
        <Arrow from={[120, 84]} to={[146, 56]} />
      </Panel>
      <Note>Banc à 45°, pas plus · le bas du dos reste collé au banc du début à la fin.</Note>
    </>
  ),

  lateralRaise: (
    <>
      <Panel i={0} title="1 · Bras le long du corps">
        <Ground />
        <Body
          head={[85, 32]}
          sh={[85, 50]}
          hip={[85, 86]}
          el={[70, 66]}
          ha={[68, 84]}
          el2={[100, 66]}
          ha2={[102, 84]}
          kn={[77, 102]}
          an={[75, 118]}
          kn2={[93, 102]}
          an2={[95, 118]}
          facing={0}
        />
        <Load>
          <Dumbbell at={[68, 94]} angle={90} s={0.85} />
          <Dumbbell at={[102, 94]} angle={90} s={0.85} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Hauteur d’épaules, pas plus">
        <Ground />
        <g className="text-ink-3" opacity={0.55}>
          <line
            x1={12}
            y1={50}
            x2={158}
            y2={50}
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </g>
        <Body
          head={[85, 32]}
          sh={[85, 50]}
          hip={[85, 86]}
          el={[64, 50]}
          ha={[44, 52]}
          el2={[106, 50]}
          ha2={[126, 52]}
          kn={[77, 102]}
          an={[75, 118]}
          kn2={[93, 102]}
          an2={[95, 118]}
          facing={0}
        />
        <Load>
          <Dumbbell at={[38, 54]} angle={80} s={0.85} />
          <Dumbbell at={[132, 54]} angle={100} s={0.85} />
        </Load>
        <Arrow from={[24, 82]} to={[24, 60]} />
        <Arrow from={[146, 82]} to={[146, 60]} />
      </Panel>
      <Note>Pas plus haut que les épaules · 2-3 kg suffisent · descente sur 3 s.</Note>
    </>
  ),

  pallof: (
    <>
      <Panel i={0} title="1 · Mains contre la poitrine">
        <Gear>
          <line x1={14} y1={30} x2={14} y2={118} />
        </Gear>
        {/* Vue de dessus — le seul angle où « ne pas tourner » se voit. Le
            buste est la forme pleine, les coudes sont ouverts vers l'extérieur,
            et le bas de l'image, c'est devant elle. */}
        <ellipse cx={76} cy={72} rx={21} ry={14} fill="currentColor" opacity={0.13} />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={76} cy={36} r={10} />
          <line x1={76} y1={46} x2={76} y2={58} strokeWidth={4} />
          <line x1={52} y1={58} x2={100} y2={58} />
          <polyline points="52,58 42,78 66,94" />
          <polyline points="100,58 110,78 86,94" />
        </g>
        <Load>
          <line x1={64} y1={94} x2={88} y2={94} strokeWidth={5} />
          <line x1={14} y1={94} x2={64} y2={94} strokeWidth={3} />
        </Load>
      </Panel>
      <Panel i={1} title="2 · Tu pousses, épaules de face">
        <Gear>
          <line x1={14} y1={30} x2={14} y2={118} />
        </Gear>
        {/* L'erreur : le buste qui pivote vers la poulie */}
        <Wrong>
          <g fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round">
            <line x1={58} y1={44} x2={98} y2={72} />
          </g>
        </Wrong>
        <ellipse cx={76} cy={72} rx={21} ry={14} fill="currentColor" opacity={0.13} />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={76} cy={36} r={10} />
          <line x1={76} y1={46} x2={76} y2={58} strokeWidth={4} />
          <line x1={52} y1={58} x2={100} y2={58} />
          <polyline points="52,58 46,86 66,114" />
          <polyline points="100,58 106,86 86,114" />
        </g>
        <Load>
          <line x1={64} y1={114} x2={88} y2={114} strokeWidth={5} />
          <line x1={14} y1={114} x2={64} y2={114} strokeWidth={3} />
        </Load>
        <Cross at={[132, 48]} />
        <Arrow from={[128, 80]} to={[128, 110]} />
      </Panel>
      <Note>Vue de dessus · la poulie tire de côté : les épaules restent bien de face.</Note>
    </>
  ),

  sidePlank: (
    <>
      <Panel i={0} title="1 · Ligne tête-genoux">
        <Ground />
        <g className="text-ink-3" opacity={0.5}>
          <line
            x1={24}
            y1={66}
            x2={128}
            y2={106}
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </g>
        <Body
          head={[26, 66]}
          sh={[46, 76]}
          hip={[92, 92]}
          el={[46, 112]}
          ha={[72, 114]}
          kn={[126, 106]}
          an={[144, 94]}
          facing={0}
        />
      </Panel>
      <Panel i={1} title="2 · Hanches qui s’affaissent" wrong>
        <Ground />
        <Wrong>
          <Body
            head={[26, 76]}
            sh={[46, 88]}
            hip={[92, 112]}
            el={[46, 114]}
            ha={[72, 116]}
            kn={[126, 110]}
            an={[144, 98]}
            facing={0}
          />
        </Wrong>
        <Cross at={[96, 58]} />
      </Panel>
      <Note>Coude sous l’épaule · dès que la position se dégrade, tu arrêtes le chrono.</Note>
    </>
  ),
};

export type FigureKey = keyof typeof FIGURES;

/** Un schéma, dans un cadre qui s'adapte à la largeur disponible. */
export function Figure({ name, className = '' }: { name: string; className?: string }) {
  const drawing = FIGURES[name];
  if (!drawing) return null;
  return (
    <svg
      viewBox="0 0 340 156"
      className={`w-full text-ink ${className}`}
      role="img"
      aria-label="Schéma du mouvement : position de départ puis position d’arrivée"
    >
      {/* Séparateur entre les deux vignettes */}
      <line
        x1={CELL}
        y1={24}
        x2={CELL}
        y2={132}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-ink-3"
        opacity={0.22}
      />
      {drawing}
    </svg>
  );
}

export const hasFigure = (name?: string): boolean => name != null && name in FIGURES;
