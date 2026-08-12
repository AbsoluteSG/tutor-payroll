import Link from "next/link";
import { NAV_ITEM } from "./nav-metrics";
import { ThemeToggle } from "@/components/theme-toggle";
import { SHOW_PRICING } from "../pricing";

/**
 * Chrome for the secondary /v3 pages: a static banner strip over a segmented
 * nav rail.
 *
 * Shared rather than copied because the rail is a list of destinations that has
 * to stay in sync — the courses page and the testimonials page had identical
 * copies of it, which is exactly the arrangement where one grows a link the
 * other never gets. The landing page keeps its own header: it is a wordmark and
 * two links, not this rail.
 */

const NAV = [
  { label: "Courses", href: "/courses" },
  // Labelled "Tutors" to sit alongside the other one-word segments; the page
  // itself is titled Our Tutors.
  { label: "Tutors", href: "/tutors" },
  // Pricing sits high in the rail on purpose. The page's entire argument is
  // that we publish the rates when nobody else does, and that argument is worth
  // nothing if the link is buried at the end. Drops out with SHOW_PRICING.
  ...(SHOW_PRICING ? [{ label: "Pricing", href: "/pricing" }] : []),
  // Testimonials is unlinked until there are real accounts on it — an empty
  // page in the nav advertises that nobody has said anything. Restore this
  // line when v3/testimonial-wall.tsx has content.
  { label: "Method", href: "/" },
  { label: "About", href: "/" },
  { label: "Contact", href: "mailto:hello@boroughprep.com" },
];

export function SiteHeader({
  /** Label of the current page's segment, marked as current in the rail. */
  active,
}: {
  active?: string;
}) {
  return (
    <>
      {/* ── Banner strip (static, clipped) ── */}
      <div
        aria-hidden
        className="relative z-20 flex shrink-0 overflow-hidden border-b border-current/12 py-1.5"
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

      {/* ── Segmented nav rail ──
          Scrolls sideways rather than wrapping or squeezing. Six segments plus
          the theme toggle do not fit a 375px phone, and a rail that wraps to two
          rows stops reading as a rail. `w-max min-w-full` lets it fill the width
          when there is room and run past it when there isn't. */}
      {/* Height and type come from nav-metrics so this rail matches the landing
          page's bar — see the note there on why the height is explicit rather
          than derived from padding. */}
      <nav
        className={`v3-no-scrollbar relative z-20 h-[3.75rem] shrink-0 overflow-x-auto border-b border-current/12 ${NAV_ITEM}`}
      >
        <div className="flex h-full w-max min-w-full">
          <Link
            href="/"
            className="flex h-full flex-1 items-center justify-center border-r border-current/12 px-4 transition-colors hover:bg-current/[0.04]"
          >
            Home
          </Link>
          {NAV.map((item) => {
            const current = item.label === active;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`relative flex h-full shrink-0 items-center justify-center border-r border-current/12 px-3 transition-colors hover:bg-current/[0.04] sm:px-8 ${
                  current ? "bg-current/[0.05]" : ""
                }`}
              >
                {item.label}
                {/* The rail is one flat strip, so the current segment is marked
                    with a rule along its base rather than a fill. */}
                {current ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-[2px]"
                    style={{ backgroundColor: "var(--v3-accent)" }}
                  />
                ) : null}
              </Link>
            );
          })}
          {/* A segment of its own, so the rail stays a single unbroken strip. */}
          <div className="flex shrink-0 items-center justify-center px-2 sm:px-3">
            <ThemeToggle className="opacity-60" />
          </div>
        </div>
      </nav>
    </>
  );
}
