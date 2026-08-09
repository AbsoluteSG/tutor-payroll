"use client";

import { useState } from "react";
import { INK, PAPER, ACCENT } from "./subject-page";

/**
 * The booking panel — a subject page's second section, immediately after the
 * hero.
 *
 * The subject pages used to hold their only call to action at the very end, six
 * sections down a sequence with no scrollbar, so a visitor who stopped reading
 * partway never saw one at all. This puts the ask second: pick a specific course
 * within the subject, pick a tutor, send.
 *
 * The selection composes a prefilled enquiry rather than writing a booking,
 * which matches every other action on the marketing site. It means the enquiry
 * that arrives already names the course and the tutor instead of being a blank
 * "interested in tutoring" — but a real scheduling endpoint should replace the
 * mailto before this carries any volume.
 *
 * Tutor names and course tracks are PLACEHOLDER, like the rest of the /v3 copy.
 */

const ENQUIRY_TO = "hello@boroughprep.com";

export type BookingTrack = {
  /** Short label for the specific course, e.g. "Essay & argument". */
  name: string;
  /** Right-hand qualifier, e.g. "Grades 6–12". */
  note: string;
};

export type BookingTutor = {
  /** Rendered in the initials chip. */
  initials: string;
  name: string;
  focus: string;
};

/** Always offered, so a visitor without a preference is never stuck. */
const ANY_TUTOR: BookingTutor = {
  initials: "—",
  name: "No preference",
  focus: "Matched to the student",
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

/** One selectable row. Selected rows invert to ink, like a chosen plate. */
function Choice({
  selected,
  onSelect,
  label,
  meta,
  lead,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  meta: string;
  /** Optional initials chip, for tutors. */
  lead?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-md border px-3 py-1.5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)]"
      style={{
        backgroundColor: selected ? INK : "transparent",
        color: selected ? PAPER : INK,
        borderColor: selected
          ? INK
          : "color-mix(in oklab, var(--v3-ink) 16%, transparent)",
      }}
    >
      {lead ? (
        // currentColor, so the chip reads against the row it is in without
        // needing to know whether that row is selected or which theme is on.
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-current/12 font-mono text-[0.55rem] tracking-[0.06em]"
        >
          {lead}
        </span>
      ) : null}

      <span className="min-w-0 flex-1 font-[family-name:var(--font-editorial)] text-[1.1rem] leading-tight tracking-tight">
        {label}
      </span>

      <span className="shrink-0 font-mono text-[0.48rem] tracking-[0.12em] uppercase opacity-60">
        {meta}
      </span>
    </button>
  );
}

function Column({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-baseline gap-2 border-b border-current/12 pb-2 font-mono text-[0.52rem] tracking-[0.2em] uppercase">
        <span style={{ color: ACCENT }}>{step}</span>
        <span className="opacity-55">{title}</span>
      </p>
      <div className="mt-3 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function BookingPanel({ subject, heading, blurb, tracks, tutors }: Props) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [tutorIndex, setTutorIndex] = useState(0);

  const allTutors = [...tutors, ANY_TUTOR];
  const track = tracks[trackIndex];
  const tutor = allTutors[tutorIndex];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-baseline justify-between border-b border-current/20 pb-4">
        <h2 className="font-[family-name:var(--font-editorial)] text-3xl tracking-tight sm:text-4xl">
          {heading}
        </h2>
        <span className="hidden font-mono text-[0.58rem] tracking-[0.2em] uppercase opacity-45 sm:inline">
          Book a session
        </span>
      </div>

      <p className="mt-3 max-w-xl text-[0.92rem] leading-relaxed opacity-70">
        {blurb}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-10">
        <Column step="01" title="Choose a course">
          <div role="radiogroup" aria-label="Course" className="contents">
            {tracks.map((t, i) => (
              <Choice
                key={t.name}
                selected={i === trackIndex}
                onSelect={() => setTrackIndex(i)}
                label={t.name}
                meta={t.note}
              />
            ))}
          </div>
        </Column>

        <Column step="02" title="Choose a tutor">
          <div role="radiogroup" aria-label="Tutor" className="contents">
            {allTutors.map((t, i) => (
              <Choice
                key={t.name}
                selected={i === tutorIndex}
                onSelect={() => setTutorIndex(i)}
                label={t.name}
                meta={t.focus}
                lead={t.initials}
              />
            ))}
          </div>
        </Column>
      </div>

      {/* The selection read back in words, so what the button will send is
          never in doubt. Announced politely — it changes under the reader. */}
      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-current/12 pt-4 sm:flex-row sm:items-center">
        {/* The spaces are literal rather than margins: this is a live region,
            and JSX drops the whitespace between elements on separate lines, so
            margin-only spacing announces as "Timed writingwithSofia O.".
            Nested opacity does not brighten — only the connectives are dimmed,
            which is what puts the emphasis on the two values. */}
        <p
          aria-live="polite"
          className="font-mono text-[0.55rem] leading-relaxed tracking-[0.12em] uppercase opacity-60"
        >
          Requesting
          <span className="opacity-45">{" / "}</span>
          {track.name}
          <span className="opacity-45">{" with "}</span>
          {tutor.name}
        </p>

        <a
          href={enquiryHref(subject, track, tutor)}
          className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase"
          style={{ backgroundColor: ACCENT, color: PAPER }}
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
