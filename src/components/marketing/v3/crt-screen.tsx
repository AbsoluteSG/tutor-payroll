import type { CSSProperties } from "react";

/**
 * The Computer Science hero: a CRT terminal running a program that does exactly
 * what it was told.
 *
 * The other heroes show the object of their discipline — a plate, a sentence
 * taken apart, an answer sheet. The object here is the screen, and it is the
 * only one of the four that can *perform* rather than sit still: the listing
 * types itself in, the program compiles, runs, and prints a wrong answer.
 *
 * The bug is the point, and it is the page's whole argument in five lines. The
 * loop stops one element short (`i < n - 1`) while the division still uses `n`,
 * so the mean is not the mean — and nothing catches it. It compiles cleanly, it
 * runs without complaint, and the number it prints looks perfectly reasonable.
 * This is exactly the failure a student cannot catch by reading fast, whether a
 * person or a model wrote it, which is why the curriculum spends years below
 * this level before putting a model in front of anyone.
 *
 * The screen takes the OTHER skin via .v3-invert rather than hardcoding a dark
 * monitor. That is the same mechanism the Axiom panel uses, and it is what keeps
 * the hero legible in both themes — the scanlines, phosphor bloom and curvature
 * are what read as "CRT", not the specific colour. See globals.css.
 */

/**
 * The session. `dim` is chrome, `accent` is the machine answering back, and
 * `cursor` marks the line that gets the blinking block.
 *
 * Fixed rather than generated: a random listing would differ between the server
 * and client renders and break hydration.
 */
const LINES: {
  text: string;
  dim?: boolean;
  accent?: boolean;
  cursor?: boolean;
}[] = [
  // Kept to the width of the longest code line (21 characters) — as the banner
  // it has no business being the line that sets the type size for the whole
  // terminal, which is what a longer one did.
  { text: "BOROUGH PREP · READY.", dim: true },
  { text: "> cat mean.cpp" },
  { text: "int t = 0;" },
  { text: "for (i=0;i<n-1;i++)" },
  { text: "  t += s[i];" },
  { text: "return t / n;" },
  { text: "> g++ mean.cpp" },
  { text: "> ./mean" },
  { text: "82.5", accent: true },
  { text: ">", cursor: true },
];

export function CrtScreen() {
  return (
    <div
      // Decorative. The listing is a picture of a program, not content — the
      // page makes its argument in prose, and read aloud this is a stream of
      // line numbers.
      aria-hidden
      // A size container, so the terminal can scale to whatever height the hero
      // has left rather than assuming it. With the headline at the current type
      // scale that slot is only ~220px on a 800px laptop and over twice that on
      // a tall monitor — a fixed size would either overflow the short one or
      // waste the tall one. cqh below does the arithmetic.
      className="mx-auto flex h-full w-full max-w-3xl items-center justify-center px-4 sm:px-8"
      style={{ containerType: "size" }}
    >
      {/* Bezel. The chunky rounded shell is most of what dates the object. */}
      <div
        className="crt-bezel relative w-full rounded-[1.4rem] p-[2.2cqh] sm:rounded-[1.8rem]"
        style={{ backgroundColor: "var(--v3-card)" }}
      >
        {/* Screen. v3-invert reassigns the palette for this subtree, so
            everything inside resolves against the screen rather than the page. */}
        <div
          className="v3-invert crt-screen relative overflow-hidden rounded-[0.9rem] px-[3cqh] py-[2.6cqh] sm:rounded-[1.1rem]"
          style={{
            backgroundColor: "var(--v3-paper)",
            color: "var(--v3-ink)",
          }}
        >
          {/* Bounded on both axes, because either one can be the binding
              constraint. Height: ten lines at 1.55 leading is 15.5em, so the
              font cannot exceed about 1/16th of the container. Width: the
              longest line is 21 monospace characters, or roughly 12.6em, which
              on a phone runs out before the height does — without the cqw term
              the type grew to fill a tall narrow slot and clipped its own right
              edge. The clamp keeps it readable when short and stops it becoming
              a billboard when tall. */}
          <pre
            className="relative z-10 font-mono leading-[1.55]"
            style={{ fontSize: "clamp(0.62rem, min(5.1cqh, 6.2cqw), 1.35rem)" }}
          >
            {LINES.map((line, i) => (
              <div
                key={i}
                className="crt-line whitespace-pre"
                style={
                  {
                    "--i": i,
                    opacity: line.dim ? 0.5 : 1,
                    color: line.accent ? "var(--v3-accent)" : undefined,
                  } as CSSProperties
                }
              >
                {/* A zero-width space keeps blank lines at full line height
                    rather than collapsing them. */}
                {line.text || "​"}
                {line.cursor ? (
                  <span
                    className="v3-caret-blink ml-2 inline-block h-[0.95em] w-[0.55em] translate-y-[0.12em]"
                    style={{ backgroundColor: "var(--v3-ink)" }}
                  />
                ) : null}
              </div>
            ))}
          </pre>

          {/* Scanlines. */}
          <div className="crt-scanlines pointer-events-none absolute inset-0 z-20" />

          {/* Corner darkening — the cheapest cue that the glass is curved. */}
          <div className="crt-vignette pointer-events-none absolute inset-0 z-20" />
        </div>

        {/* Bezel furniture: a power lamp and a vent, so the shell reads as a
            physical object rather than a rounded rectangle. */}
        <div className="mt-[1.6cqh] flex items-center justify-between px-2">
          <span
            className="font-mono tracking-[0.2em] uppercase opacity-40"
            style={{ fontSize: "clamp(0.5rem, 2.4cqh, 0.8rem)" }}
          >
            Borough Prep
          </span>
          <span className="flex items-center gap-2">
            <span className="hidden gap-[3px] sm:flex">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="block h-[3px] w-4 rounded-full bg-current opacity-15"
                />
              ))}
            </span>
            <span
              className="crt-lamp block size-2 rounded-full sm:size-2.5"
              style={{ backgroundColor: "var(--v3-accent)" }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
