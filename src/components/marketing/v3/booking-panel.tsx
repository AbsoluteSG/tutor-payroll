"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2 } from "lucide-react";
import { TutorPortrait } from "./tutor-portrait";
import { TrackMark, type TrackMarkKind } from "./track-marks";
import { EnquiryForm } from "./enquiry-form";
import { SHOW_PRICING } from "../pricing";
import type { BookableTutor } from "@/lib/booking/tutors";
import { BUSINESS_TZ, browserTimeZone, formatInstant } from "@/lib/time-zone";

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
 * contains rather than one pasted onto it.
 *
 * ─── Except step one, which is still browsing ───────────────────────────────
 * The first step is the exception, and deliberately so. By the time somebody is
 * picking a tutor and a time they have decided to buy, and the scheduling-widget
 * language is right. But the first step is met before any of that: it is where a
 * visitor finds out what is on offer at all, which is the same job the course
 * gallery does one page earlier. So it borrows that page's plates — one per
 * option, big enough to read at a glance, selected by taking the opposite skin —
 * minus the fan, because these are choices inside one course rather than four
 * courses being compared. The running summary is also withheld until then: a
 * tutor and a rate are not yet decisions, and quoting them next to the very
 * first question answers something nobody has asked.
 *
 * ─── This now reserves real time and takes real money ───────────────────────
 * The times come from /api/booking/slots, which is the tutor's own availability
 * minus everything already on their calendar. Choosing a start and a number of
 * weeks holds those exact slots in the database, and Checkout is Stripe. The
 * panel therefore says "book" rather than "request", and the confirmation
 * language is about payment rather than about somebody replying.
 *
 * A tutor only appears as bookable if a manager has given them a slug, a tier
 * and a pay rate — see lib/booking/tutors.ts. Anyone else (and "no preference")
 * routes to the enquiry form instead, because a booking with no tutor cannot
 * create the rate card the tutor needs to log the class afterwards.
 */

const FILL = "var(--v3-book-fill)";
const LINE = "var(--v3-book-line)";

/** The page palette, for the step-one plates. Same tokens the gallery draws on. */
const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";
const CARD = "var(--v3-card)";

/** The subject hues, shared with the course gallery so a course keeps its colour. */
export type BookingHue = "orange" | "purple" | "blue" | "green";

/** How many weeks a parent can buy in one go. Matches MAX_SESSIONS server-side. */
const SESSION_OPTIONS = [1, 2, 4, 6, 8];

export type BookingTrack = {
  /** Short label for the specific course, e.g. "Essay & argument". */
  name: string;
  /** Right-hand qualifier, e.g. "Grades 6–12". */
  note: string;
  /** The plate's drawing — see track-marks.tsx. */
  mark?: TrackMarkKind;
};

export type BookingTutor = {
  /** Joins this roster entry to its User row. */
  slug: string;
  /** Rendered as the placeholder portrait's monogram. */
  initials: string;
  name: string;
  /** Three or four words. What they are the one to ask for. */
  focus: string;
  /** Path under /public once a photograph exists. */
  image?: string;
  /** One paragraph. The full biography stays on /tutors. */
  blurb?: string;
  /** At most three. Chips on the card. */
  specialties?: string[];
  /** Their headline credential — the thing a parent is actually scanning for. */
  education?: string;
  /** Grade range, where they gave one. */
  levels?: string;
};

type Props = {
  /** Full subject name, e.g. "English Language Arts". */
  subject: string;
  heading: string;
  blurb: string;
  /** Step 01's label — "Choose an exam" reads better than "course" on /testing. */
  trackLabel?: string;
  tracks: BookingTrack[];
  tutors: BookingTutor[];
  /**
   * Who is actually bookable, from the database. Merged with `tutors` by slug:
   * the roster supplies the photograph and the focus line, this supplies the
   * price and the ability to transact.
   */
  bookable?: BookableTutor[];
  /**
   * The subject's hue from the course gallery, carried onto the step-one plates
   * so a course keeps the colour it was picked by. Falls back to the accent.
   */
  hue?: BookingHue;
  fontClass?: string;
};

type SlotResponse = {
  slots: string[];
  price: number;
  tutor: { timeZone: string };
};

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

/**
 * A track drawn as a plate, in the course gallery's language.
 *
 * The drawing is per track rather than per subject — a balance for the first
 * equation, a bracketed clause for close reading — because four plates carrying
 * one subject's mark four times would say nothing about which is which. See
 * track-marks.tsx. Without one it falls back to a halftone wash, so a track
 * added later still gets a plate rather than an empty card.
 */
function TrackPlate({
  code,
  selected,
  onSelect,
  title,
  note,
  hue,
  mark,
}: {
  code: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  note: string;
  hue: string;
  mark?: TrackMarkKind;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      // A selected plate takes the opposite skin rather than having its colours
      // swapped by hand, so every token inside it — the hue included — resolves
      // against the ink it has become. Same mechanism as the gallery.
      className={`${
        selected ? "v3-invert" : ""
      // Height in viewport units rather than an aspect ratio. The panel cannot
      // grow past the viewport, so what is actually scarce here is vertical
      // room, and sizing from the plate's own width ignores that — it made the
      // plates tallest on exactly the wide, short windows with the least room
      // to give. This way they are as large as the stage allows and shrink when
      // it is short, which is also what keeps the Continue button on screen.
      } flex h-[clamp(10rem,34svh,22rem)] cursor-pointer flex-col justify-between overflow-hidden rounded-[0.7rem] p-4 text-left transition-[transform,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)] sm:p-5`}
      style={{
        backgroundColor: selected
          ? PAPER
          : `color-mix(in oklab, ${hue} 5%, ${CARD})`,
        color: INK,
        // Shadows stay black in both themes: a plate lifted off a dark ground
        // still casts a shadow, and tinting it with the ink would make it glow.
        boxShadow: selected
          ? "0 22px 48px -18px rgba(0,0,0,0.5)"
          : "0 10px 26px -18px rgba(0,0,0,0.4)",
        outline: `1px solid ${
          selected
            ? "transparent"
            : "color-mix(in oklab, var(--v3-ink) 12%, transparent)"
        }`,
        transform: selected ? "translateY(-0.3rem)" : undefined,
      }}
    >
      <span className="flex items-start justify-between font-mono text-[0.72rem] tracking-[0.16em] uppercase sm:text-[0.85rem]">
        <span style={{ color: hue }}>{code}</span>
        <span
          aria-hidden
          className="size-2 rounded-full transition-opacity duration-300 sm:size-2.5"
          style={{ backgroundColor: hue, opacity: selected ? 1 : 0 }}
        />
      </span>

      {/* The mark is drawn in currentColor, so it inverts with the plate on
          selection without being told which state it is in — same as the
          gallery's. It is deliberately not given the hue: on a selected plate
          the ground has become the ink, and the hue was chosen to read against
          the page rather than against that. */}
      {mark ? (
        <TrackMark kind={mark} className="my-2 h-9 w-full opacity-90 sm:h-14" />
      ) : (
        <span
          aria-hidden
          className="my-2 block h-9 w-full sm:h-14"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "7px 7px",
            opacity: 0.16,
            maskImage: "linear-gradient(to bottom, #000 5%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 5%, transparent 100%)",
          }}
        />
      )}

      <span className="block">
        {/* A step below the gallery's own plates, which get a column of the
            viewport each. The longest track names ("Pre-algebra & Algebra I")
            wrap to two lines here rather than overrunning. */}
        <span className="block font-[family-name:var(--font-editorial)] text-[1.35rem] leading-[1.05] tracking-tight sm:text-[1.8rem] lg:text-[2.1rem]">
          {title}
        </span>
        <span className="mt-2 block font-mono text-[0.68rem] leading-snug tracking-[0.1em] uppercase opacity-60 sm:text-[0.8rem]">
          {note}
        </span>
      </span>
    </button>
  );
}

/**
 * A tutor as a plate, in the same language as the track plates on step one.
 *
 * Deliberately more than a name and a rate. By this point a family has decided
 * what they want taught and is choosing WHO — which is the only step where they
 * are picking a person rather than an option, and the one where a card that
 * says "Jared · $225/hr" gives them nothing to choose on. So the photograph
 * leads, and the credential, the specialisms and a paragraph in the tutor's own
 * words are all on the card. The full profile stays on /tutors for anyone who
 * wants to read further.
 */
function TutorPlate({
  tutor,
  rate,
  selected,
  onSelect,
  hue,
}: {
  tutor: BookingTutor;
  rate?: string;
  selected: boolean;
  onSelect: () => void;
  hue: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      // Same selection mechanism as the track plates: take the opposite skin
      // rather than swapping colours by hand, so every token inside — the hue
      // included — resolves against the ground it has become.
      className={`${
        selected ? "v3-invert" : ""
      } flex cursor-pointer flex-col overflow-hidden rounded-[0.7rem] text-left transition-[transform,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)]`}
      style={{
        backgroundColor: selected
          ? PAPER
          : `color-mix(in oklab, ${hue} 5%, ${CARD})`,
        color: INK,
        boxShadow: selected
          ? "0 22px 48px -18px rgba(0,0,0,0.5)"
          : "0 10px 26px -18px rgba(0,0,0,0.4)",
        outline: `1px solid ${
          selected
            ? "transparent"
            : "color-mix(in oklab, var(--v3-ink) 12%, transparent)"
        }`,
        transform: selected ? "translateY(-0.3rem)" : undefined,
      }}
    >
      {/* The photograph, full bleed across the top. A tutor without one gets
          the monogram plate rather than a substitute face.

          An explicit height, not an aspect: TutorPortrait sets aspect-ratio 4/5
          inline, and at a third of this row that is a 480px portrait — the card
          then runs past the bottom of a stage that cannot scroll, taking the
          Continue button with it. Width and height both being definite is what
          makes the browser ignore the ratio and crop instead. Viewport units so
          it gives way on a short window, as the track plates do. */}
      <span className="relative block w-full overflow-hidden">
        <TutorPortrait
          image={tutor.image}
          initials={tutor.initials}
          name={tutor.name}
          className="h-[clamp(8rem,20svh,13rem)] w-full"
        />
        {rate ? (
          <span
            className="absolute right-2 bottom-2 rounded-full px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em] tabular-nums"
            style={{ backgroundColor: hue, color: PAPER }}
          >
            {rate}
          </span>
        ) : null}
      </span>

      <span className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <span className="block">
          <span className="block font-[family-name:var(--font-editorial)] text-[1.4rem] leading-none tracking-tight sm:text-[1.7rem]">
            {tutor.name}
          </span>
          <span className="mt-1.5 block font-mono text-[0.62rem] leading-snug tracking-[0.08em] uppercase opacity-65">
            {tutor.focus}
          </span>
        </span>

        {tutor.education ? (
          <span className="block text-[0.78rem] leading-snug opacity-70">
            {tutor.education}
          </span>
        ) : null}

        {tutor.blurb ? (
          // Clamped: the cards sit in a row and must stay the same height, and
          // a family choosing between people is scanning rather than reading.
          <span className="line-clamp-3 block text-[0.82rem] leading-relaxed opacity-70">
            {tutor.blurb}
          </span>
        ) : null}

        {tutor.specialties && tutor.specialties.length > 0 ? (
          <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {tutor.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full border border-current/25 px-2 py-0.5 font-mono text-[0.55rem] tracking-[0.08em] uppercase opacity-80"
              >
                {s}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** "Match me" — the same plate shape, without a person on it. */
function NoPreferencePlate({
  selected,
  onSelect,
  hue,
}: {
  selected: boolean;
  onSelect: () => void;
  hue: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`${
        selected ? "v3-invert" : ""
      } flex cursor-pointer flex-col items-start justify-end gap-2 rounded-[0.7rem] border-2 border-dashed p-3.5 text-left transition-[transform,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)] sm:p-4`}
      style={{
        backgroundColor: selected ? PAPER : "transparent",
        borderColor: `color-mix(in oklab, var(--v3-ink) 25%, transparent)`,
        color: INK,
        transform: selected ? "translateY(-0.3rem)" : undefined,
      }}
    >
      <span
        aria-hidden
        className="font-[family-name:var(--font-editorial)] text-[2.4rem] leading-none opacity-30"
        style={{ color: hue }}
      >
        ?
      </span>
      <span className="block font-[family-name:var(--font-editorial)] text-[1.4rem] leading-none tracking-tight sm:text-[1.7rem]">
        No preference
      </span>
      <span className="block text-[0.82rem] leading-relaxed opacity-70">
        Tell us about your student and we&apos;ll match them to the tutor who
        fits — we&apos;ll come back to you rather than booking a time now.
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
  bookable = [],
  hue,
  fontClass,
}: Props) {
  const plateHue = hue ? `var(--v3-hue-${hue})` : "var(--v3-accent)";
  // "Choose an exam" → "Exam". Stripping the verb leaves it lowercase, which
  // reads as a typo beside Tutor / Time / Checkout.
  const trackStep = trackLabel.replace(/^Choose an? /, "");
  const STEPS = [
    trackStep.charAt(0).toUpperCase() + trackStep.slice(1),
    "Tutor",
    "Time",
    "Checkout",
  ];

  const bySlug = new Map(bookable.map((b) => [b.slug, b]));

  const [step, setStep] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [tutor, setTutor] = useState<BookingTutor | null>(tutors[0] ?? null);
  const [sessionCount, setSessionCount] = useState(1);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const [form, setForm] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    studentName: "",
    studentGrade: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = tracks[trackIndex];
  const last = step === STEPS.length - 1;
  const live = tutor ? bySlug.get(tutor.slug) : undefined;

  // Times are quoted in the business zone with the visitor's own alongside when
  // they differ — a parent in California booking a Brooklyn studio should not
  // have to do the arithmetic.
  // Starts on the business zone so the server and the first client render
  // agree; the browser's own zone lands a tick later, from a timer rather than
  // straight out of the effect body.
  const [viewerTz, setViewerTz] = useState(BUSINESS_TZ);
  useEffect(() => {
    const id = setTimeout(() => setViewerTz(browserTimeZone()), 0);
    return () => clearTimeout(id);
  }, []);

  // Real availability, refetched whenever the tutor changes.
  //
  // Keyed on the slug rather than the tutor object: `bySlug` is rebuilt every
  // render, and depending on a value derived from it would refetch on every
  // keystroke in the checkout form.
  const liveSlug = live?.slug;
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!liveSlug) {
        setSlots([]);
        setPrice(null);
        return;
      }
      setSlotsLoading(true);
      setChosen(null);
      try {
        const res = await fetch(
          `/api/booking/slots?tutor=${encodeURIComponent(liveSlug)}&duration=60`
        );
        const data = res.ok ? ((await res.json()) as SlotResponse) : null;
        if (cancelled) return;
        setSlots(data?.slots ?? []);
        setPrice(data?.price ?? null);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    const id = setTimeout(() => void load(), 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [liveSlug]);

  const canAdvance =
    step !== 2 || (chosen !== null && live !== undefined);

  const total = price != null ? price * sessionCount : null;

  const submit = useCallback(async () => {
    if (!live || !chosen || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorSlug: live.slug,
          firstStartsAt: chosen,
          sessionCount,
          durationMinutes: 60,
          subject,
          track: track.name,
          timeZone: viewerTz,
          ...form,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        message?: string;
      } | null;

      if (!res.ok || !data?.url) {
        setError(data?.message ?? "We couldn't start that booking.");
        // A 409 means the grid is stale — pull it again so the parent is not
        // staring at times that no longer exist.
        if (res.status === 409 && live) {
          const refreshed = await fetch(
            `/api/booking/slots?tutor=${encodeURIComponent(live.slug)}&duration=60`
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
          setSlots((refreshed as SlotResponse | null)?.slots ?? []);
          setChosen(null);
          setStep(2);
        }
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("We couldn't reach the payment page. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }, [live, chosen, submitting, sessionCount, subject, track, viewerTz, form]);

  return (
    <div
      className="mx-auto max-w-6xl"
      // Hold the page still from the moment a visitor commits to booking.
      //
      // The subject pages are a fixed sequence driven by wheel and touch, so
      // without this a scroll part-way through checkout slides the stage on to
      // the next section and takes a half-filled form with it. Step one is
      // exempt: nothing has been entered yet, and somebody still browsing the
      // exams should be able to scroll past them.
      //
      // Only wheel, touch and keys are suppressed — see use-virtual-scroll.ts.
      // The section rail, the scroll cue and Back all still work, so this can
      // hold the page without ever trapping anyone on it.
      {...(step > 0 ? { "data-sequence-lock": "booking" } : {})}
    >
      {/* The section keeps the page's voice; the card below it does not. */}
      <div className="flex items-baseline justify-between gap-4 border-b border-current/20 pb-2">
        <h2 className="font-[family-name:var(--font-editorial)] text-[2.3rem] tracking-tight sm:text-[2.8rem]">
          {heading}
        </h2>
        <span className="v3-micro hidden shrink-0 uppercase opacity-50 sm:inline">
          Four steps to checkout
        </span>
      </div>
      {/* max-w-3xl, not 2xl: at the site's body size the longer blurbs
          (Mathematics', Computer Science's) wrapped to four lines and cost
          200px of a panel that cannot grow, which is more than the plates
          below them. One line wider is still a sane measure. */}
      <p className="v3-body mt-2 max-w-3xl opacity-75">{blurb}</p>

      {/* ── Step one: the exam gallery ──
          Deliberately not inside the widget below. This step is still browsing:
          it is where a visitor finds out what is on offer, which is the job the
          course gallery does one page earlier — so it borrows that page's
          plates outright, full width and side by side. Boxed inside a bordered
          card with a progress strip above them they read as four radio buttons
          in a form, which is the one thing they are not. The widget takes over
          from step two, where the decisions really are transactional. */}
      {step === 0 ? (
        <div className="mt-7">
          <div
            role="radiogroup"
            aria-label={trackLabel}
            // Two up on a phone: four across would put each plate under 5rem,
            // narrower than the shortest track name.
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            {tracks.map((t, i) => (
              <TrackPlate
                key={t.name}
                code={String(i + 1).padStart(2, "0")}
                selected={i === trackIndex}
                onSelect={() => setTrackIndex(i)}
                title={t.name}
                note={t.note}
                mark={t.mark}
                hue={plateHue}
              />
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="v3-micro font-mono uppercase opacity-55">
              Step 01 / 04 &mdash; {STEPS[0]}
            </p>
            {/* Filled with the course's own hue, exactly as the gallery's
                booking buttons are, rather than the widget's blue — there is no
                widget on screen yet for it to belong to. */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="v3-label group inline-flex items-center gap-2.5 rounded-full px-7 py-4 font-mono uppercase transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)]"
              style={{ backgroundColor: plateHue, color: PAPER }}
            >
              Continue
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </button>
          </div>
        </div>
      ) : step === 1 ? (
        /* ── Step two: the tutors, on the same stage as the tracks ──
           Also outside the widget. Choosing a person is still browsing, and it
           is the step with the most to say — a photograph, a credential and a
           paragraph do not fit a 13rem tile beside a summary column. The widget
           takes over at step three, where picking a time really is form-filling. */
        <div className="mt-7">
          <div
            role="radiogroup"
            aria-label="Tutor"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >
            {tutors.map((t) => {
              const b = bySlug.get(t.slug);
              return (
                <TutorPlate
                  key={t.slug}
                  tutor={t}
                  // The rate belongs on this step because this is the step where
                  // it is a decision — the tiers exist so a family can choose,
                  // and they cannot choose against a number they have to leave
                  // the panel to find.
                  rate={SHOW_PRICING && b ? `$${b.hourlyRate}/hr` : undefined}
                  selected={t.slug === tutor?.slug}
                  onSelect={() => setTutor(t)}
                  hue={plateHue}
                />
              );
            })}
            <NoPreferencePlate
              selected={tutor === null}
              onSelect={() => setTutor(null)}
              hue={plateHue}
            />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="v3-micro font-mono uppercase opacity-55">
              Step 02 / 04 &mdash; {STEPS[1]}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="v3-label inline-flex items-center gap-2.5 rounded-full border border-current/25 px-7 py-4 font-mono uppercase transition-colors hover:border-current/60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="v3-label group inline-flex items-center gap-2.5 rounded-full px-7 py-4 font-mono uppercase transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)]"
                style={{ backgroundColor: plateHue, color: PAPER }}
              >
                Continue
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
      /* ── The widget, from step two on ── */
      <div
        className="mx-auto mt-3 max-w-5xl overflow-hidden rounded-2xl border border-current/15"
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
          {/* Current step. The min-height keeps the shorter ones from
              collapsing as the reader moves between them. */}
          <div className="min-h-[13.5rem] p-4 sm:p-5">
            {step === 2 ? (
              <>
                {!live ? (
                  // Either "no preference", or a tutor a manager has not made
                  // bookable. Both are honest dead ends for checkout: without a
                  // specific tutor there is no rate card to create, so the
                  // booking could not be provisioned. Hand off to a person.
                  <div className="grid gap-3">
                    <p className="text-[0.95rem] opacity-70">
                      {tutor
                        ? `${tutor.name} isn't taking online bookings at the moment.`
                        : "Pick a tutor to see real times, or let us match you."}
                    </p>
                    <EnquiryForm
                      fontClass={fontClass}
                      context={{
                        subject: `${subject} — ${track.name}`,
                        tutorSlug: tutor?.slug,
                        intro:
                          "Tell us what your student needs and when suits, and we'll call you back to arrange it.",
                      }}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[1rem] font-semibold text-white sm:w-auto"
                          style={{ backgroundColor: FILL }}
                        >
                          Ask us to match you
                          <ArrowRight aria-hidden className="size-4" />
                        </button>
                      }
                    />
                  </div>
                ) : slotsLoading ? (
                  <p className="flex items-center gap-2 text-[0.9rem] opacity-60">
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Finding {tutor?.name}&rsquo;s open times…
                  </p>
                ) : slots.length === 0 ? (
                  <div className="grid gap-3">
                    <p className="text-[0.95rem] opacity-70">
                      {tutor?.name} has nothing free in the next few weeks.
                    </p>
                    <EnquiryForm
                      fontClass={fontClass}
                      context={{
                        subject: `${subject} — ${track.name}`,
                        tutorSlug: tutor?.slug,
                      }}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[1rem] font-semibold text-white sm:w-auto"
                          style={{ backgroundColor: FILL }}
                        >
                          Ask about other times
                          <ArrowRight aria-hidden className="size-4" />
                        </button>
                      }
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-[0.9rem] opacity-60">
                      Real openings, at least a day ahead. Times in{" "}
                      {BUSINESS_TZ.split("/")[1]?.replace("_", " ")}
                      {viewerTz !== BUSINESS_TZ ? " and yours" : ""}.
                    </p>

                    <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {slots.slice(0, 40).map((iso) => {
                        const selected = iso === chosen;
                        const when = new Date(iso);
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => setChosen(iso)}
                            aria-pressed={selected}
                            className="rounded-lg border border-current/20 px-3 py-2 text-left text-[0.9rem] transition-colors"
                            style={
                              selected
                                ? { backgroundColor: FILL, borderColor: FILL, color: "#fff" }
                                : { borderColor: LINE }
                            }
                          >
                            <span className="block font-semibold">
                              {formatInstant(when, BUSINESS_TZ)}
                            </span>
                            {viewerTz !== BUSINESS_TZ && (
                              <span className="block text-[0.78rem] opacity-70">
                                {formatInstant(when, viewerTz)} your time
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Multi-session. Buying a block is the normal case in
                        tutoring — one lesson rarely moves anything — so the
                        choice sits next to the time rather than behind it. */}
                    <div className="mt-4 border-t border-current/12 pt-3">
                      <p className="text-[0.85rem] font-medium">
                        How many weeks? Same day and time each week.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SESSION_OPTIONS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSessionCount(n)}
                            aria-pressed={n === sessionCount}
                            className="rounded-lg border border-current/20 px-3 py-1.5 text-[0.9rem] font-semibold transition-colors"
                            style={
                              n === sessionCount
                                ? { backgroundColor: FILL, borderColor: FILL, color: "#fff" }
                                : undefined
                            }
                          >
                            {n === 1 ? "Just one" : `${n}×`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}

            {step === 3 ? (
              <>
                <p className="text-[0.9rem] opacity-60">
                  These times are held for 35 minutes while you pay.
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Input
                    label="Your name"
                    value={form.parentName}
                    onChange={(v) => setForm({ ...form, parentName: v })}
                    autoComplete="name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.parentEmail}
                    onChange={(v) => setForm({ ...form, parentEmail: v })}
                    autoComplete="email"
                  />
                  <Input
                    label="Phone (optional)"
                    type="tel"
                    value={form.parentPhone}
                    onChange={(v) => setForm({ ...form, parentPhone: v })}
                    autoComplete="tel"
                  />
                  <Input
                    label="Student's name"
                    value={form.studentName}
                    onChange={(v) => setForm({ ...form, studentName: v })}
                  />
                </div>

                {error && (
                  <p className="mt-3 text-[0.85rem] text-red-500">{error}</p>
                )}

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={
                    submitting ||
                    !form.parentName.trim() ||
                    !form.parentEmail.trim() ||
                    !form.studentName.trim()
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[1rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  style={{ backgroundColor: FILL }}
                >
                  {submitting ? (
                    <>
                      <Loader2 aria-hidden className="size-4 animate-spin" />
                      Taking you to payment…
                    </>
                  ) : (
                    <>
                      {total != null ? `Pay $${total}` : "Checkout"}
                      <ArrowRight aria-hidden className="size-4" />
                    </>
                  )}
                </button>
              </>
            ) : null}
          </div>

          {/* Running summary */}
          <aside className="border-t border-current/12 bg-current/[0.03] p-4 sm:border-t-0 sm:border-l">
            <p className="text-[0.8rem] font-semibold tracking-wide uppercase opacity-70">
              Your sessions
            </p>
            <div className="mt-2">
              <SummaryRow label="Course" value={track.name} />
              <SummaryRow label="Tutor" value={tutor ? tutor.name : "No preference"} />
              <SummaryRow
                label="Start"
                value={chosen ? formatInstant(new Date(chosen), BUSINESS_TZ) : null}
              />
              <SummaryRow
                label="Sessions"
                value={chosen ? `${sessionCount} weekly` : null}
              />
              {SHOW_PRICING ? (
                <SummaryRow
                  label="Total"
                  value={total != null ? `$${total}` : live ? `$${price}/ea` : "Depends on tutor"}
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
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-[0.9rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: FILL }}
            >
              Continue
              <ArrowRight aria-hidden className="size-4" />
            </button>
          ) : (
            <span className="flex items-center gap-2 text-[0.85rem] opacity-55">
              <Clock aria-hidden className="size-4" />
              Held 35 minutes
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.78rem] opacity-60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        maxLength={200}
        className="mt-1 w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-[0.95rem] outline-none focus:border-current/50"
      />
    </label>
  );
}
