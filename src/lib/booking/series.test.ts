import { describe, expect, it } from "vitest";
import { MAX_SESSIONS, seriesLabel, weeklySeries } from "./series";
import { BUSINESS_TZ, utcToZonedParts } from "@/lib/time-zone";

const LA = "America/Los_Angeles";
const iso = (slots: { startsAt: Date }[]) =>
  slots.map((s) => s.startsAt.toISOString());

describe("weeklySeries", () => {
  it("repeats the same weekday and time", () => {
    // Wednesday 12 Aug 2026, 4:00 pm ET.
    const slots = weeklySeries({
      firstStartsAt: new Date("2026-08-12T20:00:00Z"),
      count: 3,
      durationMinutes: 60,
      timeZone: BUSINESS_TZ,
    });
    expect(iso(slots)).toEqual([
      "2026-08-12T20:00:00.000Z",
      "2026-08-19T20:00:00.000Z",
      "2026-08-26T20:00:00.000Z",
    ]);
  });

  it("holds the wall clock across the autumn DST boundary", () => {
    // THE test. A six-week block starting 20 Oct 2026 crosses 1 November,
    // when New York leaves daylight time. Stepping by 7 × 86_400_000 ms would
    // keep every instant at 20:00Z and silently move the last three classes
    // from 4:00 pm to 3:00 pm — the parent turns up an hour early.
    const slots = weeklySeries({
      firstStartsAt: new Date("2026-10-20T20:00:00Z"),
      count: 4,
      durationMinutes: 60,
      timeZone: BUSINESS_TZ,
    });

    expect(iso(slots)).toEqual([
      "2026-10-20T20:00:00.000Z", // EDT
      "2026-10-27T20:00:00.000Z", // EDT
      "2026-11-03T21:00:00.000Z", // EST — the instant shifts…
      "2026-11-10T21:00:00.000Z", // EST
    ]);

    // …precisely so the wall clock does not.
    for (const slot of slots) {
      expect(utcToZonedParts(slot.startsAt, BUSINESS_TZ).minutes).toBe(16 * 60);
    }
  });

  it("holds the wall clock across the spring DST boundary", () => {
    // 1 March 2027 → 8 March 2027 crosses the spring-forward.
    const slots = weeklySeries({
      firstStartsAt: new Date("2027-03-01T21:00:00Z"),
      count: 3,
      durationMinutes: 60,
      timeZone: BUSINESS_TZ,
    });
    for (const slot of slots) {
      expect(utcToZonedParts(slot.startsAt, BUSINESS_TZ).minutes).toBe(16 * 60);
    }
  });

  it("keeps the tutor's own zone, not the business zone", () => {
    // A tutor in Los Angeles changes clocks on the same dates but from a
    // different offset; the series must follow their clock.
    const slots = weeklySeries({
      firstStartsAt: new Date("2026-10-20T23:00:00Z"),
      count: 3,
      durationMinutes: 60,
      timeZone: LA,
    });
    for (const slot of slots) {
      expect(utcToZonedParts(slot.startsAt, LA).minutes).toBe(16 * 60);
    }
    // 4pm PDT is 23:00Z; after the change 4pm PST is 00:00Z the *following*
    // UTC day, which is exactly the kind of off-by-one a millisecond step hides.
    expect(iso(slots)).toEqual([
      "2026-10-20T23:00:00.000Z",
      "2026-10-27T23:00:00.000Z",
      "2026-11-04T00:00:00.000Z",
    ]);
  });

  it("rolls over a month boundary", () => {
    const slots = weeklySeries({
      firstStartsAt: new Date("2026-08-26T20:00:00Z"),
      count: 3,
      durationMinutes: 60,
      timeZone: BUSINESS_TZ,
    });
    expect(iso(slots)).toEqual([
      "2026-08-26T20:00:00.000Z",
      "2026-09-02T20:00:00.000Z",
      "2026-09-09T20:00:00.000Z",
    ]);
  });

  it("rolls over a year boundary", () => {
    const slots = weeklySeries({
      firstStartsAt: new Date("2026-12-29T21:00:00Z"),
      count: 2,
      durationMinutes: 60,
      timeZone: BUSINESS_TZ,
    });
    expect(iso(slots)).toEqual([
      "2026-12-29T21:00:00.000Z",
      "2027-01-05T21:00:00.000Z",
    ]);
  });

  it("supports a fortnightly interval", () => {
    const slots = weeklySeries({
      firstStartsAt: new Date("2026-08-12T20:00:00Z"),
      count: 3,
      durationMinutes: 60,
      timeZone: BUSINESS_TZ,
      intervalWeeks: 2,
    });
    expect(iso(slots)).toEqual([
      "2026-08-12T20:00:00.000Z",
      "2026-08-26T20:00:00.000Z",
      "2026-09-09T20:00:00.000Z",
    ]);
  });

  it("caps the count and refuses nonsense", () => {
    expect(
      weeklySeries({
        firstStartsAt: new Date("2026-08-12T20:00:00Z"),
        count: 99,
        durationMinutes: 60,
        timeZone: BUSINESS_TZ,
      })
    ).toHaveLength(MAX_SESSIONS);

    expect(
      weeklySeries({
        firstStartsAt: new Date("2026-08-12T20:00:00Z"),
        count: 0,
        durationMinutes: 60,
        timeZone: BUSINESS_TZ,
      })
    ).toHaveLength(0);
  });
});

describe("seriesLabel", () => {
  it("pluralises only for a real series", () => {
    const start = new Date("2026-08-12T20:00:00Z");
    expect(seriesLabel(start, 1, BUSINESS_TZ)).toBe("Wednesday 4:00 PM");
    expect(seriesLabel(start, 6, BUSINESS_TZ)).toBe("Wednesdays 4:00 PM × 6");
  });
});
