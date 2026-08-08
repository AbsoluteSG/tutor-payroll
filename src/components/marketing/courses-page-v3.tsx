import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { CourseGallery } from "./v3/course-gallery";

/**
 * Course selection, built on the reference layout: a repeated banner strip, a
 * segmented nav rail, a centred mark, the fanned plates between angled walls,
 * then caption and actions — redrawn in the /v3 paper-and-ink system.
 *
 * The banner strip is deliberately static rather than a moving marquee.
 */

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

const PAPER = "#EDE9E1";
const INK = "#14110E";

const NAV = [
  { label: "Courses", href: "/v3/courses" },
  { label: "Method", href: "/v3" },
  { label: "About", href: "/v3" },
  { label: "Contact", href: "mailto:hello@boroughprep.com" },
];

export function CoursesPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[#D6432B] selection:text-[#EDE9E1]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Film grain, matched to the landing page. */}
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.16] mix-blend-multiply"
      >
        <filter id="v3c-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#v3c-grain)" />
      </svg>

      {/* ── Banner strip (static, clipped) ── */}
      <div
        aria-hidden
        className="relative z-20 flex shrink-0 overflow-hidden border-b border-[#14110E]/12 py-1.5"
      >
        <div className="flex shrink-0 whitespace-nowrap opacity-35">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="px-6 font-mono text-[0.58rem] tracking-[0.24em] uppercase"
            >
              Now enrolling — 2026 sessions
            </span>
          ))}
        </div>
      </div>

      {/* ── Segmented nav rail ── */}
      <nav className="relative z-20 flex shrink-0 border-b border-[#14110E]/12 font-mono text-[0.6rem] tracking-[0.2em] uppercase">
        <Link
          href="/v3"
          className="flex flex-1 items-center justify-center border-r border-[#14110E]/12 px-4 py-3 transition-colors hover:bg-[#14110E]/[0.04]"
        >
          Home
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-center border-r border-[#14110E]/12 px-3 py-3 transition-colors last:border-r-0 hover:bg-[#14110E]/[0.04] sm:px-8"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* ── Stage ── */}
      <main className="relative z-10 flex flex-1 flex-col justify-center py-10 sm:py-14">
        {/* Centred mark */}
        <div className="relative z-20 flex flex-col items-center gap-3">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke={INK}
            strokeWidth="1.1"
          >
            <circle cx="12" cy="9" r="4.4" />
            <circle cx="8.2" cy="15" r="4.4" opacity="0.55" />
            <circle cx="15.8" cy="15" r="4.4" opacity="0.55" />
          </svg>
          <p className="font-mono text-[0.58rem] tracking-[0.24em] uppercase opacity-45">
            Select a course
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <CourseGallery />
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-[#14110E]/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-45 sm:flex-row">
          <span>Borough Prep — Brooklyn, NY</span>
          <span>Fig. 03 — Course plates</span>
        </div>
      </footer>
    </div>
  );
}
