"use client";

import { useState } from "react";
import { INK, PAPER, ACCENT } from "./subject-page";
import { TutorPortrait } from "./tutor-portrait";

/**
 * The booking panel — a subject page's second section, immediately after the
 * hero.
 *
 * The subject pages used to hold their only call to action at the very end, six
 * sections down a sequence with no scrollbar, so a visitor who stopped reading
 * partway never saw one at all. This puts the ask second: pick a specific course
 * within the subject, pick a tutor, send.
 *
 * Both choices are laid out horizontally — courses as a row of plates, tutors as
 * a row of cards carrying a portrait and their credentials. The earlier version
 * was two columns of small text rows, which asked a visitor to read nine
 * near-identical lines before they could act on any of them. A face and three
 * credentials are compared at a glance; a 14px row of initials is not.
 *
 * The cards carry credentials rather than a written-up description of how each
 * tutor teaches. Nine paragraphs of that read as filler and none of it is
 * checkable — a parent choosing between three strangers wants the degree, the
 * years, and the score, in the same place on every card.
 *
 * The selection composes a prefilled enquiry rather than writing a booking,
 * which matches every other action on the marketing site. It means the enquiry
 * that arrives already names the course and the tutor instead of being a blank
 * "interested in tutoring" — but a real scheduling endpoint should replace the
 * mailto before this carries any volume.
 *
 * Tutor names and course tracks are PLACEHOLDER, like the rest of the /v3 copy.
 * So are the portraits — see tutor-portrait.tsx.
 *
 * The credentials are placeholder too, and they are the dangerous kind: degrees,
 * years and test scores attached to a named person read as verified fact in a
 * way that marketing prose does not. Every line must be replaced with something
 * the business can substantiate before this page is public.
 */

const ENQUIRY_TO = "hello@boroughprep.com";

export type BookingTrack = {
  /** Short label for the specific course, e.g. "Essay & argument". */
  name: string;
  /** Right-hand qualifier, e.g. "Grades 6–12". */
  note: string;
};

export type BookingTutor = {
  /** Rendered as the placeholder portrait's monogram. */
  initials: string;
  name: string;
  focus: string;
  /**
   * What qualifies them, shortest first — degree, experience, a proof point.
   * Two or three entries; the card is not a CV. Kept as separate strings rather
   * than one sentence so they stack as scannable lines: a parent comparing
   * three tutors is looking for the same fact in the same place on each card,
   * and prose makes them hunt for it.
   */
  credentials: string[];
  /** Path under /public once a photograph exists. */
  image?: string;
};

/** Always offered, so a visitor without a preference is never stuck. */
const ANY_TUTOR: BookingTutor = {
  initials: "—",
  name: "No preference",
  focus: "Matched to the student",
  credentials: [],
};

type Props = {
  /** Full subject name, used in the enquiry, e.g. "English Language Arts". */
  subject: string;
  heading: string;
  blurb: string;
  tracks: BookingTrack[];
  tutors: BookingTutor[];
};

function enquiryHref(subject: string, track: BookingTrack, tutor: BookingTutor) {
  const body = [
    "I'd like to book a session.",
    "",
    `Subject:  ${subject}`,
    `Course:   ${track.name}`,
    `Tutor:    ${tutor.name}`,
    "",
    "Student's name:",
    "Grade:",
    "Availability:",
    "",
  ].join("\n");

  return `mailto:${ENQUIRY_TO}?subject=${encodeURIComponent(
    `Booking — ${subject}: ${track.name}`
  )}&body=${encodeURIComponent(body)}`;
}

/** The numbered rule above each step. */
function StepHead({ step, title }: { step: string; title: string }) {
  return (
    <p className="v3-label flex items-baseline gap-2.5 border-b border-current/12 pb-2.5 uppercase">
      <span style={{ color: ACCENT }}>{step}</span>
      <span className="opacity-65">{title}</span>
    </p>
  );
}

/** One course in the horizontal row. Selected plates invert to ink. */
function TrackChoice({
  selected,
  onSelect,
  track,
}: {
  selected: boolean;
  onSelect: () => void;
  track: BookingTrack;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex min-h-[6.75rem] flex-col justify-center gap-1 rounded-lg border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)]"
      style={{
        backgroundColor: selected ? INK : "transparent",
        color: selected ? PAPER : INK,
        borderColor: selected
          ? INK
          : "color-mix(in oklab, var(--v3-ink) 18%, transparent)",
      }}
    >
      <span className="font-[family-name:var(--font-editorial)] text-[2.025rem] leading-tight tracking-tight sm:text-[2.4rem]">
        {track.name}
      </span>
      <span className="v3-micro uppercase opacity-65">{track.note}</span>
    </button>
  );
}

/**
 * One tutor card: portrait, name, focus, and a sentence.
 *
 * The portrait sits beside the text rather than above it. Stacked, at three
 * cards across a 64rem row, a 4:5 portrait is over 400px tall and the panel
 * overruns the viewport by a third — on a page whose panels hide their
 * scrollbar, that puts the call to action below the fold with nothing to
 * suggest it is there. Beside the text the whole card is about 140px and the
 * face is still the first thing seen.
 *
 * The whole card is the control rather than a button tucked inside it — at this
 * size the portrait is the thing a visitor aims at, and a card that highlights
 * on hover but only responds on a small target underneath is the kind of near
 * miss that makes an interface feel broken.
 */
function TutorChoice({
  selected,
  onSelect,
  tutor,
}: {
  selected: boolean;
  onSelect: () => void;
  tutor: BookingTutor;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="group flex items-stretch gap-3 overflow-hidden rounded-lg border p-2.5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)] sm:gap-3.5 sm:p-3"
      style={{
        borderColor: selected
          ? ACCENT
          : "color-mix(in oklab, var(--v3-ink) 18%, transparent)",
        // The selected card lifts rather than inverting: inverting it would
        // swap the portrait's ground out from under it mid-choice.
        boxShadow: selected
          ? `0 0 0 2px ${ACCENT}, 0 18px 40px -22px rgba(0,0,0,0.5)`
          : "none",
      }}
    >
      <TutorPortrait
        image={tutor.image}
        initials={tutor.initials}
        name={tutor.name}
        className="w-[6.75rem] shrink-0 self-start rounded-md sm:w-[8.25rem]"
      />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-[family-name:var(--font-editorial)] text-[1.875rem] leading-tight tracking-tight sm:text-[2.175rem]">
            {tutor.name}
          </span>
          {/* The selected mark, matching the plates on the courses page. */}
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full transition-opacity"
            style={{
              backgroundColor: ACCENT,
              opacity: selected ? 1 : 0,
            }}
          />
        </span>
        <span className="v3-micro uppercase opacity-60">{tutor.focus}</span>

        <span className="mt-1.5 flex flex-col gap-1 border-t border-current/12 pt-1.5">
          {tutor.credentials.map((line) => (
            <span
              key={line}
              className="flex items-baseline gap-2 text-[1.425rem] leading-snug opacity-80"
            >
              <span
                aria-hidden
                className="mt-[0.4em] size-1 shrink-0 rounded-full"
                style={{ backgroundColor: ACCENT, opacity: 0.7 }}
              />
              {line}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

export function BookingPanel({ subject, heading, blurb, tracks, tutors }: Props) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [tutorIndex, setTutorIndex] = useState(0);

  // "No preference" is the last option but not a card: it has no portrait and no
  // person to describe, and a fourth tile holding a dash would read as a tutor
  // whose photo failed to load. A full-width bar under the row is unmistakably
  // the opt-out.
  const allTutors = [...tutors, ANY_TUTOR];
  const anyIndex = allTutors.length - 1;
  const track = tracks[trackIndex];
  const tutor = allTutors[tutorIndex];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-baseline justify-between gap-4 border-b border-current/20 pb-2.5">
        <h2 className="font-[family-name:var(--font-editorial)] text-[3.375rem] tracking-tight sm:text-[4.125rem]">
          {heading}
        </h2>
        <span className="v3-micro hidden shrink-0 uppercase opacity-50 sm:inline">
          Two choices, then send
        </span>
      </div>

      <p className="v3-body mt-2.5 max-w-2xl opacity-75">{blurb}</p>

      {/* ── 01 · Courses, horizontally ── */}
      <div className="mt-5">
        <StepHead step="01" title="Choose a course" />
        <div
          role="radiogroup"
          aria-label="Course"
          className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {tracks.map((t, i) => (
            <TrackChoice
              key={t.name}
              selected={i === trackIndex}
              onSelect={() => setTrackIndex(i)}
              track={t}
            />
          ))}
        </div>
      </div>

      {/* ── 02 · Tutors, as cards ── */}
      <div className="mt-5">
        <StepHead step="02" title="Choose a tutor" />
        <div role="radiogroup" aria-label="Tutor" className="mt-2.5">
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {tutors.map((t, i) => (
              <TutorChoice
                key={t.name}
                selected={i === tutorIndex}
                onSelect={() => setTutorIndex(i)}
                tutor={t}
              />
            ))}
          </div>

          <button
            type="button"
            role="radio"
            aria-checked={tutorIndex === anyIndex}
            onClick={() => setTutorIndex(anyIndex)}
            className="mt-2.5 flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)]"
            style={{
              borderColor:
                tutorIndex === anyIndex
                  ? ACCENT
                  : "color-mix(in oklab, var(--v3-ink) 18%, transparent)",
              boxShadow:
                tutorIndex === anyIndex ? `0 0 0 2px ${ACCENT}` : "none",
            }}
          >
            <span className="font-[family-name:var(--font-editorial)] text-[2.025rem] leading-tight tracking-tight">
              {ANY_TUTOR.name}
            </span>
            <span className="v3-micro uppercase opacity-60">
              {ANY_TUTOR.focus}
            </span>
          </button>
        </div>
      </div>

      {/* ── The ask ──
          A solid accent bar rather than a pill floating in whitespace: this is
          the one thing on the panel a visitor is meant to do, and it should not
          have to be found.

          Stuck to the bottom of the panel because the panel is a fixed viewport
          that hides its scrollbar: on a short window the tutor cards push this
          past the fold, and there would be no scrollbar to suggest anything was
          down there. Sticky, it is on screen from the moment the panel arrives
          regardless of window height. The bar is opaque, so the content
          scrolling under it stays legible.

          The selection is read back inside the bar, so what the button will send
          is never in doubt. Announced politely — it changes under the reader. */}
      <div
        className="sticky bottom-0 z-10 mt-5 flex flex-col items-stretch gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5"
        style={{ backgroundColor: ACCENT, color: PAPER }}
      >
        {/* The spaces are literal rather than margins: this is a live region,
            and JSX drops the whitespace between elements on separate lines, so
            margin-only spacing announces as "Timed writingwithSofia O.". */}
        <p aria-live="polite" className="min-w-0">
          <span className="v3-micro block uppercase opacity-70">
            You are requesting
          </span>
          <span className="mt-1 block font-[family-name:var(--font-editorial)] text-[2.25rem] leading-tight tracking-tight sm:text-[2.775rem]">
            {track.name}
            <span className="opacity-70">{" with "}</span>
            {tutor.name}
          </span>
        </p>

        <a
          href={enquiryHref(subject, track, tutor)}
          className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-lg px-7 py-4 text-center font-[family-name:var(--font-editorial)] text-[2.1rem] leading-none tracking-tight transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--v3-paper)] sm:text-[2.325rem]"
          style={{ backgroundColor: PAPER, color: INK }}
        >
          Request this session
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </a>
      </div>
    </div>
  );
}
