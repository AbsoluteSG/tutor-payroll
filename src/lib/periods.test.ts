import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolvePeriod, shiftRange, formatRange } from "@/lib/periods";

/** Wednesday, 2026-08-05 (UTC). */
const NOW = new Date("2026-08-05T09:30:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const bounds = (p: ReturnType<typeof resolvePeriod>) => [p.fromISO, p.toISO];

describe("resolvePeriod", () => {
  it("starts weeks on Monday", () => {
    expect(bounds(resolvePeriod({ period: "this-week" }))).toEqual(["2026-08-03", "2026-08-09"]);
    expect(bounds(resolvePeriod({ period: "last-week" }))).toEqual(["2026-07-27", "2026-08-02"]);
  });

  it("covers whole calendar months", () => {
    expect(bounds(resolvePeriod({ period: "this-month" }))).toEqual(["2026-08-01", "2026-08-31"]);
    expect(bounds(resolvePeriod({ period: "last-month" }))).toEqual(["2026-07-01", "2026-07-31"]);
  });

  it("counts rolling windows inclusive of today", () => {
    expect(bounds(resolvePeriod({ period: "last-7" }))).toEqual(["2026-07-30", "2026-08-05"]);
    expect(bounds(resolvePeriod({ period: "last-30" }))).toEqual(["2026-07-07", "2026-08-05"]);
  });

  it("handles quarters and years", () => {
    expect(bounds(resolvePeriod({ period: "this-quarter" }))).toEqual(["2026-07-01", "2026-09-30"]);
    expect(bounds(resolvePeriod({ period: "this-year" }))).toEqual(["2026-01-01", "2026-12-31"]);
  });

  it("leaves all-time unbounded", () => {
    const p = resolvePeriod({ period: "all" });
    expect(p.start).toBeNull();
    expect(p.endExclusive).toBeNull();
    expect(p.shiftable).toBe(false);
  });

  it("uses an exclusive end bound one day past the last day", () => {
    const p = resolvePeriod({ period: "this-week" });
    expect(p.endExclusive?.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("accepts a valid custom range", () => {
    const p = resolvePeriod({ period: "custom", from: "2026-03-02", to: "2026-03-08" });
    expect(bounds(p)).toEqual(["2026-03-02", "2026-03-08"]);
  });

  it("falls back to this week on unknown, malformed, or inverted input", () => {
    const thisWeek = ["2026-08-03", "2026-08-09"];
    expect(bounds(resolvePeriod({ period: "nonsense" }))).toEqual(thisWeek);
    expect(bounds(resolvePeriod({}))).toEqual(thisWeek);
    expect(bounds(resolvePeriod({ period: "custom", from: "oops", to: "2026-03-08" }))).toEqual(thisWeek);
    // to < from
    expect(bounds(resolvePeriod({ period: "custom", from: "2026-03-08", to: "2026-03-02" }))).toEqual(thisWeek);
  });
});

describe("shiftRange", () => {
  it("steps a week back and forward", () => {
    const week = resolvePeriod({ period: "this-week" });
    expect(shiftRange(week, -1)).toEqual({ from: "2026-07-27", to: "2026-08-02" });
    expect(shiftRange(week, 1)).toEqual({ from: "2026-08-10", to: "2026-08-16" });
  });

  it("steps month-aligned ranges by calendar month, not 30 days", () => {
    const month = resolvePeriod({ period: "this-month" });
    expect(shiftRange(month, -1)).toEqual({ from: "2026-07-01", to: "2026-07-31" });
    // February keeps its own length rather than inheriting August's 31 days.
    const feb = resolvePeriod({ period: "custom", from: "2026-03-01", to: "2026-03-31" });
    expect(shiftRange(feb, -1)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("steps multi-month ranges by their whole span", () => {
    const quarter = resolvePeriod({ period: "this-quarter" });
    expect(shiftRange(quarter, -1)).toEqual({ from: "2026-04-01", to: "2026-06-30" });
  });

  it("steps unaligned ranges by their length in days", () => {
    const rolling = resolvePeriod({ period: "last-7" });
    expect(shiftRange(rolling, -1)).toEqual({ from: "2026-07-23", to: "2026-07-29" });
  });

  it("cannot step all-time", () => {
    expect(shiftRange(resolvePeriod({ period: "all" }), -1)).toBeNull();
  });
});

describe("formatRange", () => {
  it("collapses a single-day range", () => {
    const d = new Date("2026-08-05T00:00:00Z");
    expect(formatRange(d, d)).toBe("Aug 5, 2026");
  });

  it("shows the year once when a range stays inside one year", () => {
    expect(formatRange(new Date("2026-07-27T00:00:00Z"), new Date("2026-08-02T00:00:00Z"))).toBe(
      "Jul 27 – Aug 2, 2026",
    );
  });

  it("shows both years when a range crosses a year boundary", () => {
    expect(formatRange(new Date("2025-12-29T00:00:00Z"), new Date("2026-01-04T00:00:00Z"))).toBe(
      "Dec 29, 2025 – Jan 4, 2026",
    );
  });
});
