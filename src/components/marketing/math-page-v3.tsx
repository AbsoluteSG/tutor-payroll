"use client";

import Link from "next/link";
import { CreationDotField } from "./v3/creation-dot-field";
import { BookingPanel } from "./v3/booking-panel";
import {
  SubjectPage,
  SectionHead,
  PAPER,
  INK,
  ACCENT,
} from "./v3/subject-page";

/**
 * Mathematics — a subject page on the shared scroll-in-place shell
 * (see v3/subject-page.tsx).
 *
 * The hero art is Michelangelo's Creation of Adam (the two reaching arms, public
 * domain, c. 1512) rendered as ~2,000 individual dots by
 * scripts/generate-creation-dots.ps1, which rise column by column across the
 * hero's progress to uncover the call to action.
 *
 * Placeholder copy: confirm the curriculum ladder and contact route before this
 * goes live.
 */

const ENQUIRE =
  "mailto:hello@boroughprep.com?subject=Mathematics%20tutoring%20enquiry";

const LADDER = [
  { numeral: "I", name: "Pre-algebra", note: "Number sense, ratio, the idea of an unknown" },
  { numeral: "II", name: "Algebra I", note: "Linear relationships and the grammar of equations" },
  { numeral: "III", name: "Geometry", note: "Proof, construction, and formal deduction" },
  { numeral: "IV", name: "Algebra II", note: "Quadratics, exponentials, functions as objects" },
  { numeral: "V", name: "Precalculus", note: "Trigonometry and behaviour at the limit" },
  { numeral: "VI", name: "Calculus", note: "Rates of change and accumulation, AB and BC" },
];

const TRACKS = [
  { name: "Pre-algebra & Algebra I", note: "Grades 6–9" },
  { name: "Geometry", note: "Grades 8–10" },
  { name: "Algebra II & precalculus", note: "Grades 9–11" },
  { name: "Calculus AB / BC", note: "Grades 11–12" },
];

/** PLACEHOLDER credentials — see the warning in v3/booking-panel.tsx. */
const TUTORS = [
  {
    initials: "AV",
    name: "Amara V.",
    focus: "Calculus",
    credentials: ["M.S. Mathematics, NYU", "9 years teaching AP Calculus", "AP reader, Calculus BC"],
  },
  {
    initials: "TK",
    name: "Theo K.",
    focus: "Algebra & geometry",
    credentials: ["B.A. Mathematics, Hunter", "NYS certified, grades 7–12", "6 years classroom"],
  },
  {
    initials: "RN",
    name: "Rosa N.",
    focus: "Precalculus",
    credentials: ["M.Ed. Teachers College", "11 years precalculus & trig", "Regents item reviewer"],
  },
];

const QUADRIVIUM = [
  { latin: "Arithmetica", english: "Number", note: "Quantity at rest" },
  { latin: "Geometria", english: "Form", note: "Magnitude at rest" },
  { latin: "Musica", english: "Ratio", note: "Quantity in motion" },
  { latin: "Astronomia", english: "Motion", note: "Magnitude in motion" },
];

export function MathPageV3() {
  return (
    <SubjectPage
      plateLabel="Plate 03 — Mathematics"
      sections={["Plate", "Book", "Premise", "Ladder", "Lineage", "Axiom", "Enrol"]}
      footerRight="Plate 03 — Mathematics"
      hero={(locked) => (
        <>
          <div className="v3-stage-fade relative z-10 px-5 sm:px-8">
            <div className="mx-auto max-w-6xl text-center">
              <p className="v3-label font-mono uppercase opacity-60">
                Mathematics
              </p>
              <h1 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(3.75rem,11.25vw,8.1rem)] leading-[0.95] tracking-[-0.02em] text-balance">
                What one mind knows,
                <br />
                another can be{" "}
                <span className="relative inline-block italic">
                  given
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-[3px] w-full sm:-bottom-2 sm:h-[5px]"
                    style={{ backgroundColor: ACCENT }}
                  />
                </span>
                .
              </h1>
            </div>
          </div>

          {/* The plate, edge to edge. In the locked layout it takes the space
              left over after the type (flex-1 + min-h-0) rather than a fixed
              aspect: at full plate size the hero is taller than a viewport, and
              a centred flex column overflows both ends when that happens.
              `slice` means the artwork fills whatever box it gets, so the arms
              keep bleeding off both edges at any height. */}
          <div
            className={`relative w-full ${
              locked ? "mt-10 min-h-0 flex-1" : "mt-12 sm:mt-16"
            }`}
          >
            {/* The plate used to uncover a second call to action as its columns
                cleared — an enquiry pitch sitting between the hero and the
                booking panel. It read as a stray half-section on the way to the
                booking panel, which is where the ask belongs and already makes
                it properly. The plate is now just the plate. */}
            <CreationDotField
              className={`w-full opacity-[0.9] ${
                locked ? "h-full" : "h-[30svh] sm:aspect-112/40 sm:h-auto"
              }`}
            />
          </div>

          {/* Kept where the other pages' hero captions were dropped: this is an
              attribution for the artwork, not a caption describing it. Its job
              is to be present, not to be read, so it stays small and keeps out
              of the scroll cue's way.

              The cue is centred and ~17rem wide, so on a wide screen this sits
              in the corner capped at the space left beside it — half the width
              less the cue's half-width and a margin. Below that there is no
              such gap, so it goes above the cue instead of beside it. */}
          <p className="v3-stage-fade absolute inset-x-4 bottom-[7.5rem] z-10 text-center font-mono text-[0.9rem] leading-relaxed tracking-[0.14em] uppercase opacity-40 sm:inset-x-auto sm:bottom-4 sm:left-6 sm:max-w-[calc(50%-11rem)] sm:text-left">
            Michelangelo, The Creation of Adam (detail), c. 1512
            <span className="mx-2 opacity-50">/</span>
            Public domain
          </p>
        </>
      )}
      panels={[
        {
          key: "book",
          content: (
            <BookingPanel
              subject="Mathematics"
              heading="Book a session"
              blurb="Pick the course your student is in — or the one they're about to be — and the tutor you'd like them to work with. We'll come back with times."
              tracks={TRACKS}
              tutors={TUTORS}
            />
          ),
        },
        {
          key: "premise",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="I. The premise" meta="On certainty" />
              <div className="v3-body mt-10 grid gap-8 opacity-75 sm:grid-cols-2 sm:gap-12">
                <p className="first-letter:float-left first-letter:mr-2.5 first-letter:font-[family-name:var(--font-editorial)] first-letter:text-[5.1rem] first-letter:leading-[0.72]">
                  Mathematics is the one subject a student never has to take on
                  trust. Everything in it can, in principle, be derived in front
                  of them — which means every gap in understanding has an exact
                  location, and every exact location can be returned to.
                </p>
                <p>
                  This is why we refuse to teach it as a set of procedures to be
                  remembered. A student who has memorized a method is holding
                  somebody else&apos;s conclusion. A student who can rebuild it
                  owns the thing itself, and can rebuild the next one without us.
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "ladder",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="II. The ladder" meta="Six rungs" />
              <ul>
                {LADDER.map((rung) => (
                  <li
                    key={rung.numeral}
                    className="grid grid-cols-[2rem_1fr] items-baseline gap-x-4 border-b border-current/12 py-4 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-x-8 sm:py-5"
                  >
                    <span className="v3-micro font-mono opacity-55">
                      {rung.numeral}
                    </span>
                    <span className="font-[family-name:var(--font-editorial)] text-[2.625rem] leading-none tracking-tight sm:text-[3.45rem]">
                      {rung.name}
                    </span>
                    <span className="v3-micro col-start-2 mt-1.5 font-mono uppercase opacity-60 sm:col-start-3 sm:mt-0 sm:text-right">
                      {rung.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        },
        {
          key: "lineage",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="III. The lineage" meta="Quadrivium" />
              <p className="v3-body mt-8 max-w-2xl opacity-75">
                For roughly two thousand years, the mathematical arts were
                counted as four, and no student was considered educated without
                them. The division was between quantity and magnitude, each taken
                at rest and in motion. We teach in that lineage — narrower in
                name, unchanged in intent.
              </p>
              {/* 2x2 on phones rather than a single column, which would overrun
                  a short viewport. */}
              <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-current/12 sm:mt-10 sm:grid-cols-4">
                {QUADRIVIUM.map((art) => (
                  <div key={art.latin} className="bg-current/[0.02] p-4 sm:p-6">
                    <p className="v3-micro font-mono uppercase opacity-55">
                      {art.english}
                    </p>
                    <p className="mt-3 font-[family-name:var(--font-editorial)] text-[2.7rem] leading-none tracking-tight italic">
                      {art.latin}
                    </p>
                    <p className="v3-micro mt-3 font-mono uppercase opacity-60">
                      {art.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: "axiom",
          invert: true,
          content: (
            <div className="mx-auto max-w-3xl text-center">
              <p className="v3-label font-mono uppercase opacity-60">
                Axiom
              </p>
              <blockquote className="mt-8 font-[family-name:var(--font-editorial)] text-[clamp(2.7rem,7.5vw,4.8rem)] leading-[1.14] tracking-tight text-balance">
                A proof is not an argument you win. It is an argument that
                <span className="italic" style={{ color: ACCENT }}>
                  {" "}
                  cannot be lost
                </span>
                .
              </blockquote>
            </div>
          ),
        },
        {
          key: "enrol",
          last: true,
          content: (
            <div className="mx-auto max-w-3xl text-center">
              <p className="v3-label font-mono uppercase opacity-60">
                Now enrolling — 2026 sessions
              </p>
              <h2 className="mx-auto mt-7 max-w-2xl font-[family-name:var(--font-editorial)] text-[clamp(3.3rem,10.5vw,6.6rem)] leading-[0.95] tracking-[-0.02em] text-balance">
                Begin at the rung that fits.
              </h2>
              <p className="v3-body mx-auto mt-6 max-w-md text-balance opacity-70">
                Tell us where it stopped making sense. We&apos;ll find the exact
                place and start there.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={ENQUIRE}
                  className="v3-label group inline-flex items-center gap-2.5 rounded-full px-7 py-4 font-mono uppercase"
                  style={{ backgroundColor: INK, color: PAPER }}
                >
                  Enquire
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </a>
                <Link
                  href="/v3/courses"
                  className="v3-label inline-flex items-center rounded-full border border-current/25 px-7 py-4 font-mono uppercase transition-colors hover:border-current/60"
                >
                  Other courses
                </Link>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
