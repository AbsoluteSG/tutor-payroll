"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { useVirtualScroll } from "./use-virtual-scroll";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Shared shell for the per-subject pages (/v3/courses/*).
 *
 * The page is a fixed viewport: the document does not scroll, there is no
 * scrollbar, and no section ever travels off screen. Wheel/touch/key input feeds
 * a virtual progress value (see use-virtual-scroll.ts) published as --p; panels
 * are stacked in one space and crossfade in place as it advances, and the hero
 * reads --p to run whatever it does.
 *
 * Under prefers-reduced-motion the input hijacking is switched off and the page
 * falls back to an ordinary scrolling document — commandeering the scroll wheel
 * is exactly the kind of motion that setting exists to opt out of.
 */

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

export const PAPER = "#EDE9E1";
export const INK = "#14110E";
export const ACCENT = "#D6432B";

export type PanelSpec = {
  key: string;
  content: ReactNode;
  /** Ink background instead of paper. */
  dark?: boolean;
  /** Arrives and stays rather than fading out again — for the closing panel. */
  last?: boolean;
};

type Props = {
  /** Shown at the top right, e.g. "Plate 03 — English Language Arts". */
  plateLabel: string;
  /** Names for the section index. The first entry is the hero. */
  sections: string[];
  /** Receives `locked` so it can lay itself out for a fixed viewport or a document. */
  hero: (locked: boolean) => ReactNode;
  panels: PanelSpec[];
  footerRight: string;
};

/** A section head, shared so every subject page frames its sections alike. */
export function SectionHead({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-current/20 pb-4">
      <h2 className="font-[family-name:var(--font-editorial)] text-3xl tracking-tight sm:text-4xl">
        {title}
      </h2>
      <span className="font-mono text-[0.58rem] tracking-[0.2em] uppercase opacity-45">
        {meta}
      </span>
    </div>
  );
}

function Panel({
  index,
  active,
  locked,
  spec,
}: {
  index: number;
  active: boolean;
  locked: boolean;
  spec: PanelSpec;
}) {
  // Panels are opaque: they are stacked in one space, so a transparent panel
  // would show whichever panel sits behind it.
  const skin = spec.dark
    ? { backgroundColor: INK, color: PAPER }
    : { backgroundColor: PAPER, color: INK };

  if (!locked) {
    return (
      <section
        className="flex min-h-[100svh] flex-col justify-center px-5 py-20 sm:px-8"
        style={skin}
      >
        <div className="mx-auto w-full">{spec.content}</div>
      </section>
    );
  }

  return (
    <section
      data-active={active}
      aria-hidden={!active}
      className={`${
        spec.last ? "v3-panel-last" : "v3-panel"
      } v3-no-scrollbar absolute inset-0 flex flex-col justify-center overflow-y-auto px-5 pt-20 pb-16 sm:px-8`}
      style={{ ...skin, "--i": index } as CSSProperties}
    >
      <div className="mx-auto w-full">{spec.content}</div>
    </section>
  );
}

export function SubjectPage({
  plateLabel,
  sections,
  hero,
  panels,
  footerRight,
}: Props) {
  const locked = !usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const { hostRef, goTo } = useVirtualScroll({
    max: sections.length - 1,
    enabled: locked,
    onActiveChange: setActive,
  });

  return (
    <div
      ref={hostRef}
      className={`${editorial.variable} ${
        locked
          ? // Fixed to the viewport: the document gains no height, so there is
            // no scrollbar and nothing can be scrolled.
            "fixed inset-0 overflow-hidden"
          : "relative min-h-[100svh]"
      } selection:bg-[#D6432B] selection:text-[#EDE9E1]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Film grain, matched to the rest of /v3. */}
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.16] mix-blend-multiply"
      >
        <filter id="v3-subject-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#v3-subject-grain)" />
      </svg>

      <header
        className={`${
          locked ? "absolute" : "sticky"
        } inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[#14110E]/12 px-5 py-4 sm:px-8`}
        style={{ backgroundColor: PAPER }}
      >
        <Link
          href="/v3/courses"
          className="group inline-flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
        >
          <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
            &larr;
          </span>
          Courses
        </Link>
        {/* Hidden on the narrowest screens, where it collided with the back
            link. The page names the subject in its own hero anyway. */}
        <span className="hidden font-mono text-[0.62rem] tracking-[0.2em] uppercase opacity-45 min-[420px]:inline">
          {plateLabel}
        </span>
      </header>

      {/* With no scrollbar there is no native cue for position in the sequence,
          so this stands in for one — and doubles as navigation. */}
      {locked ? (
        <nav
          aria-label="Sections"
          className="absolute top-1/2 right-4 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 sm:flex"
        >
          {sections.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active === i}
              className="group flex items-center gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase"
            >
              <span
                className={`transition-opacity duration-300 ${
                  active === i ? "opacity-70" : "opacity-0 group-hover:opacity-40"
                }`}
              >
                {label}
              </span>
              <span
                aria-hidden
                className="block h-px transition-all duration-300"
                style={{
                  width: active === i ? 26 : 12,
                  backgroundColor: active === i ? ACCENT : INK,
                  opacity: active === i ? 1 : 0.28,
                }}
              />
            </button>
          ))}
        </nav>
      ) : null}

      <div
        data-active={active === 0}
        className={
          locked
            ? // Padding clears the fixed header at the top and the scroll hint at
              // the bottom, both of which share this element's box.
              "v3-hero absolute inset-0 flex flex-col justify-center overflow-hidden pt-20 pb-20"
            : "relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-14"
        }
      >
        {hero(locked)}
      </div>

      {panels.map((spec, i) => (
        <Panel
          key={spec.key}
          index={i + 1}
          active={active === i + 1}
          locked={locked}
          spec={spec}
        />
      ))}

      {locked ? (
        <p
          aria-hidden
          className="v3-stage-fade absolute inset-x-0 bottom-4 z-20 text-center font-mono text-[0.55rem] tracking-[0.24em] uppercase opacity-40"
        >
          Scroll
        </p>
      ) : null}

      {!locked ? (
        <footer className="relative z-10 border-t border-[#14110E]/12 px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-45 sm:flex-row">
            <span>Borough Prep — Brooklyn, NY</span>
            <span>{footerRight}</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
