"use client";

import { useEffect, useRef } from "react";

/**
 * Drives a fixed, non-scrolling page from a virtual progress value.
 *
 * The document itself never scrolls — there is no scrollbar and nothing moves
 * out of the viewport. Wheel, touch and keyboard input accumulate into a
 * progress figure instead, which sections read to fade themselves in and out.
 *
 * Progress is published as a CSS custom property on a host element and written
 * from inside a requestAnimationFrame loop, deliberately NOT through React
 * state: the value changes every frame, and re-rendering a tree containing a
 * hundred-odd dot columns at 60fps would drop frames. React only hears about
 * the coarse active-section index, which changes rarely.
 *
 * Input is eased toward its target rather than applied raw, so a wheel notch
 * glides instead of jumping.
 */

/** Wheel pixels per section. */
const STEP_PX = 520;
/** Fraction of the remaining distance covered each frame. */
const EASING = 0.14;

/**
 * Where inside a section's span that section is actually settled.
 *
 * Progress counts sections, but the crossfades in globals.css are centred on the
 * INTEGER boundaries: at exactly p = i the outgoing and incoming panels are both
 * at half opacity, which is the transition, not a resting place. A section is
 * fully arrived half a step later. Everything that wants to *land* on a section
 * — the section index, and the end of the sequence — has to aim here rather than
 * at the integer, or it stops on a 50/50 blend of two panels.
 */
const SECTION_CENTER = 0.5;

/**
 * Highest progress the sequence can reach, given the last section's index.
 *
 * Not the index itself: stopping there leaves the closing panel at half opacity
 * over a half-visible previous one, with no travel left to finish the crossfade.
 */
export function progressCeiling(max: number) {
  return max + SECTION_CENTER;
}

/**
 * The progress value at which section `index` is settled and alone on screen.
 *
 * The hero is the exception at 0 — its artwork animates across the first
 * section's worth of progress, so any offset would start it half-played.
 */
export function sectionTarget(index: number, max: number) {
  const clamped = Math.min(max, Math.max(0, index));
  return clamped === 0 ? 0 : clamped + SECTION_CENTER;
}

/**
 * The nearest ancestor of `start` that can still scroll in `direction`
 * (1 down, -1 up), or null if there is none below `root`.
 *
 * Panels are `overflow-y-auto` so a panel taller than a short viewport stays
 * reachable — but that only works if the gesture is allowed through to it, and
 * preventing every wheel and touch event unconditionally meant it never was.
 * On a phone the booking panel is taller than the box it gets, and everything
 * past the fold, including its button, could not be reached by any input.
 *
 * When nothing overflows — every panel on a desktop viewport — this finds
 * nothing and the sequence takes the gesture exactly as before.
 */
function scrollableAncestor(
  start: EventTarget | null,
  direction: number,
  root: HTMLElement
) {
  let node = start instanceof Element ? start : null;

  while (node && node !== root.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      const room =
        direction > 0
          ? node.scrollHeight - node.clientHeight - node.scrollTop
          : node.scrollTop;
      // A pixel of slack: scrollTop is fractional on zoomed or scaled displays,
      // so an exact comparison can leave the sequence stuck at a panel's end.
      if (room > 1) return node;
    }
    node = node.parentElement;
  }

  return null;
}

/**
 * Whether a section has asked the sequence to hold still.
 *
 * A section renders `data-sequence-lock` while it is mid-task — the booking
 * panel does it from the moment a visitor picks a course. Without it, a scroll
 * during checkout slides the whole stage on to the next section and takes a
 * half-filled form with it, which reads as the page throwing your work away.
 *
 * Deliberately a DOM marker rather than a prop: the sequence shell knows
 * nothing about what its panels contain, and threading a lock down through
 * every page and panel to reach one form would couple all of them to it.
 *
 * The lock never traps anybody. It only ignores WHEEL, TOUCH and KEY input —
 * the section rail, the scroll cue and the panel's own Back button all call
 * goTo/setStep directly and keep working.
 */
function sequenceLocked() {
  return Boolean(document.querySelector("[data-sequence-lock]"));
}

type Options = {
  /** Index of the last section. */
  max: number;
  /** When false the hook does nothing, leaving the page as a normal document. */
  enabled: boolean;
  /** Receives the active section index whenever it changes. */
  onActiveChange?: (index: number) => void;
};

export function useVirtualScroll({ max, enabled, onActiveChange }: Options) {
  const hostRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const current = useRef(0);
  const activeRef = useRef(0);
  // Kept in a ref so the effect does not need to re-run when the callback
  // identity changes on a parent render.
  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host) return;

    const ceiling = progressCeiling(max);
    const clamp = (v: number) => Math.min(ceiling, Math.max(0, v));
    let frame = 0;

    function onWheel(event: WheelEvent) {
      // Yield to a panel that still has content to scroll; the sequence resumes
      // once it reaches its end. Checked BEFORE the lock, so a scrollable region
      // inside a locked section still scrolls.
      if (scrollableAncestor(event.target, Math.sign(event.deltaY), host!)) {
        return;
      }
      // Without this the browser would scroll whatever ancestor can scroll.
      event.preventDefault();
      if (sequenceLocked()) return;
      target.current = clamp(target.current + event.deltaY / STEP_PX);
    }

    let touchY = 0;
    function onTouchStart(event: TouchEvent) {
      touchY = event.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      const y = event.touches[0]?.clientY ?? touchY;
      // Dragging up (y decreasing) reveals content further down, same sign
      // convention as a positive wheel deltaY.
      if (scrollableAncestor(event.target, Math.sign(touchY - y), host!)) {
        touchY = y;
        return;
      }
      event.preventDefault();
      if (sequenceLocked()) {
        touchY = y;
        return;
      }
      // Touch travel is shorter than a wheel gesture, so it is geared up.
      target.current = clamp(target.current + (touchY - y) / (STEP_PX * 0.45));
      touchY = y;
    }

    const KEY_STEPS: Record<string, number> = {
      ArrowDown: 0.5,
      ArrowUp: -0.5,
      PageDown: 1,
      PageUp: -1,
      " ": 1,
    };
    function onKey(event: KeyboardEvent) {
      // Space and the arrows are how somebody moves around a form; while a
      // section holds the lock they must not also move the stage.
      if (sequenceLocked()) return;
      if (event.key === "Home") {
        event.preventDefault();
        target.current = 0;
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        target.current = ceiling;
        return;
      }
      const step = KEY_STEPS[event.key];
      if (step === undefined) return;
      event.preventDefault();
      target.current = clamp(target.current + step);
    }

    function tick() {
      const diff = target.current - current.current;
      if (Math.abs(diff) > 0.0004) {
        current.current += diff * EASING;
        host!.style.setProperty("--p", current.current.toFixed(4));

        // floor, not round: panel i is the dominant one for progress in
        // [i, i+1) — the crossfade to i+1 is centred on i+1, not on i+0.5. With
        // round, the section index (and interactivity) switched half a section
        // before the panel it names was actually on screen.
        const active = Math.floor(current.current);
        if (active !== activeRef.current) {
          activeRef.current = active;
          onActiveChangeRef.current?.(active);
        }
      }
      frame = requestAnimationFrame(tick);
    }

    host.style.setProperty("--p", "0");
    frame = requestAnimationFrame(tick);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [max, enabled]);

  /** Ease to a section (used by the section index and the scroll cue). */
  function goTo(index: number) {
    target.current = sectionTarget(index, max);
  }

  /**
   * Land on a section immediately, without easing there.
   *
   * For arriving at a section rather than travelling to one — a link into
   * /courses/math#book should open on the booking panel, not open on the
   * hero and then animate past it while the visitor watches.
   *
   * Writes --p directly and seeds both ends of the easing loop, so the next
   * frame has nothing left to travel and the sequence continues from here.
   */
  function jumpTo(index: number) {
    const p = sectionTarget(index, max);
    target.current = p;
    current.current = p;
    hostRef.current?.style.setProperty("--p", p.toFixed(4));
    const active = Math.floor(p);
    if (active !== activeRef.current) {
      activeRef.current = active;
      onActiveChangeRef.current?.(active);
    }
  }

  return { hostRef, goTo, jumpTo };
}
