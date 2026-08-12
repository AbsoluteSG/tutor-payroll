"use client";

import { useEffect, useState } from "react";

/**
 * The hero's halftone field: a dot screen spanning the full width of the hero,
 * masked so it dissolves toward the left and right edges (and softly at the top
 * and bottom) rather than stopping at a hard line.
 *
 * The whole field drifts a few pixels against the pointer so the hero reads as
 * an object you're standing in front of. Pointer tracking is skipped on touch
 * devices and for reduced-motion users; the field itself still renders.
 */

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";

/** Dissolves the field toward the left and right edges. */
const EDGE_FADE =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.28) 9%, #000 34%, #000 66%, rgba(0,0,0,0.28) 91%, transparent 100%)";

/**
 * Thins the field out behind the headline.
 *
 * There used to be a radial wash of the ground colour painted on top of the
 * dots here, which read as exactly what it was: a bright ellipse hanging in the
 * middle of the page. This removes the dots instead of covering them, so the
 * type gets the same clean field with nothing drawn over it — the only visible
 * change is that the halftone thins where the words are, which is what a
 * printed plate does anyway.
 */
const TYPE_CLEARING =
  "radial-gradient(ellipse 40rem 19rem at 50% 50%, transparent 38%, rgba(0,0,0,0.45) 68%, #000 92%)";

export function HeroPlate() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover)").matches;
    const wantsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (!canHover || !wantsMotion) return;

    let frame = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Normalize pointer position to -1..1 across the viewport, then damp it
        // down to a few pixels of travel — presence, not a parallax gimmick.
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        setOffset({ x: x * 12, y: y * 12 });
      });
    }

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Inset negatively so the drift never exposes an edge of the field. */}
      <div
        className="absolute -inset-x-16 -inset-y-10 transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(${INK} 1.15px, transparent 1.15px)`,
            backgroundSize: "7px 7px",
            opacity: 0.5,
            // Two masks intersected: a dot survives only where the edge fade
            // AND the centre clearing both allow it.
            maskImage: `${EDGE_FADE}, ${TYPE_CLEARING}`,
            WebkitMaskImage: `${EDGE_FADE}, ${TYPE_CLEARING}`,
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
      </div>

      {/* Soften the field where it meets the nav and the footer line. */}
      {/* `transparent` rather than the ground at zero alpha: it has to fade out
          to nothing in whichever theme is active, and premultiplied
          interpolation makes it equivalent to the old literal on paper. */}
      <div
        className="absolute inset-x-0 top-0 h-20"
        style={{
          background: `linear-gradient(to bottom, ${PAPER} 0%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-20"
        style={{
          background: `linear-gradient(to top, ${PAPER} 0%, transparent 100%)`,
        }}
      />

      {/* Hairline registration rings, like a printed specimen plate. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-[min(58vw,31rem)] rounded-full border border-current/12" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-[min(40vw,21rem)] rounded-full border border-current/8" />
      </div>
    </div>
  );
}
