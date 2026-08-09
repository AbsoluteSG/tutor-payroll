import { describe, expect, it } from "vitest";
import { progressCeiling, sectionTarget } from "./use-virtual-scroll";

/**
 * The subject pages' progress targeting has to agree with the crossfade windows
 * in globals.css, and nothing in either file forces it to: the CSS is strings in
 * a stylesheet and the targets are numbers over here. When they disagreed, the
 * closing call to action sat permanently at half opacity on top of a
 * half-visible previous panel and no amount of scrolling would finish it.
 *
 * So the CSS formulas are mirrored here and the targets are checked against
 * them. If the windows in .v3-hero / .v3-panel / .v3-panel-last are retuned,
 * these mirrors have to be retuned with them — which is the point.
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** .v3-hero */
const heroOpacity = (p: number) => clamp01((1.15 - p) / 0.3);

/** .v3-panel — fades in as progress arrives, out again as it passes. */
const panelOpacity = (p: number, i: number) =>
  clamp01(Math.min((p - i + 0.15) / 0.3, (i + 1.15 - p) / 0.3));

/** .v3-panel-last — arrives and stays. */
const lastPanelOpacity = (p: number, i: number) => clamp01((p - i + 0.15) / 0.3);

/** Every section's rendered opacity at a given progress, hero first. */
function opacitiesAt(p: number, sectionCount: number) {
  const lastIndex = sectionCount - 1;
  return [
    heroOpacity(p),
    ...Array.from({ length: lastIndex }, (_, k) => {
      const i = k + 1;
      return i === lastIndex ? lastPanelOpacity(p, i) : panelOpacity(p, i);
    }),
  ];
}

// The two shapes in use: the subject pages all run hero + six panels.
const SECTION_COUNT = 7;
const LAST = SECTION_COUNT - 1;

describe("sectionTarget", () => {
  it("leaves exactly one section on screen, for every section", () => {
    for (let section = 0; section <= LAST; section++) {
      const p = sectionTarget(section, LAST);
      const opacities = opacitiesAt(p, SECTION_COUNT);

      expect(
        opacities,
        `section ${section} at progress ${p}`
      ).toEqual(
        Array.from({ length: SECTION_COUNT }, (_, i) => (i === section ? 1 : 0))
      );
    }
  });

  it("settles the hero at zero so its artwork starts unplayed", () => {
    expect(sectionTarget(0, LAST)).toBe(0);
  });

  it("clamps out-of-range indices to real sections", () => {
    expect(sectionTarget(-3, LAST)).toBe(sectionTarget(0, LAST));
    expect(sectionTarget(99, LAST)).toBe(sectionTarget(LAST, LAST));
  });
});

describe("progressCeiling", () => {
  it("reaches the closing panel's own target", () => {
    expect(progressCeiling(LAST)).toBe(sectionTarget(LAST, LAST));
  });

  it("brings the closing call to action fully in", () => {
    expect(lastPanelOpacity(progressCeiling(LAST), LAST)).toBe(1);
  });

  it("clears the panel underneath the closing one", () => {
    expect(panelOpacity(progressCeiling(LAST), LAST - 1)).toBe(0);
  });

  it("stops short of the last section index, which was the bug", () => {
    // Regression: the ceiling used to be LAST itself, where the closing panel
    // and the one before it are both stuck at half opacity, blended together.
    expect(lastPanelOpacity(LAST, LAST)).toBeCloseTo(0.5);
    expect(panelOpacity(LAST, LAST - 1)).toBeCloseTo(0.5);
    expect(progressCeiling(LAST)).toBeGreaterThan(LAST);
  });
});
