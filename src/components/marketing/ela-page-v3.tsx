"use client";
import type { BookableTutor } from "@/lib/booking/tutors";

import Link from "next/link";
import { SentenceAnatomy } from "./v3/sentence-anatomy";
import { BookingPanel, type BookingTrack } from "./v3/booking-panel";
import { SAMANTHA, LEAH } from "./roster";
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

const TRACKS: BookingTrack[] = [
  { name: "Close reading", note: "Grades 6–12", mark: "close-reading" },
  { name: "Essay & argument", note: "Grades 8–12", mark: "essay" },
  { name: "Timed writing", note: "Exam-facing", mark: "timed-writing" },
  { name: "Literature seminar", note: "Small group", mark: "seminar" },
];

/**
 * The tutors offering this subject, from the shared roster. Real people only —
 * see roster.ts. This page previously listed three invented ones.
 */
const TUTORS = [
  { ...SAMANTHA, focus: "Writing & essay editing" },
  { ...LEAH, focus: "English" },
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

export function ElaPageV3({
  /** Who is actually bookable, from the database. Threaded to the panel. */
  bookable = [],
}: {
  bookable?: BookableTutor[];
} = {}) {
  return (
    <SubjectPage
      plateLabel="Plate 02 — English Language Arts"
      sections={["Sentence", "Book", "Premise", "Ladder", "Lineage", "Axiom", "Enrol"]}
      footerRight="Plate 02 — English Language Arts"
      hero={(locked) => (
        <>
          <div className="v3-stage-fade relative z-10 px-5 sm:px-8">
            <div className="mx-auto max-w-6xl text-center">
              <p className="v3-label font-mono uppercase opacity-60">
                English Language Arts
              </p>
              <h1 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(3.3rem,9.6vw,6.9rem)] leading-[0.98] tracking-[-0.02em] text-balance">
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
        </>
      )}
      panels={[
        {
          key: "book",
          content: (
            <BookingPanel
              bookable={bookable}
              subject="English Language Arts"
              heading="Book a session"
              blurb="Pick the strand your student needs and the tutor you'd like them to work with. We'll come back with times."
              hue="purple"
              tracks={TRACKS}
              tutors={TUTORS}
            />
          ),
        },
        {
          key: "premise",
          content: (
            <div className="mx-auto max-w-6xl">
              <SectionHead title="I. The premise" meta="On attention" />
              <div className="v3-body mt-10 grid gap-8 opacity-75 sm:grid-cols-2 sm:gap-12">
                <p className="first-letter:float-left first-letter:mr-2.5 first-letter:font-[family-name:var(--font-editorial)] first-letter:text-[5.1rem] first-letter:leading-[0.72]">
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
              <SectionHead title="III. The lineage" meta="Trivium" />
              <p className="v3-body mt-8 max-w-2xl opacity-75">
                Before the mathematical arts came the verbal ones, and they were
                counted as three: how a thing is said, whether it follows, and
                what it does to the person hearing it. Every essay a student
                writes is all three at once. We teach them as such.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-current/12 sm:mt-10 sm:grid-cols-3">
                {TRIVIUM.map((art) => (
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
              <p className="v3-label font-mono uppercase opacity-60">
                Now enrolling — 2026 sessions
              </p>
              <h2 className="mx-auto mt-7 max-w-2xl font-[family-name:var(--font-editorial)] text-[clamp(3.3rem,10.5vw,6.6rem)] leading-[0.95] tracking-[-0.02em] text-balance">
                Bring us a paragraph.
              </h2>
              <p className="v3-body mx-auto mt-6 max-w-md text-balance opacity-70">
                Send something your student has written — anything. We will read
                it closely and tell you what we see.
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
