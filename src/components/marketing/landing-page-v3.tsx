import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { HeroPlate } from "./v3/hero-plate";
import { MorphWord } from "./v3/morph-word";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * "Editorial Learning Lab" — a standalone marketing page with its own type and
 * color system, deliberately independent of the app's dark admin theme tokens.
 * Every color is explicit so nothing here shifts when the app theme changes.
 *
 * This page is intentionally a single non-scrolling screen: it locks to the
 * viewport height and clips overflow, so the hero is the whole experience.
 * Everything else lives on its own route (see /v3/courses).
 *
 * Placeholder copy: swap in real details before this goes live.
 */

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";

export function LandingPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex h-[100svh] flex-col overflow-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Film grain across the whole page — printed, not rendered. */}
      <svg
        aria-hidden
        className="v3-grain pointer-events-none absolute inset-0 z-50 h-full w-full"
      >
        <filter id="v3-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#v3-grain)" />
      </svg>

      {/* ───────────────────────── Nav ───────────────────────── */}
      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-current/12 px-5 py-4 sm:px-8">
        {/* Instrument Serif is already narrow, so this wordmark gets a little
            positive tracking and room to breathe rather than tracking-tight. */}
        <span className="font-[family-name:var(--font-editorial)] text-[1.5rem] leading-[1.15] tracking-[0.035em]">
          Borough Prep
        </span>
        <nav className="hidden gap-8 font-mono text-[0.65rem] tracking-[0.18em] uppercase sm:flex">
          <Link href="/v3/courses" className="transition-opacity hover:opacity-55">
            Courses
          </Link>
          <a
            href="mailto:hello@boroughprep.com"
            className="transition-opacity hover:opacity-55"
          >
            Enquire
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/v3/courses"
            className="font-mono text-[0.65rem] tracking-[0.18em] uppercase underline decoration-current/30 underline-offset-[5px] transition-colors hover:decoration-current"
          >
            Begin
          </Link>
          <ThemeToggle className="-mr-1.5 opacity-55" />
        </div>
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative flex flex-1 flex-col justify-center overflow-hidden px-5 py-10 sm:px-8">
        <HeroPlate />

        {/* Corner furniture — the marginalia of a printed page. */}
        <div className="pointer-events-none absolute inset-x-5 top-4 z-10 hidden justify-between font-mono text-[0.6rem] tracking-[0.2em] uppercase opacity-45 sm:flex sm:inset-x-8">
          <span>Fig. 01 — Specimen</span>
          <span>Est. MMXXVI</span>
        </div>
        <div className="pointer-events-none absolute inset-x-5 bottom-4 z-10 hidden justify-between font-mono text-[0.6rem] tracking-[0.2em] uppercase opacity-45 sm:flex sm:inset-x-8">
          <span>40.6782° N — 73.9442° W</span>
          <span>An independent tutoring studio</span>
        </div>

        {/* Paper halo — lifts the type off the dot field without hiding it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background: `radial-gradient(ellipse 44rem 24rem at 50% 50%, color-mix(in srgb, ${PAPER} 94%, transparent) 0%, color-mix(in srgb, ${PAPER} 74%, transparent) 46%, transparent 78%)`,
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <p className="font-mono text-[0.62rem] tracking-[0.26em] uppercase opacity-55">
            An independent tutoring studio
          </p>

          <h1 className="mt-6 font-[family-name:var(--font-editorial)] text-[clamp(3rem,11vw,8.5rem)] leading-[0.88] tracking-[-0.02em] text-balance">
            The opposite
            <br />
            of <MorphWord />.
          </h1>

          <p className="mx-auto mt-8 max-w-md text-[0.95rem] leading-relaxed text-balance opacity-70">
            We don&apos;t drill students through material. We find the idea that
            went missing, rebuild it, and hand it back — theirs to keep.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link
              href="/v3/courses"
              className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors"
              style={{ backgroundColor: INK, color: PAPER }}
            >
              View courses
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
            <a
              href="mailto:hello@boroughprep.com"
              className="font-mono text-[0.68rem] tracking-[0.16em] uppercase underline decoration-current/25 underline-offset-[6px] transition-colors hover:decoration-current"
            >
              Enquire
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
