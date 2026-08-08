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
const STEP_PX = 1100;
/** Fraction of the remaining distance covered each frame. */
const EASING = 0.09;

type Options = {
  /** Highest reachable progress value (i.e. last section index). */
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

    const clamp = (v: number) => Math.min(max, Math.max(0, v));
    let frame = 0;

    function onWheel(event: WheelEvent) {
      // Without this the browser would scroll whatever ancestor can scroll.
      event.preventDefault();
      target.current = clamp(target.current + event.deltaY / STEP_PX);
    }

    let touchY = 0;
    function onTouchStart(event: TouchEvent) {
      touchY = event.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      event.preventDefault();
      const y = event.touches[0]?.clientY ?? touchY;
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
      if (event.key === "Home") {
        event.preventDefault();
        target.current = 0;
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        target.current = max;
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

  /** Jump to a section (used by the section index). */
  function goTo(value: number) {
    target.current = Math.min(max, Math.max(0, value));
  }

  return { hostRef, goTo };
}
