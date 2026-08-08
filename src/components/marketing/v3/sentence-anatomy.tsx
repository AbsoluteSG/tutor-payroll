import type { CSSProperties, ReactNode } from "react";

/**
 * The ELA hero: one sentence that performs its own close reading.
 *
 * At rest it is simply a sentence. As the page's progress advances, brackets and
 * grammatical labels draw in beneath it — subject, predicate, object, and the
 * prepositional phrase nested inside the object — so the page demonstrates the
 * discipline instead of describing it. The analysis is real, not decorative:
 * the constituents are correct, including the nesting.
 *
 * Marks are positioned relative to their own constituent, so they stay aligned
 * at any type size or line wrap without any measurement. The two tiers are
 * separated by a fixed vertical offset, which is what makes the nesting legible.
 */

const RULE = "rgba(20,17,14,0.4)";

/** Vertical offsets for the two tiers of analysis, below the text baseline. */
const TIER_OFFSET = ["calc(100% + 0.55rem)", "calc(100% + 3rem)"] as const;

function Mark({
  index,
  label,
  tier,
}: {
  index: number;
  label: string;
  tier: 0 | 1;
}) {
  return (
    <span
      aria-hidden
      className="ela-mark pointer-events-none absolute inset-x-0"
      style={{ "--i": index, top: TIER_OFFSET[tier] } as CSSProperties}
    >
      {/* Top and side borders together form the bracket. */}
      <span
        className="ela-mark-rule block h-[5px] w-full border-t border-r border-l"
        style={{ borderColor: RULE }}
      />
      <span className="ela-mark-label mt-1.5 block text-center font-mono text-[0.5rem] leading-tight tracking-[0.16em] uppercase opacity-55 sm:text-[0.55rem]">
        {label}
      </span>
    </span>
  );
}

function Constituent({
  index,
  label,
  tier = 0,
  children,
}: {
  index: number;
  label: string;
  tier?: 0 | 1;
  children: ReactNode;
}) {
  return (
    // nowrap keeps a constituent intact; the sentence still wraps between them.
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <Mark index={index} label={label} tier={tier} />
    </span>
  );
}

export function SentenceAnatomy() {
  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-8">
      {/* The sentence is held to a single line at every width. Allowed to wrap,
          the brackets belonging to constituents on the first line render at
          `top: 100%` of their own box and land on top of the second line of
          text. Keeping one line is what makes the two-tier analysis legible, so
          the type scales down on narrow screens instead. */}
      <p className="ela-sentence text-center font-[family-name:var(--font-editorial)] text-[clamp(0.9rem,4vw,3.5rem)] leading-[1.3] tracking-tight whitespace-nowrap">
        <Constituent index={0} label="Subject">
          Every sentence
        </Constituent>{" "}
        <Constituent index={1} label="Predicate">
          conceals
        </Constituent>{" "}
        <Constituent index={2} label="Object">
          the shape{" "}
          <Constituent index={3} label="Prepositional phrase" tier={1}>
            of a thought
          </Constituent>
        </Constituent>
        .
      </p>
    </div>
  );
}
