import { describe, expect, it } from "vitest";
import { computeEarnings, sumDecimals, formatUSD, formatDuration } from "./money";

describe("computeEarnings", () => {
  it("computes rate × hours", () => {
    expect(computeEarnings(30, 60).toString()).toBe("30");
    expect(computeEarnings(30, 90).toString()).toBe("45");
    expect(computeEarnings(35, 90).toString()).toBe("52.5");
  });

  it("rounds to cents", () => {
    // 25/h for 50 min = 20.8333… → 20.83
    expect(computeEarnings(25, 50).toString()).toBe("20.83");
    // 40/h for 25 min = 16.6666… → 16.67
    expect(computeEarnings(40, 25).toString()).toBe("16.67");
  });

  it("handles string rates (as stored by Prisma Decimal)", () => {
    expect(computeEarnings("32.50", 60).toString()).toBe("32.5");
  });

  it("returns 0 for zero duration", () => {
    expect(computeEarnings(30, 0).toString()).toBe("0");
  });

  it("avoids float drift", () => {
    // 0.1 + 0.2 style traps: 29.99/h for 60min must be exactly 29.99
    expect(computeEarnings("29.99", 60).toString()).toBe("29.99");
  });
});

describe("sumDecimals", () => {
  it("sums mixed inputs exactly", () => {
    expect(sumDecimals(["0.10", "0.20", 0.3]).toString()).toBe("0.6");
  });
  it("sums empty list to 0", () => {
    expect(sumDecimals([]).toString()).toBe("0");
  });
});

describe("formatUSD", () => {
  it("formats with grouping and cents", () => {
    expect(formatUSD("1234.5")).toBe("$1,234.50");
    expect(formatUSD(0)).toBe("$0.00");
    expect(formatUSD("-60")).toBe("-$60.00");
  });
});

describe("formatDuration", () => {
  it("formats minutes/hours", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30m");
  });
});
