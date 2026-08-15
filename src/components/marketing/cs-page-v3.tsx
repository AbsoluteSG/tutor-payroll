"use client";
import type { BookableTutor } from "@/lib/booking/tutors";

import Link from "next/link";
import { CrtScreen } from "./v3/crt-screen";
import { CircuitField } from "./v3/circuit-field";
import {
  BookingPanel,
  type BookingTrack,
  type BookingTutor,
} from "./v3/booking-panel";
import {
  SubjectPage,
  SectionHead,
  PAPER,
  INK,
  ACCENT,
} from "./v3/subject-page";

/**
 * Computer Science — a subject page on the shared scroll-in-place shell
 * (see v3/subject-page.tsx).
 *
 * The hero is a CRT terminal typing in a listing and running it. Where the other
 * three heroes show a still object — a plate, a sentence, an answer sheet — this
 * one performs, because the object of this discipline is the only one that can.
 * The program it runs contains a deliberate off-by-one; see v3/crt-screen.tsx.
 *
 * Where Mathematics claims the QUADRIVIUM and English the TRIVIUM, this subject
 * has no place among the seven liberal arts — it postdates them by a millennium.
 * Like Specialized Testing, it takes the honest alternative: its third section
 * is a descent rather than an inheritance, the four levels between a written
 * instruction and a switch changing state.
 *
 * The curriculum is deliberately ordered against the obvious one. A student can
 * generate working code on day one, so the scarce thing is no longer production
 * but judgement — and judgement is not teachable at the top of the stack. Rungs
 * I–IV are unassisted C++, close to the machine; Claude and GPT arrive at V, as
 * something to direct and audit rather than to lean on. The Axiom panel is the
 * one-line version: you cannot review what you could not have written.
 *
 * Placeholder copy: confirm the curriculum ladder, the tutor roster and the
 * contact route before this goes live.
 */

const ENQUIRE =
  "mailto:hello@boroughprep.com?subject=Computer%20Science%20tutoring%20enquiry";

/**
 * The ladder is ordered by what has to be true before the next rung is
 * survivable. Rungs I–IV are unassisted C++; a model is only introduced at V,
 * once a student can tell whether what it produced is correct.
 */
const LADDER = [
  { numeral: "I", name: "Syntax by hand", note: "C++ written unassisted, until it is boring" },
  { numeral: "II", name: "Memory", note: "Pointers, stack and heap — where a value lives" },
  { numeral: "III", name: "Data structures", note: "Choosing the shape the problem already has" },
  { numeral: "IV", name: "Algorithms", note: "Correctness first, then the cost of getting there" },
  { numeral: "V", name: "Reading generated code", note: "Judging work you did not write" },
  { numeral: "VI", name: "AI-paired workflow", note: "Specify, generate, review, verify — in that order" },
];

const TRACKS: BookingTrack[] = [
  { name: "Intro — C++ by hand", note: "Grades 6–9", mark: "cpp-intro" },
  { name: "Systems & memory", note: "Grades 9–12", mark: "systems" },
  { name: "AI-paired engineering", note: "Grades 10–12", mark: "ai-paired" },
  { name: "Contest & USACO", note: "By assessment", mark: "usaco" },
];

/**
 * The lineage, as a descent rather than an inheritance: four levels between a
 * written instruction and a switch changing state.
 */
const DESCENT = [
  { level: "01", name: "Language", note: "What you wrote" },
  { level: "02", name: "Compiler", note: "What it becomes" },
  { level: "03", name: "Instruction", note: "What runs" },
  { level: "04", name: "Circuit", note: "What moves" },
];


export function CsPageV3({
  /** Who is actually bookable, from the database. Threaded to the panel. */
  bookable = [],
  /** Published tutors for this subject, from the database. */
  roster = [],
}: {
  bookable?: BookableTutor[];
  roster?: BookingTutor[];
} = {}) {
  return (
    <SubjectPage
      plateLabel="Plate 04 — Computer Science"
      sections={["Screen", "Book", "Premise", "Ladder", "Descent", "Axiom", "Enrol"]}
      footerRight="Plate 04 — Computer Science"
      hero={(locked) => (
        <>
          <div className="v3-stage-fade relative z-10 px-5 sm:px-8">
            <div className="mx-auto max-w-6xl text-center">
              <p className="v3-label font-mono uppercase opacity-60">
                Computer Science
              </p>
              <h1 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(3.3rem,9.6vw,6.9rem)] leading-[0.98] tracking-[-0.02em] text-balance">
                The machine does
                <br />
                exactly what you{" "}
                <span className="relative inline-block italic">
                  said
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

          {/* The screen takes whatever height is left after the type, the same
              way the Mathematics plate and the answer sheet do. */}
          <div
            className={`relative flex w-full items-center justify-center ${
              locked ? "mt-8 min-h-0 flex-1" : "mt-12 sm:mt-14"
            }`}
          >
            <CrtScreen />
          </div>
        </>
      )}
      panels={[
        {
          key: "book",
          content: (
            <BookingPanel
              bookable={bookable}
              subject="Computer Science"
              heading="Book a session"
              blurb="Pick the course your student is taking, or the one they're aiming at. Intro assumes no prior programming."
              hue="green"
              tracks={TRACKS}
              tutors={roster}
            />
          ),
        },
        {
          key: "premise",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="I. The premise" meta="On judgement" />
              <div className="v3-body mt-10 grid gap-8 opacity-75 sm:grid-cols-2 sm:gap-12">
                <p className="first-letter:float-left first-letter:mr-2.5 first-letter:font-[family-name:var(--font-editorial)] first-letter:text-[5.1rem] first-letter:leading-[0.72]">
                  A student can now produce working code on the first day, from a
                  sentence of English. That is real, and pretending otherwise
                  would be teaching for a world that has gone. What it does not
                  produce is the judgement to tell whether the code is right —
                  and that judgement is now the entire job.
                </p>
                <p>
                  So we teach downward before we teach fast. The first years are
                  C++ written by hand, close enough to the machine that a student
                  knows where a value actually lives and what a loop actually
                  costs. Only then do we put Claude or GPT in front of them — as
                  something to direct and audit, which is a skill you cannot have
                  without the years underneath it.
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
          key: "descent",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="III. The descent" meta="Four levels" />
              <p className="v3-body mt-8 max-w-2xl opacity-75">
                Mathematics inherited the quadrivium and English the trivium.
                This subject is a century old and inherits nothing, so it has a
                descent instead: four levels between the sentence a student
                writes and a switch somewhere changing state. A student who has
                seen all four stops believing in magic.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-current/12 sm:mt-10 sm:grid-cols-4">
                {DESCENT.map((step) => (
                  <div key={step.level} className="bg-current/[0.02] p-4 sm:p-6">
                    <p className="v3-micro font-mono uppercase opacity-55">
                      {step.level}
                    </p>
                    <p className="mt-3 font-[family-name:var(--font-editorial)] text-[2.7rem] leading-none tracking-tight italic">
                      {step.name}
                    </p>
                    <p className="v3-micro mt-3 font-mono uppercase opacity-60">
                      {step.note}
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
              <p className="v3-label font-mono uppercase opacity-60">Axiom</p>
              <blockquote className="mt-8 font-[family-name:var(--font-editorial)] text-[clamp(2.7rem,7.5vw,4.8rem)] leading-[1.14] tracking-tight text-balance">
                You cannot review what you could not
                <span className="italic" style={{ color: ACCENT }}>
                  {" "}
                  have written
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
                Bring us something that doesn&apos;t run.
              </h2>
              <p className="v3-body mx-auto mt-6 max-w-md text-balance opacity-70">
                Theirs or something a model wrote for them — both are worth the
                hour. We will find out together where it stopped matching what
                your student actually meant.
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
                  href="/courses"
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
