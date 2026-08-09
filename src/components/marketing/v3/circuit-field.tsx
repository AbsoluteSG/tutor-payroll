import type { CSSProperties } from "react";

/**
 * Background technology for the Computer Science hero: a printed circuit,
 * drawn in the same halftone-and-hairline register as the rest of /v3.
 *
 * It sits behind the terminal and belongs to the same argument the page makes —
 * the descent section runs language → compiler → instruction → circuit, and this
 * is the bottom of it, laid out behind the top of it.
 *
 * Everything here is fixed rather than generated. A random routing would differ
 * between the server and client renders and break hydration, and traces that
 * moved on every visit would read as noise rather than as a board.
 *
 * Drawn with currentColor throughout, so it inverts with the skin and never
 * names a colour.
 */

/**
 * Traces, as points on a 0–100 grid. Corners are all 45° or 90°, the way a real
 * autorouter constrains them — arbitrary angles are what make drawn circuits
 * look like decoration rather than like a board.
 */
const TRACES: { d: string; via: [number, number][] }[] = [
  { d: "M 2 18 H 14 L 20 24 H 38", via: [[2, 18], [38, 24]] },
  { d: "M 2 34 H 22 L 28 40 H 40", via: [[40, 40]] },
  { d: "M 0 62 H 18 L 24 56 H 42", via: [[42, 56]] },
  { d: "M 4 82 H 30 L 36 76 H 46", via: [[4, 82], [46, 76]] },
  { d: "M 98 14 H 82 L 76 20 H 60", via: [[98, 14], [60, 20]] },
  { d: "M 100 38 H 74 L 68 44 H 58", via: [[58, 44]] },
  { d: "M 98 66 H 80 L 74 60 H 56", via: [[98, 66], [56, 60]] },
  { d: "M 96 88 H 70 L 64 82 H 54", via: [[54, 82]] },
  { d: "M 12 6 V 16 L 18 22", via: [[12, 6]] },
  { d: "M 88 96 V 84 L 82 78", via: [[88, 96]] },
];

/** Two chips, each with pins down both sides. */
const CHIPS = [
  { x: 6, y: 44, w: 13, h: 9, pins: 4 },
  { x: 82, y: 26, w: 11, h: 8, pins: 3 },
];

export function CircuitField({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      {/* The halftone ground the traces are printed on. Masked to fall away
          toward the middle, so the terminal sits in clear space rather than on
          top of a busy pattern. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          opacity: 0.18,
          maskImage:
            "radial-gradient(ellipse 62% 58% at center, transparent 40%, #000 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 62% 58% at center, transparent 40%, #000 100%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        style={{
          opacity: 0.4,
          maskImage:
            "radial-gradient(ellipse 58% 54% at center, transparent 45%, #000 95%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 58% 54% at center, transparent 45%, #000 95%)",
        }}
      >
        {TRACES.map((trace, i) => (
          <g key={i}>
            <path
              d={trace.d}
              pathLength={1}
              className="circuit-trace"
              strokeWidth="0.35"
              strokeLinecap="square"
              strokeLinejoin="miter"
              style={{ "--i": i } as CSSProperties}
            />
            {trace.via.map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="0.9"
                strokeWidth="0.3"
                className="circuit-via"
                style={{ "--i": i } as CSSProperties}
              />
            ))}
          </g>
        ))}

        {CHIPS.map((chip, i) => (
          <g
            key={`chip-${i}`}
            className="circuit-trace"
            style={{ "--i": TRACES.length + i } as CSSProperties}
          >
            <rect
              x={chip.x}
              y={chip.y}
              width={chip.w}
              height={chip.h}
              pathLength={1}
              strokeWidth="0.4"
            />
            {Array.from({ length: chip.pins }).map((_, p) => {
              const y = chip.y + ((p + 1) * chip.h) / (chip.pins + 1);
              return (
                <g key={p}>
                  <path
                    d={`M ${chip.x - 2} ${y} H ${chip.x}`}
                    pathLength={1}
                    strokeWidth="0.3"
                  />
                  <path
                    d={`M ${chip.x + chip.w} ${y} H ${chip.x + chip.w + 2}`}
                    pathLength={1}
                    strokeWidth="0.3"
                  />
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
