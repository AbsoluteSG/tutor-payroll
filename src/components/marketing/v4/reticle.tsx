"use client";

import { useEffect, useState } from "react";

/**
 * A targeting reticle that tracks the pointer across the hero — thin full-width
 * crosshairs plus a live coordinate tag, so the hero behaves like an instrument
 * being aimed rather than a picture being looked at.
 *
 * Only mounts its listener on true hover devices, and never for reduced-motion
 * users. Coordinates are reported relative to the hero, not the viewport.
 */
export function Reticle() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover)").matches;
    const wantsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (!canHover || !wantsMotion) return;

    const host = document.getElementById("v4-hero");
    if (!host) return;

    let frame = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = host!.getBoundingClientRect();
        setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      });
    }
    function onLeave() {
      cancelAnimationFrame(frame);
      setPos(null);
    }

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!pos) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <div
        className="absolute inset-x-0 h-px bg-white/20"
        style={{ top: pos.y }}
      />
      <div
        className="absolute inset-y-0 w-px bg-white/20"
        style={{ left: pos.x }}
      />
      <div
        className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25"
        style={{ left: pos.x, top: pos.y }}
      />
      <span
        className="absolute translate-x-4 translate-y-3 font-mono text-[0.55rem] tracking-[0.18em] whitespace-nowrap text-white/45 tabular-nums"
        style={{ left: pos.x, top: pos.y }}
      >
        X{String(Math.round(pos.x)).padStart(4, "0")} Y
        {String(Math.round(pos.y)).padStart(4, "0")}
      </span>
    </div>
  );
}
