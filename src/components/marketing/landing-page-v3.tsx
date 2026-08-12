import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { HeroPlate } from "./v3/hero-plate";
import { MorphWord } from "./v3/morph-word";
import { NAV_BAR, NAV_ITEM, NAV_WORDMARK } from "./v3/nav-metrics";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatWidget } from "./v3/chat-widget";

/**
 * "Editorial Learning Lab" — a standalone marketing page with its own type and
 * color system, deliberately independent of the app's dark admin theme tokens.
 * Every color is explicit so nothing here shifts when the app theme changes.
 *
 * This page is intentionally a single non-scrolling screen: it locks to the
 * viewport height and clips overflow, so the hero is the whole experience.
 * Everything else lives on its own route (see /courses).
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
const ACCENT = "var(--v3-accent)";

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
      <header className={`relative z-20 ${NAV_BAR}`}>
        {/* Instrument Serif is already narrow, so this wordmark gets a little
            positive tracking and room to breathe rather than tracking-tight. */}
        <span className={NAV_WORDMARK}>Borough Prep</span>
        {/* Revealed at lg, not sm. Four destinations at the v3-label size are
            594px of nav; with the wordmark and the Begin group that needs about
            950px, so at the old sm breakpoint the bar overflowed from 640px up
            — the wordmark wrapped to two lines and Enquire ran into Begin.
            Below lg the header keeps Begin and the theme toggle, and every page
            this leads to carries the full segmented rail. */}
        <nav className={`hidden gap-6 lg:flex ${NAV_ITEM}`}>
          <Link href="/courses" className="transition-opacity hover:opacity-55">
            Courses
          </Link>
          <Link
            href="/tutors"
            className="transition-opacity hover:opacity-55"
          >
            Tutors
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
            href="/courses"
            className={`${NAV_ITEM} underline decoration-current/30 underline-offset-[5px] transition-colors hover:decoration-current`}
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

        {/* There was a radial wash of the ground colour behind the type here,
            to lift it off the dot field. It read as a halo — a visible bright
            ellipse in the middle of the page rather than an invisible aid — so
            the type now sits directly on the field. */}

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

          {/* Both actions carry the shared button shape the subject pages use —
              v3-label type, px-7 py-4, rounded-full — filled for the primary and
              ruled for the secondary. They had been left on a hardcoded 0.68rem
              when the type scale moved, which rendered them at 11px under a 24px
              nav. */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 gap-y-4">
            <Link
              href="/courses"
              // A transparent rule so this sits at exactly the height of the
              // ruled button beside it: both boxes are content-height, so the
              // secondary's 1px border would otherwise make it 2px taller.
              className="v3-label group inline-flex items-center gap-2.5 rounded-full border border-transparent px-7 py-4 font-mono uppercase transition-colors"
              style={{ backgroundColor: INK, color: PAPER }}
            >
              View courses
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>

            {/* The tutors, rather than a mailto. A visitor who has just read
                the headline is deciding whether to believe it, not ready to
                write an email — and the enquiry is still one tap away in the
                header and at the foot of every page it leads to.

                This pointed at the testimonials until that page was emptied of
                its invented accounts. Three real people with real photographs
                is the strongest proof the site currently has. */}
            <Link
              href="/tutors"
              className="v3-label group inline-flex items-center gap-2.5 rounded-full border border-current/30 px-7 py-4 font-mono uppercase transition-colors hover:border-current/70 hover:bg-current/[0.05]"
            >
              {/* Sized to sit inside the label's line box (v3-label is 24px on
                  a 1.4 line, so ~33px of room). Any larger and the glyph — not
                  the type — sets the button's height, and it stops matching the
                  filled button beside it. translate-y optically centres it:
                  quotation marks paint at cap height, so a box-centred one
                  reads high. */}
              <span
                aria-hidden
                className="inline-block translate-y-[0.12em] font-[family-name:var(--font-editorial)] text-[1.35em] leading-none"
                style={{ color: ACCENT }}
              >
                &ldquo;
              </span>
              Meet the tutors
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Last child so it paints over the grain overlay, which is also z-50. */}
      <ChatWidget />
    </div>
  );
}
