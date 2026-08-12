import { Instrument_Serif } from "next/font/google";
import { CourseGallery } from "./v3/course-gallery";
import { Grain } from "./v3/grain";
import { SiteHeader } from "./v3/site-header";
import { ChatWidget } from "./v3/chat-widget";

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

export function CoursesPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <Grain id="v3c-grain" />

      <SiteHeader active="Courses" />

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

      <ChatWidget />
    </div>
  );
}
