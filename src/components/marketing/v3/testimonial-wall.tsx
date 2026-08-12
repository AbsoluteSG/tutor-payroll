"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * The testimonials wall.
 *
 * ─── The face belongs to the tutor, not the speaker ─────────────────────────
 * Most of these are written by parents, so a portrait beside a quote would
 * misattribute it — a reader assumes the smiling face said the words. Every
 * card therefore labels the portrait as its SUBJECT ("On working with Ella")
 * and puts the speaker's name down with the quote where a signature goes.
 *
 * Tutors rather than students, deliberately. The students are mostly minors
 * and these accounts are largely about difficulty — a child struggling with
 * calculus, a child who thought he was stupid. A permanent, searchable
 * photograph of a named child attached to that is not something a consent form
 * makes reasonable, and a parent evaluating the practice learns nothing from
 * another family's child. Tutors are adults, already photographed for the site,
 * and each testimonial then argues for a specific bookable person.
 *
 * ─── No star ratings ────────────────────────────────────────────────────────
 * Stars claim a rating system: submissions collected, scores aggregated, a
 * distribution. There is none, and a wall of identical five-star graphics
 * hand-placed on hand-picked quotes is the pattern the FTC treats as deceptive.
 * The outcome line does the same job honestly — it is specific and checkable in
 * a way five stars never are.
 *
 * The accounts themselves live below and are currently empty — see the note
 * there before adding any.
 */

const ACCENT = "var(--v3-accent)";
const CARD = "var(--v3-card)";
const INK = "var(--v3-ink)";
const PAPER = "var(--v3-paper)";

type Tutor = {
  id: string;
  name: string;
  /** Matches the photographs already in /public — see tutors-page-v3.tsx. */
  photo: string;
  initials: string;
};

const TUTORS: Record<string, Tutor> = {
  samantha: {
    id: "samantha",
    name: "Samantha Yershov",
    photo: "/tutors/samantha-yershov.webp",
    initials: "SY",
  },
  jared: {
    id: "jared",
    name: "Jared",
    photo: "/tutors/jared.webp",
    initials: "J",
  },
  ella: {
    id: "ella",
    name: "Ella",
    photo: "/tutors/ella.webp",
    initials: "E",
  },
};

type Voice = {
  quote: string;
  speaker: string;
  relation: string;
  tutor: string;
  /** Where a star rating would go. Specific, and therefore checkable. */
  outcome: string;
  term: string;
};

/**
 * ─── Empty until there are real ones ────────────────────────────────────────
 * This page shipped with nine invented accounts and invented outcomes — "Offer
 * from Brooklyn Tech", "Early decision" — attached to invented parents. They
 * have been deleted rather than left commented out, because an invented
 * testimonial that still exists in the file is one paste away from going live,
 * and this is the content on the site most likely to cause real harm: it reads
 * as verified fact and it is the reason a family chooses you.
 *
 * To fill it: add entries to VOICES and set EPIGRAPH to the one that should
 * lead. The page renders whatever is here, including nothing.
 *
 * Each entry needs the family's written permission, an attribution no more
 * specific than they agreed to, and an outcome the practice can substantiate.
 * Resist tidying the wording — see the note below on why the polished ones read
 * as fake.
 *
 * ─── On how they should read ────────────────────────────────────────────────
 * Plainly, and unevenly. Real accounts are blunt, repeat themselves, trail off,
 * and often lead with a dull logistical detail before saying anything. A
 * sixteen-year-old does not speak in balanced clauses. Two drafts of this page
 * were rejected for sounding written rather than said: one narrated its own
 * audience ("the thing I'd say to another parent is..."), the other gave every
 * account a resonant closing line. If a quotation reads like an essayist wrote
 * it, an essayist did. The unevenness is the evidence.
 */

/** The account that leads the page, set larger. Null until there is one. */
const EPIGRAPH: Voice | null = null;

const VOICES: Voice[] = [];

/** Round portrait with a monogram fallback, so a missing file is never broken. */
function Face({ tutor, size }: { tutor: Tutor; size: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`relative ${size} shrink-0 overflow-hidden rounded-full`}
      style={{ backgroundColor: CARD }}
    >
      {failed ? (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center font-[family-name:var(--font-editorial)] text-[0.9rem] opacity-50"
        >
          {tutor.initials}
        </span>
      ) : (
        <Image
          src={tutor.photo}
          alt={`${tutor.name}, tutor`}
          fill
          sizes="72px"
          onError={() => setFailed(true)}
          className="object-cover object-top"
        />
      )}
    </span>
  );
}

/** "On working with X" — the label that stops the face reading as the speaker. */
function Subject({ tutor, size }: { tutor: Tutor; size: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Face tutor={tutor} size={size} />
      <span className="min-w-0">
        <span className="v3-micro block uppercase opacity-45">
          On working with
        </span>
        <span className="block truncate font-[family-name:var(--font-editorial)] text-[1.35rem] leading-tight">
          {tutor.name}
        </span>
      </span>
    </span>
  );
}

/**
 * The chip that replaces a star rating.
 *
 * Set in ink, not accent. As accent-coloured text this appeared nine times on
 * one page — a whole column of loud red lines, which is far more than a single
 * accent should be asked to carry, and it fought the quotations it was meant to
 * support. A hairline chip separates it from the caption just as well, and the
 * accent survives as one small dot.
 */
function Outcome({ text }: { text: string }) {
  return (
    <p className="mt-3">
      {/* rounded-md, not -full: in a three-column wall these chips are narrow
          enough to wrap, and a wrapped pill reads as a lozenge. */}
      <span className="v3-micro inline-flex items-start gap-2 rounded-md border border-current/25 px-2.5 py-1 uppercase opacity-80">
        <span
          aria-hidden
          className="mt-[0.42em] size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: ACCENT }}
        />
        {text}
      </span>
    </p>
  );
}

const ALL = "All tutors";

export function TestimonialWall() {
  const [filter, setFilter] = useState(ALL);

  const options = useMemo(
    () => [ALL, ...Object.values(TUTORS).map((t) => t.name)],
    []
  );

  const shown = useMemo(
    () =>
      filter === ALL
        ? VOICES
        : VOICES.filter((v) => TUTORS[v.tutor].name === filter),
    [filter]
  );

  // Nothing to show until there are real accounts. An empty testimonials page
  // is worse than none — it advertises that nobody has said anything — so the
  // route is unlinked from the nav while this holds. See testimonials-page-v3.
  if (!EPIGRAPH && VOICES.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[0.75rem] border border-current/15 px-6 py-10 text-center">
        <p className="v3-micro uppercase opacity-45">Nothing here yet</p>
        <p className="v3-body mt-3 opacity-75">
          We are collecting these from families now. Rather than fill the page
          with invented ones, it stays empty until there is something real to
          put on it.
        </p>
        <Link
          href="/tutors"
          className="v3-micro mt-6 inline-block uppercase underline decoration-current/30 underline-offset-4 opacity-60 transition-opacity hover:opacity-100"
        >
          Meet the tutors &rarr;
        </Link>
      </div>
    );
  }

  const epigraphTutor = EPIGRAPH ? TUTORS[EPIGRAPH.tutor] : null;

  return (
    <div>
      {/* ── Opening account ──
          The one inverted plate on the page, the way each subject page has its
          Axiom panel. It reassigns the palette for its subtree rather than
          hardcoding swapped colours, so the accent resolves against the ground
          it is actually sitting on. */}
      {EPIGRAPH && epigraphTutor ? (
      <figure
        className="v3-invert relative mx-auto max-w-3xl overflow-hidden rounded-[0.75rem] px-6 py-8 sm:px-10 sm:py-10"
        style={{ backgroundColor: PAPER, color: INK }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${INK} 1px, transparent 1px)`,
            backgroundSize: "7px 7px",
            opacity: 0.12,
            maskImage: "linear-gradient(to bottom, #000, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 70%)",
          }}
        />

        <div className="relative">
          <Subject tutor={epigraphTutor} size="size-14" />

          <blockquote className="mt-6">
            <p className="font-[family-name:var(--font-editorial)] text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.18] tracking-[-0.01em] text-balance">
              <span aria-hidden style={{ color: ACCENT }}>
                &ldquo;
              </span>
              {EPIGRAPH.quote}
              <span aria-hidden style={{ color: ACCENT }}>
                &rdquo;
              </span>
            </p>
          </blockquote>

          <figcaption className="mt-6 border-t border-current/20 pt-4">
            <p className="font-[family-name:var(--font-editorial)] text-[1.4rem] leading-none italic">
              {EPIGRAPH.speaker}
            </p>
            <p className="v3-micro mt-1.5 uppercase opacity-70">
              {EPIGRAPH.relation}
              <span className="mx-1.5 opacity-60">/</span>
              {EPIGRAPH.term}
            </p>
            <Outcome text={EPIGRAPH.outcome} />
          </figcaption>
        </div>
      </figure>
      ) : null}

      {/* ── Filter, by tutor ──
          By tutor rather than by subject: a visitor who liked the sound of one
          of them on the tutors page comes here to read only their accounts. */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-14">
        {options.map((name) => {
          const selected = name === filter;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              aria-pressed={selected}
              className="v3-micro rounded-full border px-4 py-2 uppercase transition-colors"
              style={{
                backgroundColor: selected ? INK : "transparent",
                color: selected ? PAPER : INK,
                borderColor: selected
                  ? INK
                  : "color-mix(in oklab, var(--v3-ink) 25%, transparent)",
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="v3-micro mt-4 text-center uppercase opacity-45"
      >
        {shown.length} {shown.length === 1 ? "account" : "accounts"}
        {filter === ALL ? "" : ` — ${filter}`}
      </p>

      {/* ── The wall ──
          Column flow rather than a grid: the accounts are uneven lengths, and
          columns pack them without the ragged bottom edge row alignment leaves. */}
      <div className="mt-6 gap-5 sm:columns-2 lg:columns-3 lg:gap-6">
        {shown.map((v) => {
          const tutor = TUTORS[v.tutor];
          return (
            <figure
              key={v.speaker + v.quote.slice(0, 16)}
              data-reveal
              className="mb-5 break-inside-avoid rounded-[0.6rem] border border-current/12 p-5 lg:mb-6"
              style={{ backgroundColor: CARD }}
            >
              <Subject tutor={tutor} size="size-11" />

              <blockquote className="mt-4 text-[0.95rem] leading-relaxed opacity-85">
                &ldquo;{v.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-4 border-t border-current/15 pt-3.5">
                <p className="font-[family-name:var(--font-editorial)] text-[1.2rem] leading-none italic">
                  {v.speaker}
                </p>
                <p className="v3-micro mt-1.5 uppercase opacity-70">
                  {v.relation}
                  <span className="mx-1.5 opacity-60">/</span>
                  {v.term}
                </p>
                <Outcome text={v.outcome} />
              </figcaption>
            </figure>
          );
        })}
      </div>

      <p className="v3-micro mt-8 text-center uppercase opacity-50">
        <Link
          href="/tutors"
          className="underline decoration-current/30 underline-offset-4 transition-opacity hover:opacity-100"
        >
          Meet the tutors &rarr;
        </Link>
      </p>
    </div>
  );
}
