"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { TutorPortrait } from "./tutor-portrait";
import { DAYS, slotsFor } from "./availability";
import {
  SHOW_PRICING,
  TIER_BY_ID,
  TUTOR_TIER,
} from "../pricing";

/**
 * The booking panel — a subject page's second section, immediately after the
 * hero. Shared by all four subject pages.
 *
 * ─── Why it is a stepper ────────────────────────────────────────────────────
 * This was one surface carrying every choice at once, and it did not fit: it
 * needed 1051px of a 900px stage, so on a page whose panels cannot scroll past
 * their own height the call to action fell below the fold, the last tutor card
 * ran under the section rail, and its content was clipped mid-word.
 *
 * A stepper solves that structurally rather than by shrinking things. Only one
 * choice is ever rendered, so each gets the full width and large targets, and
 * the panel's height stops depending on how much there is to choose between.
 * The running summary is what pays for the loss of seeing everything at once.
 *
 * ─── Why it looks like a scheduling product ─────────────────────────────────
 * The card is deliberately not editorial: sans, soft radii, one blue, the
 * shape people already know from Calendly. It sits on the page's own paper or
 * ink rather than a white ground of its own, so it reads as a widget the page
 * contains rather than one pasted onto it. The section heading above it stays
 * in the page's voice.
 *
 * ─── Nothing here reserves anything ─────────────────────────────────────────
 * The days are weekday names, not dates, and the times are a fixed placeholder
 * grid — a real date implies a calendar, and none of this is connected to one.
 * The final action composes a prefilled enquiry, which is why it says "request"
 * throughout and states that nothing is held until the practice replies. Wire a
 * scheduling backend before this carries volume.
 *
 * Tutor names and tracks are PLACEHOLDER, as elsewhere on the marketing site.
 */

const FILL = "var(--v3-book-fill)";
const LINE = "var(--v3-book-line)";
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
  /** Three or four words. What they are the one to ask for. */
  focus: string;
  /** Path under /public once a photograph exists. */
  image?: string;
};

type Props = {
  /** Full subject name, used in the enquiry, e.g. "English Language Arts". */
  subject: string;
  heading: string;
  blurb: string;
  /** Step 01's label — "Choose an exam" reads better than "course" on /testing. */
  trackLabel?: string;
  tracks: BookingTrack[];
  tutors: BookingTutor[];
};

function enquiryHref(
  subject: string,
  track: BookingTrack,
  tutor: BookingTutor | null,
  day: string,
  time: string | null
) {
  const body = [
    "I'd like to request a session.",
    "",
    `Subject:   ${subject}`,
    `Course:    ${track.name}`,
    `Tutor:     ${tutor ? tutor.name : "No preference"}`,
    `Preferred: ${day}${time ? `, ${time}` : ""}`,
    "",
    "Student's name:",
    "Grade:",
    "Anything we should know:",
    "",
  ].join("\n");

  return `mailto:${ENQUIRY_TO}?subject=${encodeURIComponent(
    `Session request — ${subject}: ${track.name}`
  )}&body=${encodeURIComponent(body)}`;
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-current/12 py-2 last:border-b-0">
      {/* Literal space: the flex row is visual only, and without it a screen
          reader announces "CourseEssay & argument". */}
      <span className="text-[0.8rem] tracking-wide uppercase opacity-55">
        {label}
      </span>{" "}
      <span
        className={`text-right text-[0.95rem] font-medium ${
          value ? "" : "opacity-40"
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/** A large selectable tile, shared by the track and tutor steps. */
/**
 * A tutor's hourly rate, for the tile and the summary.
 *
 * Returns null when pricing is off or the tutor has no tier, so every caller
 * can render it unconditionally and reverting leaves no empty rows behind.
 */
function rateFor(name: string | undefined): number | null {
  if (!SHOW_PRICING || !name) return null;
  const tier = TUTOR_TIER[name];
  return tier ? TIER_BY_ID[tier].rate : null;
}

function Tile({
  selected,
  onSelect,
  title,
  note,
  meta,
  portrait,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  note: string;
  /** Right-aligned trailing detail — the rate, on the tutor step. */
  meta?: string;
  portrait?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-xl border border-current/15 p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      style={
        selected
          ? { borderColor: FILL, boxShadow: `0 0 0 1px ${FILL}` }
          : undefined
      }
    >
      {portrait}
      {/* The rate sits on the title's line rather than beside the whole block,
          so the note keeps the full width of the tile. Put it alongside the
          note instead and "Algebra through calculus" truncates to "Algebra
          thr…", which trades the more useful line for the shorter one. */}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[1.05rem] font-semibold tracking-tight">
            {title}
          </span>
          {/* Literal space: the flex row is visual only, and without it a
              screen reader announces "Maggie$225/hr". */}
          {meta ? (
            <>
              {" "}
              <span className="shrink-0 text-[0.9rem] font-semibold tabular-nums opacity-70">
                {meta}
              </span>
            </>
          ) : null}
        </span>
        <span className="block truncate text-[0.9rem] opacity-60">{note}</span>
      </span>
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-full border border-current/25"
        style={selected ? { backgroundColor: FILL, borderColor: FILL } : undefined}
      >
        {selected ? <Check className="size-3 text-white" /> : null}
      </span>
    </button>
  );
}

export function BookingPanel({
  subject,
  heading,
  blurb,
  trackLabel = "Choose a course",
  tracks,
  tutors,
}: Props) {
  // "Choose an exam" → "Exam". Stripping the verb leaves it lowercase, which
  // reads as a typo beside Tutor / Time / Confirm.
  const trackStep = trackLabel.replace(/^Choose an? /, "");
  const STEPS = [
    trackStep.charAt(0).toUpperCase() + trackStep.slice(1),
    "Tutor",
    "Time",
    "Checkout",
  ];

  const [step, setStep] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [tutor, setTutor] = useState<BookingTutor | null>(tutors[0] ?? null);
  const [day, setDay] = useState(DAYS[0]);
  const [time, setTime] = useState<string | null>(null);

  const track = tracks[trackIndex];
  const last = step === STEPS.length - 1;
  // Only the time step can be incomplete; the others start on a valid choice.
  const canAdvance = step !== 2 || time !== null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* The section keeps the page's voice; the card below it does not. */}
      <div className="flex items-baseline justify-between gap-4 border-b border-current/20 pb-2">
        <h2 className="font-[family-name:var(--font-editorial)] text-[2.3rem] tracking-tight sm:text-[2.8rem]">
          {heading}
        </h2>
        <span className="v3-micro hidden shrink-0 uppercase opacity-50 sm:inline">
          Four steps to checkout
        </span>
      </div>
      <p className="v3-body mt-2 max-w-2xl opacity-75">{blurb}</p>

      {/* ── The widget ── */}
      <div
        className="mt-4 overflow-hidden rounded-2xl border border-current/15"
        style={{ backgroundColor: "var(--v3-card)" }}
      >
        {/* Progress */}
        <div className="border-b border-current/12 px-4 py-3 sm:px-5">
          <ol className="flex items-center gap-2">
            {STEPS.map((name, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={name} className="flex flex-1 items-center gap-2">
                  <span
                    aria-current={current ? "step" : undefined}
                    className="grid size-6 shrink-0 place-items-center rounded-full border border-current/25 text-[0.75rem] font-semibold"
                    style={
                      done || current
                        ? { backgroundColor: FILL, borderColor: FILL, color: "#fff" }
                        : undefined
                    }
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-[0.85rem] font-medium sm:inline ${
                      current ? "" : "opacity-55"
                    }`}
                  >
                    {name}
                  </span>
                  {i < STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className="h-px flex-1 bg-current/15"
                      style={done ? { backgroundColor: FILL } : undefined}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid sm:grid-cols-[1fr_13rem]">
          {/* Current step */}
          <div className="min-h-[13.5rem] p-4 sm:p-5">
            {step === 0 ? (
              <div role="radiogroup" aria-label={trackLabel} className="grid gap-2 sm:grid-cols-2">
                {tracks.map((t, i) => (
                  <Tile
                    key={t.name}
                    selected={i === trackIndex}
                    onSelect={() => setTrackIndex(i)}
                    title={t.name}
                    note={t.note}
                  />
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div role="radiogroup" aria-label="Tutor" className="grid gap-2 sm:grid-cols-2">
                {tutors.map((t) => (
                  <Tile
                    key={t.name}
                    selected={t.name === tutor?.name}
                    onSelect={() => setTutor(t)}
                    title={t.name}
                    note={t.focus}
                    // The rate belongs on this step because this is the step
                    // where it is a decision — the tiers exist so a family can
                    // choose, and they cannot choose against a number they have
                    // to leave the panel to find.
                    meta={
                      rateFor(t.name) ? `$${rateFor(t.name)}/hr` : undefined
                    }
                    portrait={
                      <TutorPortrait
                        image={t.image}
                        initials={t.initials}
                        name={t.name}
                        className="aspect-square w-[2.75rem] shrink-0 rounded-full"
                      />
                    }
                  />
                ))}
                <Tile
                  selected={tutor === null}
                  onSelect={() => setTutor(null)}
                  title="No preference"
                  note="Matched to the student"
                />
              </div>
            ) : null}

            {step === 2 ? (
              <>
                <p className="text-[0.9rem] opacity-60">
                  Indicative weekly availability — we confirm the exact date by
                  email.
                </p>
                <div role="tablist" aria-label="Day" className="mt-3 flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const selected = d === day;
                    return (
                      <button
                        key={d}
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                          setDay(d);
                          setTime(null);
                        }}
                        className="rounded-lg border border-current/20 px-3 py-1.5 text-[0.9rem] font-medium transition-colors"
                        style={
                          selected
                            ? { backgroundColor: FILL, borderColor: FILL, color: "#fff" }
                            : undefined
                        }
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slotsFor(day).map(({ time: t, available }) => {
                    const selected = t === time;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={!available}
                        onClick={() => setTime(t)}
                        aria-pressed={selected}
                        className="rounded-lg border border-current/20 py-2 text-[0.9rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                        style={
                          selected
                            ? { backgroundColor: FILL, borderColor: FILL, color: "#fff" }
                            : available
                              ? { borderColor: LINE, color: LINE }
                              : undefined
                        }
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                {/* The button says Checkout; this says what actually happens.
                    No card is taken and no slot is held — the action still
                    composes an enquiry — and a visitor who reads "Checkout"
                    and expects a payment screen has to be told so here rather
                    than discovering it when their mail client opens. Replace
                    this line at the same time as the mailto, not before. */}
                <p className="text-[0.9rem] opacity-60">
                  No payment is taken here. This opens an email with your
                  session details so we can confirm the time with you.
                </p>
                <div className="mt-3 rounded-xl border border-current/15 p-4">
                  <p className="text-[1.3rem] font-semibold tracking-tight">
                    {track.name}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[0.95rem] opacity-70">
                    <li className="flex items-center gap-2.5">
                      <Clock aria-hidden className="size-4 shrink-0" />
                      {day}
                      {time ? `, ${time}` : ""}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check aria-hidden className="size-4 shrink-0" />
                      {tutor ? tutor.name : "No preference"}
                    </li>
                  </ul>

                  {/* A step called Checkout with no number on it reads as a
                      bait-and-switch. The rate, not a total: a total depends on
                      whether the family is on a membership, and that is not
                      decided in this panel. */}
                  {rateFor(tutor?.name) ? (
                    <p className="mt-3 border-t border-current/12 pt-3 text-[0.95rem]">
                      <span className="font-semibold">
                        ${rateFor(tutor?.name)}
                      </span>
                      <span className="opacity-60">
                        {" "}
                        per hour, online. Memberships are cheaper per session
                        —{" "}
                      </span>
                      <Link
                        href="/pricing"
                        className="underline decoration-current/30 underline-offset-4 opacity-60 transition-opacity hover:opacity-100"
                      >
                        see pricing
                      </Link>
                      <span className="opacity-60">.</span>
                    </p>
                  ) : null}
                </div>
                <a
                  href={enquiryHref(subject, track, tutor, day, time)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[1rem] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                  style={{ backgroundColor: FILL }}
                >
                  Checkout
                  <ArrowRight aria-hidden className="size-4" />
                </a>
              </>
            ) : null}
          </div>

          {/* Running summary */}
          <aside className="border-t border-current/12 bg-current/[0.03] p-4 sm:border-t-0 sm:border-l">
            <p className="text-[0.8rem] font-semibold tracking-wide uppercase opacity-70">
              Your session
            </p>
            <div className="mt-2">
              <SummaryRow label="Course" value={track.name} />
              <SummaryRow label="Tutor" value={tutor ? tutor.name : "No preference"} />
              <SummaryRow label="Time" value={time ? `${day}, ${time}` : null} />
              {SHOW_PRICING ? (
                <SummaryRow
                  label="Rate"
                  value={
                    rateFor(tutor?.name)
                      ? `$${rateFor(tutor?.name)}/hr`
                      : // "No preference" is a real choice here, and the honest
                        // answer to what it costs is that it depends who we
                        // match — not a number.
                        "Depends on tutor"
                  }
                />
              ) : null}
            </div>
            <Link
              href="/tutors"
              className="mt-3 inline-block text-[0.8rem] uppercase underline decoration-current/30 underline-offset-4 opacity-55 transition-opacity hover:opacity-100"
            >
              Tutor profiles &rarr;
            </Link>
          </aside>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-current/12 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-4 py-2 text-[0.9rem] font-medium transition-colors disabled:opacity-30"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back
          </button>

          {!last ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-[0.9rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: FILL }}
            >
              Continue
              <ArrowRight aria-hidden className="size-4" />
            </button>
          ) : (
            <span className="text-[0.8rem] opacity-55">
              Nothing is reserved until we reply.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
