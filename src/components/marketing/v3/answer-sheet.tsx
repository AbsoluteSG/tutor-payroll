import type { CSSProperties } from "react";

/**
 * The Specialized Testing hero: an OMR answer sheet filling itself in.
 *
 * The counterpart to the Mathematics dot plate and the ELA sentence — where
 * those show knowledge handed over and a sentence opened up, this shows the
 * object of the discipline itself. The bubble sheet is the one image every
 * student and parent already recognises, and rendering it in the same
 * halftone-on-paper register makes the argument the page is making: the test is
 * a printed, finite, knowable thing.
 *
 * Marks fill in on load, staggered row by row, so the sheet completes itself
 * without the visitor doing anything. As with the ELA marks, the keyframes
 * define only `from`, so the settled state is the natural style — a fully
 * completed sheet under reduced motion or without JS.
 */

const INK = "var(--v3-ink)";

const LETTERS = ["A", "B", "C", "D"] as const;

/**
 * The key. Fixed rather than generated: a random key would differ between the
 * server and client renders and blow up hydration, and it would also mean the
 * sheet looked different on every visit for no gain.
 */
const KEY = [
  2, 0, 3, 1, 1, 3, 0, 2, 3, 1, 2, 0, 0, 2, 1, 3, 1, 0, 3, 2, 2, 3, 0, 1,
];

function Row({ index, answer }: { index: number; answer: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-4 shrink-0 text-right font-mono text-[0.5rem] tabular-nums opacity-35">
        {index + 1}
      </span>
      {LETTERS.map((letter, column) => (
        <span
          key={letter}
          className="relative grid size-[1.05rem] shrink-0 place-items-center rounded-full border border-current/25 sm:size-[1.15rem]"
        >
          <span className="font-mono text-[0.4rem] opacity-35 sm:text-[0.44rem]">
            {letter}
          </span>
          {column === answer ? (
            // Sits over the letter rather than replacing it — a filled bubble is
            // a pencil covering the letter, not a different glyph.
            <span
              aria-hidden
              className="omr-fill absolute inset-[1.5px] rounded-full"
              style={{ backgroundColor: INK, "--i": index } as CSSProperties}
            />
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function AnswerSheet() {
  return (
    <div
      // The sheet is decorative: it says nothing a screen reader needs, and read
      // aloud it is 24 rows of "1 A B C D".
      aria-hidden
      className="mx-auto w-full max-w-3xl px-4 sm:px-8"
    >
      <div className="flex items-baseline justify-between border-b border-current/15 pb-2 font-mono text-[0.5rem] tracking-[0.2em] uppercase opacity-40">
        <span>Section I — Mark one answer per line</span>
        <span className="hidden sm:inline">Form 02</span>
      </div>

      {/* Three columns on anything but a phone, like the real thing; a single
          column of 24 rows would be taller than the hero has room for. */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-2">
        {KEY.map((answer, i) => (
          <Row key={i} index={i} answer={answer} />
        ))}
      </div>
    </div>
  );
}
