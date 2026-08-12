/**
 * A drawing per course plate, in place of the halftone band the plates used to
 * share.
 *
 * Each one is a miniature of what the course's own page opens with — bubbles
 * for the answer sheet, a parsed sentence for the constituent analysis, a
 * terminal for the CRT — so the plate previews its page rather than decorating
 * itself. Mathematics is the exception: its page opens on the Creation of Adam
 * rendered in dots, which is unreadable at 90px, so its plate takes the
 * operators instead. A plate has to say "this is the maths one" from across the
 * gallery; the page can make the longer argument.
 *
 * Everything is drawn in currentColor. The plate sets `color` to paper when it
 * is selected and ink when it is not, so these invert with the plate and again
 * with the theme, without knowing about either. Nothing here uses the accent —
 * on a selected plate the accent is still the *page's* accent, chosen to read
 * against the page rather than against the ink ground the plate has become.
 *
 * viewBox is a shared 120×56 so the four marks sit at the same visual weight,
 * and `meet` letterboxes them into whatever the band is at that breakpoint.
 */

/** Frames, rules and grids — the hairlines a printed form is ruled with. */
const HAIR = { stroke: "currentColor", strokeWidth: 1, opacity: 0.32 };
/** The subject itself: what the eye should land on. */
const MARK = {
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  opacity: 0.85,
};

export type CourseMarkKind = "omr" | "book" | "operators" | "terminal";

/**
 * Specialized Testing — a fragment of an answer sheet, part-filled.
 *
 * Two rows of four rather than three rows of five: the lettering is the point,
 * and it needs bubbles big enough to hold a legible glyph. An earlier version
 * put question numbers in the left margin at this scale and they came out as
 * specks that read as dirt on the plate — inside a bubble, at nearly twice the
 * size, a letter survives.
 *
 * A filled bubble drops its letter, the way a pencilled-in one does.
 */
function Omr() {
  const options = ["A", "B", "C", "D"];
  const columns = [32, 57, 82, 107];
  const rows = [17, 39];
  /** The answer chosen on each row, by index into `options`. */
  const answer = [2, 0];

  return (
    <>
      {/* The form's margin rule. */}
      <line x1="13" y1="8" x2="13" y2="48" {...HAIR} />
      {rows.map((y, row) => (
        <g key={y}>
          {columns.map((x, i) => {
            const isFilled = answer[row] === i;
            return (
              <g key={x}>
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill={isFilled ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.2"
                  opacity={isFilled ? 0.85 : 0.34}
                />
                {isFilled ? null : (
                  <text
                    className="font-mono"
                    x={x}
                    y={y}
                    fontSize="9"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="currentColor"
                    opacity="0.5"
                  >
                    {options[i]}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}

/**
 * English Language Arts — an open book.
 *
 * This was a parsed sentence, bracketed into its constituents, echoing the
 * page's own hero. It was the cleverest of the four marks and the least
 * legible: at plate size a reader saw some rules and ticks, not a subject. The
 * other three marks are read instantly — bubbles, operators, a terminal — so
 * this one is too, and the sentence diagram stays where it works, full size on
 * the page itself.
 */
function Book() {
  // Symmetric about the spine at x=60. The top and bottom edges bow upward, the
  // way a bound page does when it is held open.
  const leftPage = "M60,14 C46,7.5 27,7.5 14,13.5 L14,38.5 C27,33 46,35.5 60,42 Z";
  const rightPage =
    "M60,14 C74,7.5 93,7.5 106,13.5 L106,38.5 C93,33 74,35.5 60,42 Z";

  // Under the open pages sits the rest of the book: the text block, then the
  // board. Both are closed bands rather than a few stacked lines — three
  // hairlines read as a page curling, not as a book with a hundred leaves in
  // it. Density increases downward (pages 0.05, block 0.10, board 0.2), which
  // is what makes the mass sit *under* rather than beside.
  //
  // Nothing here can be painted opaquely: the plate's ground is ink or card
  // depending on selection and the mark cannot know which, so this is all
  // translucent washes. It works because every band lies outside the page
  // outline, where nothing needs to be hidden behind anything.
  const leftEdge = "M14,38.5 C27,33 46,35.5 60,42";
  const rightEdge = "M106,38.5 C93,33 74,35.5 60,42";

  /** Page edge, down the fore-edge, back along the bottom of the block. */
  const leftBlock =
    "M14,38.5 C27,33 46,35.5 60,42 L60,49 C46,42.5 27,40 14,45.5 Z";
  const rightBlock =
    "M106,38.5 C93,33 74,35.5 60,42 L60,49 C74,42.5 93,40 106,45.5 Z";

  /** The board, a shade proud of the block on every side. */
  const leftBoard =
    "M11.5,44.5 C26,39 45,41.5 60,48 L60,52 C45,45.5 26,43 11.5,48.5 Z";
  const rightBoard =
    "M108.5,44.5 C94,39 75,41.5 60,48 L60,52 C75,45.5 94,43 108.5,48.5 Z";

  /** Individual leaves, striating the block. */
  const leaves = [1.9, 3.5, 5.1];

  return (
    <>
      <defs>
        {/* The gutter: darkest against the fold, gone by mid-page. */}
        <linearGradient id="v3-book-gutter-l" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="v3-book-gutter-r" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The board, furthest back and densest. */}
      <g fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35">
        <path d={leftBoard} />
        <path d={rightBoard} />
      </g>

      {/* The text block, with its leaves striated across it. */}
      <g fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3">
        <path d={leftBlock} />
        <path d={rightBlock} />
      </g>
      <g stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.22">
        {leaves.map((dy) => (
          <g key={dy} transform={`translate(0 ${dy})`}>
            <path d={leftEdge} />
            <path d={rightEdge} />
          </g>
        ))}
      </g>

      {/* The two open pages. A wash of the ink gives them a surface to sit on
          without ever becoming opaque. */}
      <path d={leftPage} fill="currentColor" fillOpacity="0.05" {...HAIR} strokeWidth="1.4" />
      <path d={rightPage} fill="currentColor" fillOpacity="0.05" {...HAIR} strokeWidth="1.4" />

      <rect x="47" y="15" width="13" height="26" fill="url(#v3-book-gutter-l)" />
      <rect x="60" y="15" width="13" height="26" fill="url(#v3-book-gutter-r)" />

      {/* The fold itself. */}
      <line x1="60" y1="14" x2="60" y2="42" {...MARK} strokeWidth="1.5" />

      {/* Lines of type, kept clear of the curved edges. */}
      <g stroke="currentColor" strokeWidth="1.8" opacity="0.36" strokeLinecap="round">
        {[
          { y: 19.5, left: 24, right: 96 },
          { y: 25, left: 22, right: 98 },
          { y: 30.5, left: 26, right: 94 },
        ].map(({ y, left, right }) => (
          <g key={y}>
            <line x1={left} y1={y} x2="53" y2={y} />
            <line x1="67" y1={y} x2={right} y2={y} />
          </g>
        ))}
      </g>
    </>
  );
}

/** Mathematics — the four operators, on graph paper. */
function Operators() {
  const a = 7; // half-arm of the plus and minus
  const d = 5; // half-diagonal of the multiply
  const xs = [21, 48, 75, 102];
  const y = 28;

  return (
    <>
      {/* Graph paper, ruled faintly enough to sit behind the glyphs. */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.14">
        {[8, 20, 32, 44].map((gy) => (
          <line key={gy} x1="4" y1={gy} x2="116" y2={gy} />
        ))}
        {Array.from({ length: 10 }, (_, i) => 4 + i * 12).map((gx) => (
          <line key={gx} x1={gx} y1="4" x2={gx} y2="52" />
        ))}
      </g>

      <g {...MARK}>
        {/* plus */}
        <line x1={xs[0] - a} y1={y} x2={xs[0] + a} y2={y} />
        <line x1={xs[0]} y1={y - a} x2={xs[0]} y2={y + a} />
        {/* minus */}
        <line x1={xs[1] - a} y1={y} x2={xs[1] + a} y2={y} />
        {/* multiply */}
        <line x1={xs[2] - d} y1={y - d} x2={xs[2] + d} y2={y + d} />
        <line x1={xs[2] - d} y1={y + d} x2={xs[2] + d} y2={y - d} />
        {/* divide */}
        <line x1={xs[3] - a} y1={y} x2={xs[3] + a} y2={y} />
      </g>
      <circle cx={xs[3]} cy={y - 6.5} r="1.9" fill="currentColor" opacity="0.85" />
      <circle cx={xs[3]} cy={y + 6.5} r="1.9" fill="currentColor" opacity="0.85" />
    </>
  );
}

/**
 * Computer Science — a terminal with C++ in it.
 *
 * The lines were blank rules standing in for text, which made the window read
 * as a window and nothing more. Actual source says which language the course
 * teaches before a word of the caption is read. Kept short enough that it is
 * still legible when the plate is 7rem wide.
 */
function Terminal() {
  const lines = [
    { x: 17, y: 27, text: "int main() {", opacity: 0.75 },
    { x: 23, y: 37, text: "return 0;", opacity: 0.55 },
    { x: 17, y: 47, text: "}", opacity: 0.75 },
  ];

  return (
    <>
      <rect x="8" y="6" width="104" height="44" rx="3" {...HAIR} fill="none" />
      {/* Title rule, as on the CRT the page opens with. */}
      <line x1="8" y1="16" x2="112" y2="16" {...HAIR} />

      {lines.map((l) => (
        <text
          key={l.text}
          className="font-mono"
          x={l.x}
          y={l.y}
          fontSize="8"
          fill="currentColor"
          opacity={l.opacity}
        >
          {l.text}
        </text>
      ))}

      {/* The caret, waiting at the end of the return. */}
      <rect
        x="70"
        y="30.5"
        width="4.5"
        height="8"
        fill="currentColor"
        opacity="0.85"
      />
    </>
  );
}

const MARKS: Record<CourseMarkKind, () => React.JSX.Element> = {
  omr: Omr,
  book: Book,
  operators: Operators,
  terminal: Terminal,
};

export function CourseMark({
  kind,
  className = "",
  color,
}: {
  kind: CourseMarkKind;
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
