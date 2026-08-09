import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { CourseGallery } from "./v3/course-gallery";
import { NAV_BAR, NAV_ITEM } from "./v3/nav-metrics";
import { ThemeToggle } from "@/components/theme-toggle";

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

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";

const NAV = [
  { label: "Courses", href: "/v3/courses" },
  { label: "Method", href: "/v3" },
  { label: "About", href: "/v3" },
  { label: "Contact", href: "mailto:hello@boroughprep.com" },
];

export function CoursesPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Film grain, matched to the landing page. */}
      <svg
        aria-hidden
        className="v3-grain pointer-events-none fixed inset-0 z-50 h-full w-full"
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
        className="relative z-20 flex shrink-0 overflow-hidden border-b border-current/12 py-1.5"
      >
        <div className="flex shrink-0 whitespace-nowrap opacity-35">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="px-8 font-mono text-[0.85rem] tracking-[0.2em] uppercase"
            >
              Now enrolling — 2026 sessions
            </span>
          ))}
        </div>
      </div>

      {/* ── Segmented nav rail ──
          A rail rather than the wordmark-and-links bar the other /v3 surfaces
          carry, but the same height and the same type as both — see
          v3/nav-metrics.ts. The segments run edge to edge, so the bar's own
          horizontal inset is dropped and each segment carries its own. */}
      <nav
        className={`relative z-20 justify-start px-0 sm:px-0 ${NAV_BAR} ${NAV_ITEM}`}
      >
        <Link
          href="/v3"
          className="flex h-full flex-1 items-center justify-center border-r border-current/12 px-4 transition-colors hover:bg-current/[0.04]"
        >
          Home
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex h-full items-center justify-center border-r border-current/12 px-3 transition-colors last:border-r-0 hover:bg-current/[0.04] sm:px-8"
          >
            {item.label}
          </Link>
        ))}
        {/* A segment of its own, so the rail stays a single unbroken strip. */}
        <div className="flex h-full items-center justify-center px-2 sm:px-3">
          <ThemeToggle className="opacity-60" />
        </div>
      </nav>

      {/* ── Stage ── */}
      <main className="relative z-10 flex flex-1 flex-col justify-center py-10 sm:py-14">
        {/* Centred mark */}
        <div className="relative z-20 flex flex-col items-center gap-3">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          >
            <circle cx="12" cy="9" r="4.4" />
            <circle cx="8.2" cy="15" r="4.4" opacity="0.55" />
            <circle cx="15.8" cy="15" r="4.4" opacity="0.55" />
          </svg>
          <p className="v3-micro font-mono uppercase opacity-55">
            Select a course
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <CourseGallery />
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-current/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 v3-micro font-mono uppercase opacity-55 sm:flex-row">
          <span>Borough Prep — Brooklyn, NY</span>
          <span>Fig. 03 — Course plates</span>
        </div>
      </footer>
    </div>
  );
}
