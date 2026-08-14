/**
 * A drawing per track, for the plates on a subject page's booking step.
 *
 * These are the finer grain of course-marks.tsx: those tell the four *subjects*
 * apart in the gallery, these tell one subject's four *tracks* apart once a
 * visitor is inside it. Same rules — everything is currentColor on a shared
 * 120×56 viewBox, so a mark inverts with its plate and again with the theme
 * without knowing about either, and the four sit at the same visual weight.
 *
 * Each one draws the thing itself rather than a symbol for its subject: a
 * balance for the first equation, a bracketed clause for close reading, a
 * stopwatch and a podium for contest programming. A plate has to say which of
 * the four it is at a glance; the name underneath makes the longer argument.
 */

/** Frames, rules and grids — the hairlines a printed form is ruled with. */
const HAIR = {
  stroke: "currentColor",
  strokeWidth: 1,
  opacity: 0.32,
  fill: "none",
} as const;

/** The subject itself: what the eye should land on. */
const MARK = {
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  opacity: 0.85,
  fill: "none",
} as const;

export type TrackMarkKind =
  // Specialized Testing
  | "shsat"
  | "digital-sat"
  | "psat"
  | "diagnostic"
  // English Language Arts
  | "close-reading"
  | "essay"
  | "timed-writing"
  | "seminar"
  // Mathematics
  | "prealgebra"
  | "geometry"
  | "precalculus"
  | "calculus"
  // Computer Science
  | "cpp-intro"
  | "systems"
  | "ai-paired"
  | "usaco";

/* ── Specialized Testing ─────────────────────────────────────────────────── */

/** SHSAT — the two-section answer sheet, ELA one side and maths the other. */
function Shsat() {
  const rows = [14, 28, 42];
  const left = [24, 38];
  const right = [78, 92];
  /** Which bubble is pencilled in, as [row, column] within each half. */
  const filled = { left: [0, 1], right: [2, 0] };

  return (
    <>
      <line x1="60" y1="6" x2="60" y2="50" {...HAIR} />
      {rows.map((y, row) => (
        <g key={y}>
          {left.map((x, col) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill={
                filled.left[0] === row && filled.left[1] === col
                  ? "currentColor"
                  : "none"
              }
              opacity={
                filled.left[0] === row && filled.left[1] === col ? 0.85 : 0.34
              }
            />
          ))}
          {right.map((x, col) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill={
                filled.right[0] === row && filled.right[1] === col
                  ? "currentColor"
                  : "none"
              }
              opacity={
                filled.right[0] === row && filled.right[1] === col ? 0.85 : 0.34
              }
            />
          ))}
        </g>
      ))}
    </>
  );
}

/** Digital SAT — the test on a screen, which is the whole of what changed. */
function DigitalSat() {
  return (
    <>
      <rect x="30" y="8" width="60" height="34" rx="3" {...HAIR} strokeWidth="1.4" />
      <line x1="24" y1="48" x2="96" y2="48" {...MARK} strokeWidth="2" />
      <line x1="34" y1="42" x2="86" y2="42" {...HAIR} />
      {/* A question, and its four options with one chosen. */}
      <line
        x1="38"
        y1="18"
        x2="74"
        y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.42"
      />
      {[41, 55, 69].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={31}
          r="4.2"
          stroke="currentColor"
          strokeWidth="1.2"
          fill={i === 0 ? "currentColor" : "none"}
          opacity={i === 0 ? 0.85 : 0.34}
        />
      ))}
    </>
  );
}

/** PSAT / NMSQT — the qualifying sheet, and the merit it qualifies for. */
function Psat() {
  /** Five-pointed star as a polygon, outer radius r about (cx, cy). */
  const star = (cx: number, cy: number, r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const radius = i % 2 === 0 ? r : r * 0.44;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(
        cy +
        radius * Math.sin(angle)
      ).toFixed(1)}`;
    }).join(" ");

  return (
    <>
      <rect x="20" y="8" width="46" height="40" rx="2" {...HAIR} strokeWidth="1.4" />
      {[18, 26, 34, 42].map((y) => (
        <line
          key={y}
          x1="27"
          y1={y}
          x2={y === 42 ? 52 : 59}
          y2={y}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.3"
        />
      ))}
      <polygon points={star(90, 27, 15)} fill="currentColor" opacity="0.8" />
    </>
  );
}

/** Diagnostic — a gauge, because the sitting exists to take a reading. */
function Diagnostic() {
  const ticks = [-72, -36, 0, 36, 72];
  return (
    <>
      <path d="M28,44 A32,32 0 0 1 92,44" {...HAIR} strokeWidth="1.6" />
      {ticks.map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={(60 + 25 * Math.cos(a)).toFixed(1)}
            y1={(44 + 25 * Math.sin(a)).toFixed(1)}
            x2={(60 + 32 * Math.cos(a)).toFixed(1)}
            y2={(44 + 32 * Math.sin(a)).toFixed(1)}
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.35"
          />
        );
      })}
      <line x1="60" y1="44" x2="45" y2="25" {...MARK} strokeWidth="2.4" />
      <circle cx="60" cy="44" r="3.4" fill="currentColor" opacity="0.85" />
    </>
  );
}

/* ── English Language Arts ───────────────────────────────────────────────── */

/** Close reading — a clause bracketed out, as on this page's own hero. */
function CloseReading() {
  return (
    <>
      {[12, 20].map((y) => (
        <line
          key={y}
          x1="18"
          y1={y}
          x2="102"
          y2={y}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.28"
        />
      ))}
      <line
        x1="18"
        y1="28"
        x2="74"
        y2="28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.28"
      />
      {/* The bracket, and the tick that hangs its label. */}
      <path d="M30,36 L30,41 L72,41 L72,36" {...MARK} strokeWidth="1.9" />
      <line x1="51" y1="41" x2="51" y2="49" {...MARK} strokeWidth="1.9" />
    </>
  );
}

/** Essay & argument — a page with a thesis at the top of it. */
function Essay() {
  return (
    <>
      <rect x="32" y="5" width="56" height="46" rx="2" {...HAIR} strokeWidth="1.4" />
      <line x1="39" y1="15" x2="67" y2="15" {...MARK} strokeWidth="2.6" />
      {[25, 31, 37, 43].map((y) => (
        <line
          key={y}
          x1="39"
          y1={y}
          x2={y === 43 ? 68 : 81}
          y2={y}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.3"
        />
      ))}
    </>
  );
}

/** Timed writing — the clock is the whole difficulty of it. */
function TimedWriting() {
  return (
    <>
      <rect x="62" y="10" width="34" height="38" rx="2" {...HAIR} />
      {[20, 27, 34, 41].map((y) => (
        <line
          key={y}
          x1="68"
          y1={y}
          x2={y === 41 ? 82 : 90}
          y2={y}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.28"
        />
      ))}
      <circle cx="34" cy="30" r="17" {...HAIR} strokeWidth="1.6" />
      <line x1="30" y1="7" x2="38" y2="7" {...MARK} strokeWidth="2.4" />
      <line x1="34" y1="7" x2="34" y2="13" {...MARK} strokeWidth="2.4" />
      <line x1="34" y1="30" x2="34" y2="20" {...MARK} strokeWidth="2" />
      <line x1="34" y1="30" x2="43" y2="34" {...MARK} strokeWidth="2" />
    </>
  );
}

/** Literature seminar — the table, which is the form the class takes. */
function Seminar() {
  const seats = [0, 60, 120, 180, 240, 300];
  return (
    <>
      <ellipse cx="60" cy="29" rx="23" ry="11" {...HAIR} strokeWidth="1.6" />
      {seats.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={(60 + 36 * Math.cos(a)).toFixed(1)}
            cy={(29 + 19 * Math.sin(a)).toFixed(1)}
            r="5"
            fill="currentColor"
            opacity="0.62"
          />
        );
      })}
    </>
  );
}

/* ── Mathematics ─────────────────────────────────────────────────────────── */

/** Pre-algebra & Algebra I — the balance, which is what an equation is. */
function Prealgebra() {
  return (
    <>
      <line x1="26" y1="20" x2="94" y2="20" {...MARK} strokeWidth="2.2" />
      <line x1="60" y1="20" x2="60" y2="42" {...MARK} strokeWidth="2" />
      <line x1="48" y1="46" x2="72" y2="46" {...MARK} strokeWidth="2.4" />
      <path d="M52,42 L68,42" {...HAIR} strokeWidth="1.4" />
      {/* The two pans. */}
      <path d="M14,22 L38,22 L26,34 Z" {...HAIR} strokeWidth="1.5" />
      <path d="M82,22 L106,22 L94,34 Z" {...HAIR} strokeWidth="1.5" />
      <text
        className="font-mono"
        x="26"
        y="14"
        fontSize="11"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.8"
      >
        x
      </text>
      <text
        className="font-mono"
        x="94"
        y="14"
        fontSize="11"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.8"
      >
        7
      </text>
    </>
  );
}

/** Geometry — a right triangle, squared and struck with a compass arc. */
function Geometry() {
  return (
    <>
      <path d="M26,48 L96,48 L26,10 Z" {...MARK} strokeWidth="2.2" />
      <path d="M26,40 L34,40 L34,48" {...HAIR} strokeWidth="1.5" />
      <path
        d="M40,8 A38,38 0 0 1 100,40"
        {...HAIR}
        strokeWidth="1.3"
        strokeDasharray="3 3.5"
      />
    </>
  );
}

/** Precalculus — behaviour that repeats: the wave, on its axes. */
function Precalculus() {
  return (
    <>
      <line x1="14" y1="29" x2="106" y2="29" {...HAIR} />
      <line x1="22" y1="6" x2="22" y2="50" {...HAIR} />
      <path
        d="M22,29 C31,6 40,6 49,29 C58,52 67,52 76,29 C81,17 87,12 94,11"
        {...MARK}
        strokeWidth="2.3"
      />
    </>
  );
}

/** Calculus — the area under the curve, sliced. */
function Calculus() {
  const slices = [
    { x: 40, y: 33 },
    { x: 48, y: 26 },
    { x: 56, y: 20 },
    { x: 64, y: 15 },
  ];
  return (
    <>
      <line x1="14" y1="46" x2="106" y2="46" {...HAIR} />
      <line x1="22" y1="5" x2="22" y2="50" {...HAIR} />
      <path
        d="M36,46 L36,36 C46,27 56,19 68,13 L68,46 Z"
        fill="currentColor"
        opacity="0.13"
      />
      {slices.map((s) => (
        <line key={s.x} x1={s.x} y1="46" x2={s.x} y2={s.y} {...HAIR} />
      ))}
      <path
        d="M26,48 C38,34 52,21 70,12 C82,6 92,5 100,6"
        {...MARK}
        strokeWidth="2.3"
      />
    </>
  );
}

/* ── Computer Science ────────────────────────────────────────────────────── */

/** Intro — the language, in the braces it is written between. */
function CppIntro() {
  return (
    <>
      <path
        d="M42,9 C33,9 36,25 27,28 C36,31 33,47 42,47"
        {...MARK}
        strokeWidth="2.4"
      />
      <path
        d="M78,9 C87,9 84,25 93,28 C84,31 87,47 78,47"
        {...MARK}
        strokeWidth="2.4"
      />
      <text
        className="font-mono"
        x="60"
        y="28"
        fontSize="15"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        opacity="0.82"
      >
        C++
      </text>
    </>
  );
}

/** Systems & memory — addressable cells, and something pointing into one. */
function Systems() {
  const cells = [18, 36, 54, 72, 90];
  return (
    <>
      <line x1="18" y1="12" x2="106" y2="12" {...HAIR} strokeDasharray="2 3" />
      {cells.map((x, i) => (
        <rect
          key={x}
          x={x}
          y="20"
          width="16"
          height="16"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.3"
          fill={i === 2 ? "currentColor" : "none"}
          opacity={i === 2 ? 0.7 : 0.34}
        />
      ))}
      <path d="M62,50 L62,42" {...MARK} strokeWidth="2" />
      <path d="M58,45 L62,40 L66,45" {...MARK} strokeWidth="2" />
    </>
  );
}

/** AI-paired — the network, which is the thing being directed. */
function AiPaired() {
  const input = [13, 28, 43];
  const hidden = [20, 36];
  const output = 28;
  const [cx1, cx2, cx3] = [26, 60, 94];

  return (
    <>
      <g stroke="currentColor" strokeWidth="1" opacity="0.26">
        {input.map((y1) =>
          hidden.map((y2) => (
            <line key={`${y1}-${y2}`} x1={cx1} y1={y1} x2={cx2} y2={y2} />
          ))
        )}
        {hidden.map((y2) => (
          <line key={y2} x1={cx2} y1={y2} x2={cx3} y2={output} />
        ))}
      </g>
      {input.map((y) => (
        <circle key={y} cx={cx1} cy={y} r="4.5" fill="currentColor" opacity="0.65" />
      ))}
      {hidden.map((y) => (
        <circle key={y} cx={cx2} cy={y} r="4.5" fill="currentColor" opacity="0.65" />
      ))}
      <circle cx={cx3} cy={output} r="6" fill="currentColor" opacity="0.85" />
    </>
  );
}

/** Contest & USACO — timed, and ranked. */
function Usaco() {
  return (
    <>
      <circle cx="32" cy="31" r="16" {...HAIR} strokeWidth="1.6" />
      <line x1="28" y1="9" x2="36" y2="9" {...MARK} strokeWidth="2.4" />
      <line x1="32" y1="9" x2="32" y2="15" {...MARK} strokeWidth="2.4" />
      <line x1="32" y1="31" x2="32" y2="22" {...MARK} strokeWidth="2" />
      <line x1="32" y1="31" x2="40" y2="35" {...MARK} strokeWidth="2" />
      <rect x="64" y="32" width="14" height="15" fill="currentColor" opacity="0.34" />
      <rect x="79" y="22" width="14" height="25" fill="currentColor" opacity="0.72" />
      <rect x="94" y="37" width="14" height="10" fill="currentColor" opacity="0.34" />
    </>
  );
}

const MARKS: Record<TrackMarkKind, () => React.JSX.Element> = {
  shsat: Shsat,
  "digital-sat": DigitalSat,
  psat: Psat,
  diagnostic: Diagnostic,
  "close-reading": CloseReading,
  essay: Essay,
  "timed-writing": TimedWriting,
  seminar: Seminar,
  prealgebra: Prealgebra,
  geometry: Geometry,
  precalculus: Precalculus,
  calculus: Calculus,
  "cpp-intro": CppIntro,
  systems: Systems,
  "ai-paired": AiPaired,
  usaco: Usaco,
};

export function TrackMark({
  kind,
  className = "",
  color,
}: {
  kind: TrackMarkKind;
  className?: string;
  /**
   * Recolours the whole drawing. Every mark is built from currentColor, so
   * setting `color` here is enough — none of them needs to know it happened,
   * and leaving it undefined keeps them inheriting the plate's ink.
   */
  color?: string;
}) {
  const Mark = MARKS[kind];
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 56"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={color ? { color } : undefined}
    >
      <Mark />
    </svg>
  );
}
