"use client";

import Link from "next/link";
import { AnswerSheet } from "./v3/answer-sheet";
import { BookingPanel } from "./v3/booking-panel";
import {
  SubjectPage,
  SectionHead,
  PAPER,
  INK,
  ACCENT,
} from "./v3/subject-page";

/**
 * Specialized Testing — a subject page on the shared scroll-in-place shell
 * (see v3/subject-page.tsx).
 *
 * This is the SHSAT and the SAT under one plate. They were separate courses in
 * the gallery, which put two of the four cards on exams and read as though the
 * practice were mostly test prep; it also split a single body of work, since the
 * two exams are prepared for the same way and often by the same student two
 * years apart.
 *
 * Where Mathematics has the QUADRIVIUM and English the TRIVIUM, this page has no
 * classical ancestor to claim — a timed multiple-choice exam is a twentieth
 * century object. Its third section is the preparation sequence instead, which
 * is the honest counterpart: the lineage here is method, not inheritance.
 *
 * Placeholder copy: confirm exam details, the tutor roster and the contact route
 * before this goes live.
 */

const ENQUIRE =
  "mailto:hello@boroughprep.com?subject=Specialized%20Testing%20enquiry";

const TRACKS = [
  { name: "SHSAT", note: "Grades 7–8" },
  { name: "Digital SAT", note: "Grades 10–12" },
  { name: "PSAT / NMSQT", note: "Grades 10–11" },
  { name: "Diagnostic only", note: "One sitting" },
];

/** PLACEHOLDER credentials — see the warning in v3/booking-panel.tsx. */
const TUTORS = [
  {
    initials: "JC",
    name: "Julian C.",
    focus: "SHSAT",
    credentials: ["B.S. Applied Math, Cooper Union", "10 years SHSAT preparation", "Stuyvesant graduate"],
  },
  {
    initials: "PE",
    name: "Priya E.",
    focus: "SAT math",
    credentials: ["B.A. Physics, Barnard", "800 SAT Math", "6 years digital SAT"],
  },
  {
    initials: "NB",
    name: "Nadia B.",
    focus: "SAT reading & writing",
    credentials: ["M.A. Linguistics, Columbia", "790 SAT Reading & Writing", "9 years exam coaching"],
  },
];

const EXAMS = [
  {
    code: "SHSAT",
    full: "Specialized High Schools Admissions Test",
    when: "Autumn, eighth grade",
    note: "English Language Arts and Mathematics across one sitting. Admission to the specialized high schools is by score alone — there is no essay, no interview, and no second reader. That makes it unusually learnable.",
  },
  {
    code: "SAT",
    full: "Digital SAT",
    when: "Spring, eleventh grade onward",
    note: "Reading and Writing, then Math, each adaptive across two modules: the second module's difficulty is set by how the first one went. Most students should sit it more than once, and we plan for that from the start.",
  },
];

const SEQUENCE = [
  { step: "01", name: "Diagnostic", note: "Where the points actually go" },
  { step: "02", name: "Patterns", note: "The dozen shapes that recur" },
  { step: "03", name: "Timing", note: "Pace as a skill of its own" },
  { step: "04", name: "Review", note: "The wrong answer as the lesson" },
];

export function TestingPageV3() {
  return (
    <SubjectPage
      plateLabel="Plate 01 — Specialized Testing"
      sections={["Sheet", "Book", "Premise", "Exams", "Sequence", "Axiom", "Enrol"]}
      footerRight="Plate 01 — Specialized Testing"
      hero={(locked) => (
        <>
          <div className="v3-stage-fade relative z-10 px-5 sm:px-8">
            <div className="mx-auto max-w-6xl text-center">
              <p className="v3-label font-mono uppercase opacity-60">
                Specialized Testing
              </p>
              <h1 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(3.3rem,9.6vw,6.9rem)] leading-[0.98] tracking-[-0.02em] text-balance">
                A standardized test is a
                <br />
                <span className="relative inline-block italic">
                  solved
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-[3px] w-full sm:-bottom-2 sm:h-[5px]"
                    style={{ backgroundColor: ACCENT }}
                  />
                </span>{" "}
                problem.
              </h1>
            </div>
          </div>

          {/* The sheet takes whatever height is left after the type, the same
              way the Mathematics plate does. */}
          <div
            className={`relative flex w-full items-center justify-center ${
              locked ? "mt-8 min-h-0 flex-1" : "mt-12 sm:mt-14"
            }`}
          >
            <AnswerSheet />
          </div>
        </>
      )}
      panels={[
        {
          key: "book",
          content: (
            <BookingPanel
              subject="Specialized Testing"
              heading="Book a session"
              blurb="Pick the exam your student is sitting and the tutor you'd like them to work with. If you're not sure where they stand, start with a diagnostic."
              tracks={TRACKS}
              tutors={TUTORS}
            />
          ),
        },
        {
          key: "premise",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="I. The premise" meta="On patterns" />
              <div className="v3-body mt-10 grid gap-8 opacity-75 sm:grid-cols-2 sm:gap-12">
                <p className="first-letter:float-left first-letter:mr-2.5 first-letter:font-[family-name:var(--font-editorial)] first-letter:text-[5.1rem] first-letter:leading-[0.72]">
                  A standardized test has to be standardized. It is written to a
                  specification, reused year after year, and scored by machine —
                  which means it cannot surprise anyone, and the same few dozen
                  question shapes come round every time.
                </p>
                <p>
                  So we do not drill vocabulary lists and hope. We teach the
                  shapes, and we teach the clock, because a student who
                  recognises what is being asked has already done most of the
                  work. What is left is arithmetic and nerve, and both are
                  trainable.
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "exams",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="II. The exams" meta="Two instruments" />
              <div className="mt-8 grid gap-px overflow-hidden border border-current/12 sm:mt-10 sm:grid-cols-2">
                {EXAMS.map((exam) => (
                  <div key={exam.code} className="bg-current/[0.02] p-5 sm:p-7">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-[family-name:var(--font-editorial)] text-[3rem] leading-none tracking-tight sm:text-[3.9rem]">
                        {exam.code}
                      </p>
                      <p className="v3-micro text-right font-mono uppercase opacity-55">
                        {exam.when}
                      </p>
                    </div>
                    <p className="v3-micro mt-3 font-mono uppercase opacity-55">
                      {exam.full}
                    </p>
                    <p className="v3-body mt-4 opacity-75">
                      {exam.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: "sequence",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="III. The sequence" meta="Four stages" />
              <p className="v3-body mt-8 max-w-2xl opacity-75">
                Every student runs the same four stages, however long they have.
                The order matters more than the hours: there is no point drilling
                a section before knowing whether it is the one losing the points.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-current/12 sm:mt-10 sm:grid-cols-4">
                {SEQUENCE.map((stage) => (
                  <div key={stage.step} className="bg-current/[0.02] p-4 sm:p-6">
                    <p className="v3-micro font-mono uppercase opacity-55">
                      {stage.step}
                    </p>
                    <p className="mt-3 font-[family-name:var(--font-editorial)] text-[2.7rem] leading-none tracking-tight italic">
                      {stage.name}
                    </p>
                    <p className="v3-micro mt-3 font-mono uppercase opacity-60">
                      {stage.note}
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
                A score measures preparation. It has never once measured a
                <span className="italic" style={{ color: ACCENT }}>
                  {" "}
                  student
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
                Start with a diagnostic.
              </h2>
              <p className="v3-body mx-auto mt-6 max-w-md text-balance opacity-70">
                One sitting, scored and read back to you section by section. Then
                we will tell you what the work actually is.
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
