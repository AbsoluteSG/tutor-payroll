"use client";

import { useEffect, useRef } from "react";

/**
 * A fixed-size text box: the outer element never changes dimensions, so swapping
 * the text can't push anything below it around. If the new text doesn't fit, the
 * font size steps down until it does.
 *
 * The fitted size is written straight to the DOM rather than held in state —
 * this is a measure-then-write loop against the rendered layout, so routing it
 * through a re-render would just add a frame of wrongly-sized text.
 */

type FitTextProps = {
  children: string;
  /** Starting (and maximum) font size in px. */
  maxFontPx?: number;
  /** Floor for shrinking, in px. */
  minFontPx?: number;
  className?: string;
};

export function FitText({
  children,
  // Scaled with the rest of the /v3 type. The floor matters as much as the
  // ceiling here: this box shrinks text until it fits, so too low a floor
  // quietly undoes the larger scale for whichever caption happens to be
  // longest.
  maxFontPx = 23.5,
  minFontPx = 17,
  className = "",
}: FitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    function fit() {
      if (!box || !text) return;
      let size = maxFontPx;
      text.style.fontSize = `${size}px`;

      // Shrink in half-pixel steps until the text fits its fixed box. The
      // minFontPx floor doubles as the loop bound.
      while (
        size > minFontPx &&
        (text.scrollHeight > box.clientHeight ||
          text.scrollWidth > box.clientWidth)
      ) {
        size -= 0.5;
        text.style.fontSize = `${size}px`;
      }
    }

    fit();
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => window.removeEventListener("resize", fit);
  }, [children, maxFontPx, minFontPx]);

  return (
    <div
      ref={boxRef}
      className="flex h-[11rem] w-full items-start justify-center overflow-hidden sm:h-[9rem]"
    >
      <p ref={textRef} className={className} style={{ lineHeight: 1.65 }}>
        {children}
      </p>
    </div>
  );
}
