import { describe, expect, it } from "vitest";
import {
  BUSINESS_TZ,
  formatMinuteOfDay,
  parseDateTimeLocalInZone,
  toISODateInZone,
  utcToZonedParts,
  zonedWallClockToUTC,
} from "./time-zone";

/**
 * `zonedWallClockToUTC` is solved by probing rather than read from a table, so
 * it gets tested harder than anything else in this codebase. If it is wrong,
 * bookings land at the wrong hour and payments follow them.
 */

const LA = "America/Los_Angeles";

describe("toISODateInZone", () => {
  it("gives the calendar day the observer actually sees", () => {
    // The live bug this module exists to fix: an 8:00 pm ET class on Jul 21
    // stores as midnight UTC on the 22nd. Reading it with server-local getters
    // on a UTC host yields the 22nd, so the tutor logs the wrong day and the
    // earnings land in the wrong week.
    const instant = new Date("2026-07-22T00:00:00Z");
    expect(toISODateInZone(instant, BUSINESS_TZ)).toBe("2026-07-21");
    expect(toISODateInZone(instant, "UTC")).toBe("2026-07-22");
  });

  it("handles the other edge of the day too", () => {
    // 11:30 pm ET on the 31st is already the 1st in UTC.
    const instant = new Date("2026-09-01T03:30:00Z");
    expect(toISODateInZone(instant, BUSINESS_TZ)).toBe("2026-08-31");
  });
});

describe("utcToZonedParts", () => {
  it("reads the wall clock and weekday in the target zone", () => {
    // 2026-08-12T20:00Z is 4:00 pm EDT on a Wednesday.
    const parts = utcToZonedParts(new Date("2026-08-12T20:00:00Z"), BUSINESS_TZ);
    expect(parts).toEqual({
      year: 2026,
      month: 8,
      day: 12,
      weekday: 3,
      minutes: 16 * 60,
    });
  });

  it("normalises midnight to 0, not 24", () => {
    const parts = utcToZonedParts(new Date("2026-08-12T04:00:00Z"), BUSINESS_TZ);
    expect(parts.minutes).toBe(0);
    expect(parts.day).toBe(12);
  });
});

describe("zonedWallClockToUTC", () => {
  it("converts a summer (daylight) wall clock", () => {
    // EDT is UTC-4.
    expect(
      zonedWallClockToUTC(2026, 8, 12, 16 * 60, BUSINESS_TZ).toISOString()
    ).toBe("2026-08-12T20:00:00.000Z");
  });

  it("converts a winter (standard) wall clock", () => {
    // EST is UTC-5 — the offset the naive parse gets wrong half the year.
    expect(
      zonedWallClockToUTC(2026, 1, 14, 16 * 60, BUSINESS_TZ).toISOString()
    ).toBe("2026-01-14T21:00:00.000Z");
  });

  it("converts a west-coast wall clock", () => {
    // A tutor in a different state is the whole reason this is parameterised.
    expect(zonedWallClockToUTC(2026, 8, 12, 16 * 60, LA).toISOString()).toBe(
      "2026-08-12T23:00:00.000Z"
    );
  });

  it("round-trips every hour across a full year in two zones", () => {
    for (const zone of [BUSINESS_TZ, LA]) {
      for (let dayOfYear = 0; dayOfYear < 365; dayOfYear += 1) {
        const probe = new Date(Date.UTC(2026, 0, 1, 12) + dayOfYear * 86_400_000);
        const seen = utcToZonedParts(probe, zone);
        const back = zonedWallClockToUTC(
          seen.year,
          seen.month,
          seen.day,
          seen.minutes,
          zone
        );
        expect(back.getTime()).toBe(probe.getTime());
      }
    }
  });

  describe("spring forward — 2026-03-08 in New York, 2am jumps to 3am", () => {
    it("keeps the hour before the gap", () => {
      expect(
        zonedWallClockToUTC(2026, 3, 8, 1 * 60 + 30, BUSINESS_TZ).toISOString()
      ).toBe("2026-03-08T06:30:00.000Z");
    });

    it("resolves a nonexistent wall clock forward", () => {
      // 2:30 am never happens. Landing on 3:30 am EDT is the conventional
      // resolution and the right one for booking — the slot starts an hour
      // later rather than failing.
      const instant = zonedWallClockToUTC(2026, 3, 8, 2 * 60 + 30, BUSINESS_TZ);
      expect(instant.toISOString()).toBe("2026-03-08T07:30:00.000Z");
      expect(utcToZonedParts(instant, BUSINESS_TZ).minutes).toBe(3 * 60 + 30);
    });

    it("keeps the hour after the gap", () => {
      expect(
        zonedWallClockToUTC(2026, 3, 8, 3 * 60 + 30, BUSINESS_TZ).toISOString()
      ).toBe("2026-03-08T07:30:00.000Z");
    });
  });

  describe("fall back — 2026-11-01 in New York, 1am happens twice", () => {
    it("resolves an ambiguous wall clock to the first occurrence", () => {
      // 1:30 am EDT (05:30Z) rather than 1:30 am EST (06:30Z) — the earlier of
      // the two instants.
      const instant = zonedWallClockToUTC(2026, 11, 1, 1 * 60 + 30, BUSINESS_TZ);
      expect(instant.toISOString()).toBe("2026-11-01T05:30:00.000Z");
      expect(utcToZonedParts(instant, BUSINESS_TZ).minutes).toBe(60 + 30);
    });

    it("is unambiguous either side of the repeat", () => {
      expect(
        zonedWallClockToUTC(2026, 11, 1, 0 * 60 + 30, BUSINESS_TZ).toISOString()
      ).toBe("2026-11-01T04:30:00.000Z");
      expect(
        zonedWallClockToUTC(2026, 11, 1, 3 * 60 + 0, BUSINESS_TZ).toISOString()
      ).toBe("2026-11-01T08:00:00.000Z");
    });
  });
});

describe("parseDateTimeLocalInZone", () => {
  it("reads a datetime-local value as a wall clock in the given zone", () => {
    expect(
      parseDateTimeLocalInZone("2026-08-12T16:00", BUSINESS_TZ)?.toISOString()
    ).toBe("2026-08-12T20:00:00.000Z");
  });

  it("rejects malformed input rather than returning an Invalid Date", () => {
    expect(parseDateTimeLocalInZone("", BUSINESS_TZ)).toBeNull();
    expect(parseDateTimeLocalInZone("not-a-date", BUSINESS_TZ)).toBeNull();
    expect(parseDateTimeLocalInZone("2026-08-12", BUSINESS_TZ)).toBeNull();
    expect(parseDateTimeLocalInZone("2026-13-01T10:00", BUSINESS_TZ)).toBeNull();
    expect(parseDateTimeLocalInZone("2026-08-12T25:00", BUSINESS_TZ)).toBeNull();
  });

  it("rejects a date that does not exist instead of rolling it over", () => {
    // Date.UTC(2026, 1, 31) silently becomes March 3rd.
    expect(parseDateTimeLocalInZone("2026-02-31T10:00", BUSINESS_TZ)).toBeNull();
  });
});

describe("formatMinuteOfDay", () => {
  it("renders a 12-hour clock", () => {
    expect(formatMinuteOfDay(0)).toBe("12:00 AM");
    expect(formatMinuteOfDay(930)).toBe("3:30 PM");
    expect(formatMinuteOfDay(12 * 60)).toBe("12:00 PM");
    expect(formatMinuteOfDay(23 * 60 + 45)).toBe("11:45 PM");
  });
});
