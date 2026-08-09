"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { useVirtualScroll } from "./use-virtual-scroll";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import { NAV_BAR, NAV_ITEM } from "./nav-metrics";
import { ThemeToggle } from "@/components/theme-toggle";

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

/**
 * The paper-and-ink palette, as CSS variables rather than literals.
 *
 * Keeping the names and handing back `var(...)` means every existing
 * `style={{ backgroundColor: INK, color: PAPER }}` became theme-aware without
 * being touched — and, more usefully, a surface can redefine these for its own
 * subtree. That is how `.v3-invert` works: a panel running against its page
 * reassigns the three variables, and everything nested inside it, including
 * components that never heard of themes, resolves to the correct skin.
 *
 * See globals.css for the values.
 */
export const PAPER = "var(--v3-paper)";
export const INK = "var(--v3-ink)";
export const ACCENT = "var(--v3-accent)";

export type PanelSpec = {
  key: string;
  content: ReactNode;
  /**
   * Runs against the page's skin — ink ground in light mode, paper in dark.
   *
   * Deliberately not called `dark`: the point is the contrast with its
   * neighbours, not a particular colour, and under a dark theme this panel is
   * the light one.
   */
  invert?: boolean;
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
      <h2 className="font-[family-name:var(--font-editorial)] text-[3.375rem] tracking-tight sm:text-[4.5rem]">
        {title}
      </h2>
      <span className="v3-micro shrink-0 font-mono uppercase opacity-55">
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
  //
  // An inverted panel reassigns the palette for its subtree rather than
  // hardcoding swapped colours, so its contents — the accent on its blockquote
  // included — resolve against the ground they are actually sitting on.
  const skin = spec.invert ? "v3-invert" : "";
  const ground = { backgroundColor: PAPER, color: INK };

  if (!locked) {
    return (
      <section
        className={`${skin} flex min-h-[100svh] flex-col justify-center px-4 py-14 sm:px-6`}
        style={ground}
      >
        <div className="mx-auto w-full">{spec.content}</div>
      </section>
    );
  }

  return (
    <section
      data-active={active}
      aria-hidden={!active}
      className={`${skin} ${
        spec.last ? "v3-panel-last" : "v3-panel"
      } v3-no-scrollbar absolute inset-0 flex flex-col justify-center overflow-y-auto px-4 pt-12 pb-10 sm:px-6 sm:pt-14 sm:pb-12`}
      style={{ ...ground, "--i": index } as CSSProperties}
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
  const { hostRef, goTo, jumpTo } = useVirtualScroll({
    max: sections.length - 1,
    enabled: locked,
    onActiveChange: setActive,
  });

  /**
   * Open on the section named by the URL fragment, e.g. …/math#book.
   *
   * This is what lets the course gallery link straight at the booking panel
   * rather than dropping a visitor on the hero to find it themselves. Matched
   * against the section names the page already declares, so a page gains deep
   * links to its sections just by naming them.
   *
   * Only meaningful while locked — unlocked, the page is an ordinary document
   * and the browser resolves the fragment itself.
   */
  useEffect(() => {
    if (!locked) return;
    const slug = window.location.hash.replace(/^#/, "").toLowerCase();
    if (!slug) return;
    const index = sections.findIndex((s) => s.toLowerCase() === slug);
    if (index > 0) jumpTo(index);
    // Deliberately mount-only: this reads the entry URL, and re-running it
    // would yank a reader back to the fragment mid-sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  // Section 0 is the hero; panel i is section i + 1.
  const onInverted = active > 0 && Boolean(panels[active - 1]?.invert);

  return (
    <div
      ref={hostRef}
      className={`${editorial.variable} ${
        locked
          ? // Fixed to the viewport: the document gains no height, so there is
            // no scrollbar and nothing can be scrolled.
            "fixed inset-0 overflow-hidden"
          : "relative min-h-[100svh]"
      } selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* Film grain, matched to the rest of /v3. Blend mode and strength come
          from the theme: grain is printed into paper and reflects off ink. */}
      <svg
        aria-hidden
        className="v3-grain pointer-events-none fixed inset-0 z-50 h-full w-full"
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
        } inset-x-0 top-0 z-30 ${NAV_BAR}`}
        style={{ backgroundColor: PAPER }}
      >
        <Link
          href="/v3/courses"
          className={`${NAV_ITEM} group inline-flex items-center gap-2 transition-opacity hover:opacity-60`}
        >
          <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
            &larr;
          </span>
          Courses
        </Link>
        <div className="flex items-center gap-2">
          {/* Hidden on the narrowest screens, where it collided with the back
              link. The page names the subject in its own hero anyway. */}
          <span className={`${NAV_ITEM} hidden opacity-50 min-[420px]:inline`}>
            {plateLabel}
          </span>
          <ThemeToggle className="-mr-1.5 opacity-55" />
        </div>
      </header>

      {/* With no scrollbar there is no native cue for position in the sequence,
          so this stands in for one — and doubles as navigation.

          Section names are always legible rather than revealed on hover: on a
          page that has taken the scrollbar away, a rail that looks like four
          faint dashes until you happen to point at it is not a cue that there is
          anything further down. Stacked bars plus a count read as a track with a
          position on it at a glance. */}
      {locked ? (
        <nav
          aria-label="Sections"
          // The rail is one element spanning panels of both skins, so it adopts
          // the skin of whichever panel is underneath it — a rail drawn in the
          // page's ink over an inverted panel is an invisible one. Taking the
          // whole skin rather than just flipping a colour also keeps the active
          // marker's accent legible against that ground.
          className={`${
            onInverted ? "v3-invert" : ""
          } absolute top-1/2 right-3 z-30 hidden -translate-y-1/2 flex-col items-end gap-1.5 transition-colors duration-500 sm:right-5 sm:flex`}
          style={{ color: INK }}
        >
          <span className="v3-micro mb-1.5 font-mono tabular-nums opacity-55">
            {String(active + 1).padStart(2, "0")}
            <span className="opacity-50"> / </span>
            {String(sections.length).padStart(2, "0")}
          </span>

          {sections.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active === i ? "true" : undefined}
              className="group flex items-center justify-end gap-2.5"
            >
              <span
                className={`v3-micro font-mono uppercase transition-opacity duration-300 ${
                  active === i
                    ? "opacity-95"
                    : "opacity-50 group-hover:opacity-85"
                }`}
              >
                {label}
              </span>
              <span
                aria-hidden
                className="block w-[4px] rounded-full transition-all duration-300"
                style={{
                  height: active === i ? 30 : 14,
                  backgroundColor: active === i ? ACCENT : "currentColor",
                  opacity: active === i ? 1 : 0.3,
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

      {/* The scroll cue.
          On a page that has taken the scrollbar away this is the only thing
          telling a visitor there is anything past the hero, and on touch it is
          the only one they get at all — the section rail is desktop-only. So it
          is a real control rather than a caption: a bordered pill at full
          opacity, and clicking it advances a section for anyone who reaches for
          it instead of scrolling. */}
      {locked ? (
        <button
          type="button"
          onClick={() => goTo(Math.min(active + 1, sections.length - 1))}
          // It fades with the rest of the hero furniture, and an invisible
          // button is still tabbable and still clickable — so it is taken out
          // of service entirely once the hero is behind us.
          disabled={active !== 0}
          aria-hidden={active !== 0}
          // Sized independently of .v3-label: this one is deliberately twice
          // the rest of the furniture, not one step up from it.
          className="v3-stage-fade absolute inset-x-0 bottom-6 z-20 mx-auto flex w-fit items-center gap-5 rounded-full border-2 px-11 py-5 font-mono text-[2rem] leading-none tracking-[0.08em] uppercase transition-colors duration-300 hover:bg-current/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v3-accent)] disabled:pointer-events-none"
          style={{ borderColor: "color-mix(in oklab, var(--v3-ink) 45%, transparent)" }}
        >
          Scroll
          <span
            aria-hidden
            className="v3-scroll-nudge block text-[2.7rem] leading-none"
            style={{ color: ACCENT }}
          >
            &darr;
          </span>
        </button>
      ) : null}

      {!locked ? (
        <footer className="relative z-10 border-t border-current/12 px-4 py-5 sm:px-6">
          <div className="v3-micro mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 font-mono uppercase opacity-55 sm:flex-row">
            <span>Borough Prep — Brooklyn, NY</span>
            <span>{footerRight}</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
