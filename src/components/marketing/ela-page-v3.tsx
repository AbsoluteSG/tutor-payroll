"use client";

import Link from "next/link";
import { SentenceAnatomy } from "./v3/sentence-anatomy";
import { BookingPanel } from "./v3/booking-panel";
import {
  SubjectPage,
  SectionHead,
  PAPER,
  INK,
  ACCENT,
} from "./v3/subject-page";

/**
 * English Language Arts — a subject page on the shared scroll-in-place shell
 * (see v3/subject-page.tsx).
 *
 * The hero is a single sentence that takes itself apart: brackets and
 * grammatical labels draw in beneath it as the hero's progress advances. It is
 * the counterpart to the Mathematics hero — where that page shows knowledge
 * being handed over, this one shows a sentence being opened up.
 *
 * The lineage section names the TRIVIUM (grammar, logic, rhetoric), deliberately
 * mirroring the Mathematics page's QUADRIVIUM: together they are the seven
 * liberal arts, which ties the subject pages into one scheme.
 *
 * Placeholder copy: confirm the skills ladder and contact route before this goes
 * live.
 */

const ENQUIRE = "mailto:hello@boroughprep.com?subject=ELA%20tutoring%20enquiry";

const LADDER = [
  { numeral: "I", name: "Annotation", note: "Marking a text until it answers back" },
  { numeral: "II", name: "Close reading", note: "What a sentence does, not only what it says" },
  { numeral: "III", name: "Argument", note: "A claim, its evidence, and the distance between" },
  { numeral: "IV", name: "The essay", note: "Structure as an act of thinking" },
  { numeral: "V", name: "Revision", note: "Cutting until the idea is visible" },
  { numeral: "VI", name: "Voice", note: "Style as precision that has been earned" },
];

const TRACKS = [
  { name: "Close reading", note: "Grades 6–12" },
  { name: "Essay & argument", note: "Grades 8–12" },
  { name: "Timed writing", note: "Exam-facing" },
  { name: "Literature seminar", note: "Small group" },
];

const TUTORS = [
  { initials: "MR", name: "Maya R.", focus: "Essay & argument" },
  { initials: "DL", name: "Daniel L.", focus: "Close reading" },
  { initials: "SO", name: "Sofia O.", focus: "Timed writing" },
];

const TRIVIUM = [
  {
    latin: "Grammatica",
    english: "Structure",
    note: "What the words are doing",
  },
  {
    latin: "Dialectica",
    english: "Reason",
    note: "Whether the argument holds",
  },
  {
    latin: "Rhetorica",
    english: "Persuasion",
    note: "Why it moves the reader",
  },
];

export function ElaPageV3() {
  return (
    <SubjectPage
      plateLabel="Plate 02 — English Language Arts"
      sections={["Sentence", "Book", "Premise", "Ladder", "Lineage", "Axiom", "Enrol"]}
      footerRight="Plate 02 — English Language Arts"
      hero={(locked) => (
        <>
          <div className="v3-stage-fade relative z-10 px-5 sm:px-8">
            <div className="mx-auto max-w-5xl text-center">
              <p className="font-mono text-[0.62rem] tracking-[0.28em] uppercase opacity-55">
                English Language Arts
              </p>
              <h1 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(2.2rem,6.4vw,4.6rem)] leading-[0.98] tracking-[-0.02em] text-balance">
                Read as though the
                <br />
                sentence were{" "}
                <span className="relative inline-block italic">
                  built
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

          {/* The specimen sentence, with room beneath it for two tiers of
              analysis to draw into. */}
          <div
            className={`relative flex w-full items-center justify-center ${
              locked ? "mt-10 min-h-0 flex-1 pb-24" : "mt-14 pb-28"
            }`}
          >
            <SentenceAnatomy />
          </div>

          <p className="v3-stage-fade relative z-10 mt-4 px-5 text-center font-mono text-[0.55rem] leading-relaxed tracking-[0.18em] uppercase opacity-40 sm:px-8">
            Constituent analysis
            <span className="mx-2 opacity-50">/</span>
            Specimen sentence
          </p>
        </>
      )}
      panels={[
        {
          key: "book",
          content: (
            <BookingPanel
              subject="English Language Arts"
              heading="Book a session"
              blurb="Pick the strand your student needs and the tutor you'd like them to work with. We'll come back with times."
              tracks={TRACKS}
              tutors={TUTORS}
            />
          ),
        },
        {
          key: "premise",
          content: (
            <div className="mx-auto max-w-5xl">
              <SectionHead title="I. The premise" meta="On attention" />
              <div className="mt-10 grid gap-8 text-[0.95rem] leading-relaxed opacity-75 sm:grid-cols-2 sm:gap-12">
                <p className="first-letter:float-left first-letter:mr-2.5 first-letter:font-[family-name:var(--font-editorial)] first-letter:text-[3.4rem] first-letter:leading-[0.72]">
                  Close reading is not slow reading. It is reading with the
                  question &ldquo;why this way and not another&rdquo; held open
                  the whole time — why this word, this order, this length of
                  sentence. A student who can ask that of a text can ask it of
                  their own draft.
                </p>
                <p>
                  So we do not teach essays as five paragraphs to be filled.
                  Writing is thinking that has been made inspectable, which means
                  the structure is the argument. Learn to see how a sentence was
                  built and you have learned how to build one.
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "ladder",
          content: (
            <div className="mx-auto max-w-5xl">
              <SectionHead title="II. The ladder" meta="Six rungs" />
              <ul>
                {LADDER.map((rung) => (
                  <li
                    key={rung.numeral}
                    className="grid grid-cols-[2rem_1fr] items-baseline gap-x-4 border-b border-current/12 py-4 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-x-8 sm:py-5"
                  >
                    <span className="font-mono text-[0.62rem] tracking-[0.16em] opacity-40">
                      {rung.numeral}
                    </span>
                    <span className="font-[family-name:var(--font-editorial)] text-[1.5rem] leading-none tracking-tight sm:text-[2.1rem]">
                      {rung.name}
                    </span>
                    <span className="col-start-2 mt-1.5 font-mono text-[0.58rem] tracking-[0.1em] uppercase opacity-50 sm:col-start-3 sm:mt-0 sm:text-right">
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
            <div className="mx-auto max-w-5xl">
              <SectionHead title="III. The lineage" meta="Trivium" />
              <p className="mt-8 max-w-2xl text-[0.95rem] leading-relaxed opacity-75">
                Before the mathematical arts came the verbal ones, and they were
                counted as three: how a thing is said, whether it follows, and
                what it does to the person hearing it. Every essay a student
                writes is all three at once. We teach them as such.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-current/12 sm:mt-10 sm:grid-cols-3">
                {TRIVIUM.map((art) => (
                  <div key={art.latin} className="bg-current/[0.02] p-4 sm:p-6">
                    <p className="font-mono text-[0.52rem] tracking-[0.2em] uppercase opacity-40">
                      {art.english}
                    </p>
                    <p className="mt-3 font-[family-name:var(--font-editorial)] text-[1.5rem] leading-none tracking-tight italic">
                      {art.latin}
                    </p>
                    <p className="mt-3 font-mono text-[0.55rem] tracking-[0.1em] uppercase opacity-50">
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
              <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-50">
                Axiom
              </p>
              <blockquote className="mt-8 font-[family-name:var(--font-editorial)] text-[clamp(1.8rem,5vw,3.2rem)] leading-[1.14] tracking-tight text-balance">
                A sentence you cannot take apart is a sentence you do not yet
                <span className="italic" style={{ color: ACCENT }}>
                  {" "}
                  own
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
              <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-50">
                Now enrolling — 2026 sessions
              </p>
              <h2 className="mx-auto mt-7 max-w-2xl font-[family-name:var(--font-editorial)] text-[clamp(2.2rem,7vw,4.4rem)] leading-[0.95] tracking-[-0.02em] text-balance">
                Bring us a paragraph.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-[0.92rem] leading-relaxed text-balance opacity-70">
                Send something your student has written — anything. We will read
                it closely and tell you what we see.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={ENQUIRE}
                  className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase"
                  style={{ backgroundColor: INK, color: PAPER }}
                >
                  Enquire
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </a>
                <Link
                  href="/v3/courses"
                  className="inline-flex items-center rounded-full border border-current/25 px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
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
