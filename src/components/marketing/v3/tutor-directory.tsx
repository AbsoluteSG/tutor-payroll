"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnquiryForm } from "./enquiry-form";
import {
  SHOW_PRICING,
  TIER_BY_ID,
  TUTOR_TIER,
} from "../pricing";

/**
 * The tutor directory: a card per tutor, each opening a full profile.
 *
 * Every fact below — degrees, institutions, subjects, years of experience — is
 * as supplied by the practice. Nothing here is inferred, rounded, or filled in:
 * a tutor's credentials are the one thing on this site a family will rely on
 * directly, and an invented one is a misrepresentation rather than placeholder
 * copy. Where something was not supplied (Jared's and Ella's surnames, Ella's
 * grade range) the field is simply absent.
 *
 * The profile is a dialog rather than a route per tutor. Base UI gives it a
 * focus trap, escape-to-close and the aria wiring; three thin routes would have
 * given the same content a worse first paint and nothing to link to that the
 * card does not already say.
 */

const INK = "var(--v3-ink)";
const PAPER = "var(--v3-paper)";
const ACCENT = "var(--v3-accent)";
const CARD = "var(--v3-card)";

type Tutor = {
  slug: string;
  name: string;
  /** Standing line under the name — what they are, in four words. */
  role: string;
  initials: string;
  /**
   * Path under /public. Optional — a tutor who has not supplied a photograph
   * gets the monogram plate, never a substitute face.
   */
  photo?: string;
  /** Alt text describing the photograph, not repeating the name alone. */
  photoAlt?: string;
  /**
   * Per-photograph framing, for portraits that are not already head-and-
   * shoulders. `focus` is the point to hold steady (an object-position, also
   * used as the transform origin) and `zoom` scales about it.
   *
   * Only needed where cover-cropping to 4:5 does not do enough on its own: a
   * source close to 4:5 is barely cropped at all, so a full-length photograph
   * stays full-length and sits oddly beside a head-and-shoulders one.
   */
  framing?: { focus: string; zoom: number };
  education: string[];
  /** Card chips. Deliberately few — the full list lives in the profile. */
  specialties: string[];
  /** One or two sentences for the card. */
  summary: string;
  /** Full profile prose, a paragraph per entry. */
  bio: string[];
  subjects: string[];
  testPrep: string[];
  /** Omitted where the practice did not specify a range. */
  levels?: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="border-b border-current/15 pb-2 font-mono text-[0.52rem] tracking-[0.2em] uppercase opacity-55">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * A tutor's hourly rate and tier.
 *
 * Renders nothing at all when SHOW_PRICING is off, so reverting leaves the
 * cards exactly as they were rather than with a gap where a price used to be.
 * Also renders nothing for a tutor with no tier assigned — better a card with
 * no rate on it than a rate we guessed.
 */
function TutorRate({ name }: { name: string }) {
  if (!SHOW_PRICING) return null;
  const tierId = TUTOR_TIER[name];
  if (!tierId) return null;
  const tier = TIER_BY_ID[tierId];

  return (
    <div className="mt-4 flex items-baseline gap-2 border-t border-current/12 pt-4">
      <span className="font-[family-name:var(--font-editorial)] text-[1.5rem] leading-none">
        ${tier.rate}
      </span>
      <span className="font-mono text-[0.5rem] tracking-[0.14em] uppercase opacity-60">
        / hr · {tier.name} tier · online
      </span>
    </div>
  );
}

/** Subjects and test prep read as set lists rather than prose. */
function Tags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-current/20 px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.1em] uppercase opacity-80"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The photograph, or the tutor's initials if it is missing.
 *
 * The fallback exists because the three photographs are supplied separately
 * from this code — a missing file leaves a monogram in the house style rather
 * than a broken image icon or, worse, a stock portrait of someone who does not
 * work here.
 */
function Portrait({
  tutor,
  sizes,
  priority,
}: {
  tutor: Tutor;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // No photograph supplied, or the file did not load.
  if (!tutor.photo || failed) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ backgroundColor: CARD }}
      >
        <span
          aria-hidden
          className="font-[family-name:var(--font-editorial)] text-[3.5rem] leading-none opacity-25"
        >
          {tutor.initials}
        </span>
        <span className="sr-only">Photograph of {tutor.name} not available.</span>
      </div>
    );
  }

  return (
    <Image
      src={tutor.photo}
      alt={tutor.photoAlt ?? `${tutor.name}, tutor`}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      // Full colour, unfiltered. An earlier version desaturated these and
      // restored colour on hover, to reconcile three portraits shot in very
      // different light; it made the tutors look washed out on arrival, which
      // is a poor first impression of the people the page is selling. The
      // photographs are the one place on this site where the ink-and-paper
      // restraint gives way.
      //
      // Faces sit high in all three frames, hence the default object-position.
      className="object-cover"
      style={
        tutor.framing
          ? {
              objectPosition: tutor.framing.focus,
              transformOrigin: tutor.framing.focus,
              transform: `scale(${tutor.framing.zoom})`,
            }
          : { objectPosition: "50% 0%" }
      }
    />
  );
}

function TutorCard({
  tutor,
  priority,
  fontClass,
}: {
  tutor: Tutor;
  priority?: boolean;
  fontClass: string;
}) {
  return (
    <article
      data-reveal
      // The course plates' hover, carried over wholesale: lift 1.5rem, scale
      // 1.06, throw a much deeper shadow, and take the ink skin — the same
      // figures and the same 500ms ease-out the plates use.
      //
      // The scale fits the grid because only one card is ever hovered: 6% of a
      // ~350px card is ~10px a side, against a 24px gutter. The card is raised
      // above its neighbours for the moment it is enlarged.
      //
      // Both background AND colour come from the tokens on this element so the
      // swap reaches the type — see .v3-invert-hover in globals.css.
      className="group v3-invert-hover relative flex flex-col overflow-hidden rounded-[0.7rem] border border-current/12 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.4)] transition-[transform,box-shadow,background-color,color] duration-500 ease-out hover:z-10 hover:-translate-y-6 hover:scale-[1.06] hover:border-transparent hover:shadow-[0_30px_70px_-18px_rgba(0,0,0,0.6)] focus-within:z-10 focus-within:-translate-y-6 focus-within:scale-[1.06] focus-within:shadow-[0_30px_70px_-18px_rgba(0,0,0,0.6)] motion-reduce:transform-none motion-reduce:transition-none"
      style={{ backgroundColor: CARD, color: INK }}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden">
        <Portrait
          tutor={tutor}
          priority={priority}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-editorial)] text-[1.75rem] leading-none tracking-tight">
          {tutor.name}
        </h2>
        <p className="mt-2 font-mono text-[0.52rem] tracking-[0.16em] uppercase opacity-70">
          {tutor.role}
        </p>

        <ul className="mt-4 space-y-1 border-t border-current/12 pt-4">
          {tutor.education.map((line) => (
            <li key={line} className="text-[0.82rem] leading-snug opacity-75">
              {line}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[0.88rem] leading-relaxed opacity-80">
          {tutor.summary}
        </p>

        {/* The rate, on the card. The point of publishing pricing is undone if
            you have to cross-reference a tier table on another page to find out
            what this particular person costs. */}
        <TutorRate name={tutor.name} />


        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tutor.specialties.map((s) => (
            <li
              key={s}
              className="rounded-full border border-current/20 px-2.5 py-1 font-mono text-[0.48rem] tracking-[0.1em] uppercase opacity-75"
            >
              {s}
            </li>
          ))}
        </ul>

        {/* mt-auto pins the action to the bottom, so the buttons line up across
            cards whose bios run to different lengths. */}
        <div className="mt-auto pt-6">
          <TutorProfile tutor={tutor} fontClass={fontClass} />
        </div>
      </div>
    </article>
  );
}

function TutorProfile({
  tutor,
  fontClass,
}: {
  tutor: Tutor;
  fontClass: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className="group/btn inline-flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-2.5 font-mono text-[0.62rem] tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
        style={{ backgroundColor: INK, color: PAPER }}
      >
        View profile
        <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
          &rarr;
        </span>
      </DialogTrigger>

      {/* Portalled to the body, which is outside the page's font-variable scope
          — hence the editorial variable is reapplied here. The --v3-* tokens
          resolve from :root and need no such help. */}
      <DialogContent
        showCloseButton={false}
        className={`${fontClass} v3-no-scrollbar max-h-[88vh] w-full max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-[0.8rem] p-0 ring-1 ring-current/15 sm:max-w-3xl`}
        style={{ backgroundColor: PAPER, color: INK }}
      >
        <div className="grid sm:grid-cols-[13rem_1fr]">
          {/* Portrait rail. overflow-hidden is load-bearing: a zoomed framing
              (see Tutor.framing) scales the image past this box, and without
              clipping it spills across the name and the bio beside it. */}
          <div className="relative hidden aspect-4/5 overflow-hidden sm:block">
            <Portrait tutor={tutor} sizes="13rem" />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-[family-name:var(--font-editorial)] text-[2.1rem] leading-none font-normal tracking-tight">
                  {tutor.name}
                </DialogTitle>
                <DialogDescription className="mt-2 font-mono text-[0.52rem] tracking-[0.16em] uppercase opacity-70">
                  {tutor.role}
                </DialogDescription>
              </div>
              <DialogClose
                aria-label="Close profile"
                className="-mt-1 -mr-1 shrink-0 rounded-full border border-current/20 px-3 py-1.5 font-mono text-[0.5rem] tracking-[0.14em] uppercase transition-colors hover:border-current/60"
              >
                Close
              </DialogClose>
            </div>

            <div className="mt-6 space-y-3 border-t border-current/12 pt-5 text-[0.9rem] leading-relaxed opacity-80">
              {tutor.bio.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Field label="Credentials">
                <ul className="space-y-1.5">
                  {tutor.education.map((line) => (
                    <li
                      key={line}
                      className="text-[0.85rem] leading-snug opacity-80"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </Field>

              {/* Both omitted when empty rather than shown bare. A tutor who
                  has not told us their subjects, or who does not do test prep,
                  should not get a heading with nothing under it — and an empty
                  "Test preparation" field reads as a gap in the page rather
                  than as an accurate absence. */}
              {tutor.testPrep.length > 0 ? (
                <Field label="Test preparation">
                  <Tags items={tutor.testPrep} />
                </Field>
              ) : null}

              {tutor.subjects.length > 0 ? (
                <div className="sm:col-span-2">
                  <Field label="Subjects">
                    <Tags items={tutor.subjects} />
                  </Field>
                </div>
              ) : null}

              {tutor.levels ? (
                <div className="sm:col-span-2">
                  <Field label="Levels">
                    <p className="text-[0.85rem] opacity-80">{tutor.levels}</p>
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="mt-8 border-t border-current/12 pt-5">
              {/* `slug` is passed through so the lead records which tutor was
                  asked for. It is a plain string on the enquiry, not a foreign
                  key — see the Enquiry model. */}
              <EnquiryForm
                fontClass={fontClass}
                context={{
                  subject: `Request — ${tutor.name}`,
                  tutorSlug: tutor.slug,
                  intro: `Tell us what your student needs and we'll call you back about working with ${tutor.name}.`,
                }}
                trigger={
                  <button
                    type="button"
                    className="group/cta inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.64rem] tracking-[0.16em] uppercase"
                    style={{ backgroundColor: ACCENT, color: PAPER }}
                  >
                    Request this tutor
                    <span className="inline-block transition-transform duration-300 group-hover/cta:translate-x-1">
                      &rarr;
                    </span>
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * What the page hands this component — one published tutor, from the database.
 *
 * Shaped by `publicTutors()` in lib/booking/tutors.ts. Kept structurally
 * identical to what the card renders so there is no second definition of a
 * tutor drifting from the first.
 */
export type DirectoryTutor = {
  slug: string;
  name: string;
  initials: string;
  headline: string;
  bio: string[];
  subjects: string[];
  education: string[];
  specialties: string[];
  testPrep: string[];
  levels: string | null;
  photo: string | null;
  photoAlt: string | null;
};

/** Database row to the shape the card was already written against. */
function toCard(t: DirectoryTutor): Tutor {
  return {
    slug: t.slug,
    name: t.name,
    initials: t.initials,
    role: t.headline,
    // The card wants a sentence or two; the profile wants the whole thing. The
    // opening paragraph is the tutor's own summary of themselves, which beats
    // repeating the headline underneath itself.
    summary: t.bio[0] ?? t.headline,
    bio: t.bio,
    subjects: t.subjects,
    education: t.education,
    specialties: t.specialties,
    testPrep: t.testPrep,
    ...(t.levels ? { levels: t.levels } : {}),
    ...(t.photo ? { photo: t.photo } : {}),
    ...(t.photoAlt ? { photoAlt: t.photoAlt } : {}),
  };
}

export function TutorDirectory({
  fontClass,
  tutors,
}: {
  fontClass: string;
  /**
   * Published tutors, from the database. There is deliberately no default and
   * no built-in list: a hardcoded fallback is exactly what previously kept six
   * people on this page after the database was emptied.
   */
  tutors: DirectoryTutor[];
}) {
  if (tutors.length === 0) {
    return (
      <p className="py-16 text-center text-[0.95rem] opacity-60">
        Our tutors are being introduced shortly. In the meantime, tell us what
        you need and we&apos;ll match you personally.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tutors.map((tutor, i) => (
        // The first row is above the fold on most screens, so those portraits
        // are not lazy-loaded.
        <TutorCard
          key={tutor.slug}
          tutor={toCard(tutor)}
          priority={i < 3}
          fontClass={fontClass}
        />
      ))}
    </div>
  );
}
