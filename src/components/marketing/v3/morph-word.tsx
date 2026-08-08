"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * The hero's word slot, typed rather than faded: each near-synonym is typed out
 * a character at a time, held, then deleted before the next one.
 *
 * The slot takes its natural width, so the accent rule underneath grows and
 * shrinks with the typed characters — the underline is drawn as the word is
 * written.
 *
 * Screen readers get one stable word instead of every intermediate fragment,
 * and reduced-motion users get the first word, typed already and held still.
 */

const WORDS = ["cramming", "memorizing", "drilling", "rote", "guesswork"];
const TYPE_MS = 68;
const DELETE_MS = 34;
const HOLD_MS = 2300;
const GAP_MS = 360;

type Phase = "holding" | "deleting" | "typing";

export function MorphWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [length, setLength] = useState(WORDS[0].length);
  const [phase, setPhase] = useState<Phase>("holding");

  const typing = !usePrefersReducedMotion();

  // One scheduled step per state, so the machine advances at the right cadence
  // without a running interval to keep in sync.
  useEffect(() => {
    if (!typing) return;
    const word = WORDS[wordIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "holding") {
      timer = setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else if (phase === "deleting") {
      timer =
        length > 0
          ? setTimeout(() => setLength((n) => n - 1), DELETE_MS)
          : setTimeout(() => {
              setWordIndex((i) => (i + 1) % WORDS.length);
              setPhase("typing");
            }, GAP_MS);
    } else {
      timer =
        length < word.length
          ? setTimeout(() => setLength((n) => n + 1), TYPE_MS)
          : setTimeout(() => setPhase("holding"), TYPE_MS);
    }

    return () => clearTimeout(timer);
  }, [phase, length, wordIndex, typing]);

  const visible = WORDS[wordIndex].slice(0, length);

  return (
    <span className="relative inline-block italic">
      {/* The animated characters are decorative; the word below is what gets
          announced, so the headline never reads as fragments. */}
      <span aria-hidden className="whitespace-nowrap">
        {visible}
      </span>
      <span className="sr-only">{WORDS[wordIndex]}</span>

      {typing ? (
        <span
          aria-hidden
          className={`ml-[0.04em] inline-block h-[0.62em] w-[0.05em] translate-y-[0.02em] align-baseline ${
            phase === "holding" ? "v3-caret-blink" : ""
          }`}
          style={{ backgroundColor: "#D6432B" }}
        />
      ) : null}

      {/* Accent rule — sized to the slot, so it draws itself as the word types. */}
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-[3px] w-full sm:-bottom-2 sm:h-[5px]"
        style={{ backgroundColor: "#D6432B" }}
      />
    </span>
  );
}
