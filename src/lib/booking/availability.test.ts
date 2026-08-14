import { describe, expect, it } from "vitest";
import { candidatesForDate, subtractBusy } from "./availability";
import { BUSINESS_TZ } from "@/lib/time-zone";

const at = (iso: string) => new Date(iso);
const starts = (slots: { startsAt: Date }[]) =>
  slots.map((s) => s.startsAt.toISOString());

describe("subtractBusy", () => {
  const slot = (iso: string, durationMinutes = 60) => ({
    startsAt: at(iso),
    durationMinutes,
  });

  it("keeps everything when nothing is booked", () => {
    const candidates = [slot("2026-08-12T20:00:00Z"), slot("2026-08-12T21:00:00Z")];
    expect(subtractBusy(candidates, [])).toHaveLength(2);
  });

  it("does not block a slot that starts exactly when a class ends", () => {
    // The case worth pinning: intervals are half-open, so 3:00–4:00 must leave
    // 4:00 bookable. Getting this wrong silently loses a bookable hour after
    // every single class.
    const candidates = [slot("2026-08-12T20:00:00Z")];
    const busy = [
      { start: at("2026-08-12T19:00:00Z"), end: at("2026-08-12T20:00:00Z") },
    ];
    expect(subtractBusy(candidates, busy)).toHaveLength(1);
  });

  it("does not block a slot that ends exactly when a class starts", () => {
    const candidates = [slot("2026-08-12T19:00:00Z")];
    const busy = [
      { start: at("2026-08-12T20:00:00Z"), end: at("2026-08-12T21:00:00Z") },
    ];
    expect(subtractBusy(candidates, busy)).toHaveLength(1);
  });

  it("blocks an exact collision", () => {
    const candidates = [slot("2026-08-12T20:00:00Z")];
    const busy = [
      { start: at("2026-08-12T20:00:00Z"), end: at("2026-08-12T21:00:00Z") },
    ];
    expect(subtractBusy(candidates, busy)).toHaveLength(0);
  });

  it("blocks a partial overlap from either side", () => {
    const busy = [
      { start: at("2026-08-12T20:30:00Z"), end: at("2026-08-12T21:30:00Z") },
    ];
    // Overlaps the back half.
    expect(subtractBusy([slot("2026-08-12T20:00:00Z")], busy)).toHaveLength(0);
    // Overlaps the front half.
    expect(subtractBusy([slot("2026-08-12T21:00:00Z")], busy)).toHaveLength(0);
  });

  it("blocks a slot wholly inside a longer class", () => {
    const candidates = [slot("2026-08-12T20:00:00Z", 30)];
    const busy = [
      { start: at("2026-08-12T19:00:00Z"), end: at("2026-08-12T22:00:00Z") },
    ];
    expect(subtractBusy(candidates, busy)).toHaveLength(0);
  });

  it("blocks a long slot that swallows a short class", () => {
    // A 90-minute booking must not straddle an existing 30-minute class.
    const candidates = [slot("2026-08-12T20:00:00Z", 90)];
    const busy = [
      { start: at("2026-08-12T20:45:00Z"), end: at("2026-08-12T21:15:00Z") },
    ];
    expect(subtractBusy(candidates, busy)).toHaveLength(0);
  });
});

describe("candidatesForDate", () => {
  it("emits starts on the granularity across the window", () => {
    // 4:00 pm–6:00 pm ET on a summer Wednesday, 60-minute classes.
    const slots = candidatesForDate(
      [{ startMinute: 16 * 60, endMinute: 18 * 60 }],
      2026,
      8,
      12,
      BUSINESS_TZ,
      60
    );
    expect(starts(slots)).toEqual([
      "2026-08-12T20:00:00.000Z",
      "2026-08-12T20:30:00.000Z",
      "2026-08-12T21:00:00.000Z",
    ]);
  });

  it("requires the whole class to fit inside the window", () => {
    // A one-hour window offers exactly one one-hour start.
    const slots = candidatesForDate(
      [{ startMinute: 16 * 60, endMinute: 17 * 60 }],
      2026,
      8,
      12,
      BUSINESS_TZ,
      60
    );
    expect(starts(slots)).toEqual(["2026-08-12T20:00:00.000Z"]);
  });

  it("offers nothing when the window is shorter than the class", () => {
    const slots = candidatesForDate(
      [{ startMinute: 16 * 60, endMinute: 16 * 60 + 45 }],
      2026,
      8,
      12,
      BUSINESS_TZ,
      60
    );
    expect(slots).toHaveLength(0);
  });

  it("rounds a ragged window start up to the granularity", () => {
    const slots = candidatesForDate(
      [{ startMinute: 15 * 60 + 50, endMinute: 18 * 60 }],
      2026,
      8,
      12,
      BUSINESS_TZ,
      60
    );
    expect(starts(slots)[0]).toBe("2026-08-12T20:00:00.000Z");
  });

  it("keeps the same wall clock either side of a DST boundary", () => {
    // The reason rules are stored as wall clock rather than instants. A 4pm ET
    // window is 20:00Z in summer and 21:00Z in winter; if it stayed 20:00Z the
    // tutor's 4pm would silently become 3pm for half the year.
    const summer = candidatesForDate(
      [{ startMinute: 16 * 60, endMinute: 17 * 60 }],
      2026,
      10,
      27,
      BUSINESS_TZ,
      60
    );
    const winter = candidatesForDate(
      [{ startMinute: 16 * 60, endMinute: 17 * 60 }],
      2026,
      11,
      10,
      BUSINESS_TZ,
      60
    );
    expect(starts(summer)).toEqual(["2026-10-27T20:00:00.000Z"]);
    expect(starts(winter)).toEqual(["2026-11-10T21:00:00.000Z"]);
  });

  it("merges duplicate starts from overlapping rules", () => {
    const slots = candidatesForDate(
      [
        { startMinute: 16 * 60, endMinute: 18 * 60 },
        { startMinute: 17 * 60, endMinute: 19 * 60 },
      ],
      2026,
      8,
      12,
      BUSINESS_TZ,
      60
    );
    expect(new Set(starts(slots)).size).toBe(slots.length);
  });

  it("returns starts in order", () => {
    const slots = candidatesForDate(
      [
        { startMinute: 18 * 60, endMinute: 20 * 60 },
        { startMinute: 9 * 60, endMinute: 11 * 60 },
      ],
      2026,
      8,
      12,
      BUSINESS_TZ,
      60
    );
    const times = slots.map((s) => s.startsAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
