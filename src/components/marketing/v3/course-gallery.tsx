"use client";

import { useState } from "react";
import Link from "next/link";
import { FitText } from "./fit-text";

/**
 * The fanned course selector. Cards sit on a shared perspective stage between
 * two angled "gallery walls"; picking one straightens and lifts it, and the
 * caption beneath swaps to that course.
 *
 * The fan is laid out from each card's index rather than hardcoded per card,
 * so adding or removing a course re-balances the arrangement automatically.
 */

const INK = "var(--v3-ink)";
const PAPER = "var(--v3-paper)";
const ACCENT = "var(--v3-accent)";
/** A shade off the ground, for the unselected plates. */
const CARD = "var(--v3-card)";

type Course = {
  code: string;
  /** Short form, for the card face and the action — the card is 6.5rem wide on
      a phone, which fits one word of display type. */
  name: string;
  /** Full name, for the caption and the plate line. Defaults to `name`. */
  title?: string;
  note: string;
  caption: string;
  /** Dedicated subject page, once one exists. Falls back to an enquiry email. */
  href?: string;
};

/**
 * The SAT and the SHSAT were separate plates. They are one course: the same
 * preparation, often the same student two years apart, and splitting them put
 * half the gallery on exams — which read as though the practice were mostly test
 * prep rather than teaching.
 */
const COURSES: Course[] = [
  {
    code: "01",
    name: "Testing",
    title: "Specialized Testing",
    note: "SHSAT · Digital SAT",
    href: "/v3/courses/testing",
    caption:
      "The SHSAT and the digital SAT, taught as a set of recurring problem shapes rather than a vocabulary list. We work from your student’s own diagnostic, not a generic sequence.",
  },
  {
    code: "02",
    name: "ELA",
    title: "English Language Arts",
    note: "Reading · Writing · Argument",
    href: "/v3/courses/ela",
    caption:
      "Close reading and written argument for their own sake: how a passage is built, what a claim owes its evidence, and how to write a sentence that holds.",
  },
  {
    code: "03",
    name: "Math",
    title: "Mathematics",
    note: "Pre-algebra → Calculus",
    href: "/v3/courses/math",
    caption:
      "Coursework support that rebuilds from the idea underneath the gap — so the next chapter has something to stand on instead of another memorized rule.",
  },
];

/** Enquiry mailto for a course that has no page of its own yet. */
function enquiryHref(name: string) {
  return `mailto:hello@boroughprep.com?subject=${encodeURIComponent(
    `${name} tutoring enquiry`
  )}`;
}

/** Even fan: outermost cards tilt most, and lower cards sit slightly deeper. */
function fanTransform(index: number, count: number, selected: boolean) {
  const mid = (count - 1) / 2;
  const fromCenter = index - mid;
  if (selected) {
    return "rotate(0deg) translateY(-1.5rem) scale(1.06)";
  }
  const rotate = fromCenter * 7;
  const lift = Math.abs(fromCenter) * 0.55;
  return `rotate(${rotate}deg) translateY(${lift}rem) scale(1)`;
}

export function CourseGallery() {
  const [selected, setSelected] = useState(1);
  const active = COURSES[selected];

  return (
    <div className="relative">
      {/* ── Angled gallery walls, halftone-printed ── */}
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 hidden w-[24%] lg:block ${
            side === "left" ? "left-0" : "right-0"
          }`}
          style={{
            transform: `perspective(1400px) rotateY(${
              side === "left" ? 36 : -36
            }deg)`,
            transformOrigin: side === "left" ? "left center" : "right center",
          }}
        >
          <div
            className="h-full w-full border-y border-current/10"
            style={{
              backgroundImage: `radial-gradient(${INK} 1.1px, transparent 1.1px)`,
              backgroundSize: "8px 8px",
              opacity: 0.3,
              maskImage: `linear-gradient(to ${
                side === "left" ? "right" : "left"
              }, transparent 0%, #000 55%, #000 100%)`,
              WebkitMaskImage: `linear-gradient(to ${
                side === "left" ? "right" : "left"
              }, transparent 0%, #000 55%, #000 100%)`,
            }}
          />
        </div>
      ))}

      {/* ── The fan ── */}
      <div className="relative flex items-center justify-center px-4 pt-6 pb-2">
        <div
          className="flex items-center justify-center"
          style={{ perspective: "1600px" }}
        >
          {COURSES.map((course, i) => {
            const isSelected = i === selected;

            // Hover (and keyboard focus) previews the course; the click is
            // navigation. Selection is not cleared on mouse-out — snapping the
            // caption back to a default as the pointer travels between cards
            // would read as flicker.
            const cardProps = {
              onMouseEnter: () => setSelected(i),
              onFocus: () => setSelected(i),
              "data-selected": isSelected,
              "aria-label": `${course.title ?? course.name} — ${course.note}. ${
                course.href ? "View course" : "Enquire"
              }`,
              // The link itself is never transformed — only the face inside it
              // is. Transforming the hit area meant that selecting a card moved
              // the cards, which slid a *different* card under a stationary
              // cursor, fired its mouseenter, and let selection ping-pong.
              // Keeping the hit areas still makes hovering predictable.
              //
              // Four cards must fit the viewport at every width, so they overlap
              // heavily on phones and only separate once there's room.
              className:
                "group relative -mx-3.5 block w-[6.5rem] shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--v3-accent)] sm:-mx-1 sm:w-[9.5rem] lg:mx-1 lg:w-[13rem]",
              style: {
                zIndex: isSelected ? 30 : 10 - Math.abs(i - selected),
              },
            };

            const face = (
              <div
                className="origin-bottom transition-transform duration-500 ease-out"
                style={{
                  transform: fanTransform(i, COURSES.length, isSelected),
                }}
              >
                <div
                  className="flex aspect-3/4 flex-col justify-between overflow-hidden rounded-[0.6rem] p-3 text-left transition-shadow duration-500 sm:p-4 lg:rounded-[0.75rem] lg:p-5"
                  style={{
                    backgroundColor: isSelected ? INK : CARD,
                    color: isSelected ? PAPER : INK,
                    // Shadows stay black in both themes — a plate lifted off a
                    // dark ground still casts a shadow, it is just quieter, and
                    // tinting it with the ink would make it glow on dark.
                    boxShadow: isSelected
                      ? "0 26px 60px -18px rgba(0,0,0,0.55)"
                      : "0 12px 32px -18px rgba(0,0,0,0.4)",
                    outline: `1px solid ${
                      isSelected
                        ? "transparent"
                        : "color-mix(in oklab, var(--v3-ink) 12%, transparent)"
                    }`,
                  }}
                >
                  <div className="flex items-start justify-between font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-60">
                    <span>{course.code}</span>
                    <span
                      className="size-1.5 rounded-full transition-opacity"
                      style={{
                        backgroundColor: ACCENT,
                        opacity: isSelected ? 1 : 0,
                      }}
                    />
                  </div>

                  {/* Halftone band — the printed texture of the plate. */}
                  <div
                    aria-hidden
                    className="my-2 h-10 w-full lg:my-3 lg:h-16"
                    style={{
                      backgroundImage: `radial-gradient(${
                        isSelected ? PAPER : INK
                      } 1px, transparent 1px)`,
                      backgroundSize: "6px 6px",
                      opacity: 0.42,
                      maskImage:
                        "linear-gradient(to bottom, #000, transparent 90%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, #000, transparent 90%)",
                    }}
                  />

                  <div>
                    <p className="font-[family-name:var(--font-editorial)] text-[1.45rem] leading-none tracking-tight sm:text-[2rem] lg:text-[2.7rem]">
                      {course.name}
                    </p>
                    <p className="mt-1.5 font-mono text-[0.5rem] leading-snug tracking-[0.1em] uppercase opacity-60 lg:mt-2.5 lg:text-[0.58rem]">
                      {course.note}
                    </p>
                  </div>
                </div>
              </div>
            );

            // Courses with a page of their own navigate there; the rest open an
            // enquiry until their page exists.
            return course.href ? (
              <Link key={course.code} href={course.href} {...cardProps}>
                {face}
              </Link>
            ) : (
              <a key={course.code} href={enquiryHref(course.name)} {...cardProps}>
                {face}
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Caption for the hovered plate ──
          Fixed box: the caption can never change the height of this section, so
          moving between courses never nudges the buttons below it. Announced
          politely because tabbing between cards changes it. */}
      <div
        aria-live="polite"
        className="relative mx-auto mt-8 w-full max-w-xl px-5 text-center"
      >
        <p className="font-mono text-[0.58rem] tracking-[0.22em] uppercase opacity-45">
          Plate {active.code} — {active.title ?? active.name}
        </p>
        <div className="mt-3">
          <FitText className="text-balance opacity-75">
            {active.caption}
          </FitText>
        </div>
      </div>

      {/* ── Actions ──
          Courses with a dedicated page route there; the rest still open an
          enquiry email until their page exists. */}
      <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
        {active.href ? (
          <Link
            href={active.href}
            className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase"
            style={{ backgroundColor: INK, color: PAPER }}
          >
            Explore {active.name}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        ) : (
          <a
            href={enquiryHref(active.name)}
            className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase"
            style={{ backgroundColor: INK, color: PAPER }}
          >
            Get started
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        )}
        <a
          href="mailto:hello@boroughprep.com"
          className="inline-flex items-center rounded-full border border-current/25 px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
        >
          Ask a question
        </a>
      </div>
    </div>
  );
}
