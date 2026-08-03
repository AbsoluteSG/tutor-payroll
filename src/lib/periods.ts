/**
 * Date-range presets for the admin overview.
 *
 * Everything here is UTC-based, matching how class dates are stored
 * (`ClassSession.date` is a `@db.Date`) and rendered elsewhere in the app.
 * Ranges are half-open internally (`[start, endExclusive)`) but presented to
 * the user — and round-tripped through the URL — as inclusive `from`/`to` days.
 *
 * Pure module with no server imports, so client components can use it too.
 */

const DAY_MS = 86_400_000;

export type PeriodKey =
  | "this-week"
  | "last-week"
  | "last-7"
  | "this-month"
  | "last-month"
  | "last-30"
  | "this-quarter"
  | "this-year"
  | "all"
  | "custom";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "this-week", label: "This week" },
  { value: "last-week", label: "Last week" },
  { value: "last-7", label: "Last 7 days" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-30", label: "Last 30 days" },
  { value: "this-quarter", label: "This quarter" },
  { value: "this-year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

export type ResolvedPeriod = {
  key: PeriodKey;
  /** Human range, e.g. "Jul 27 – Aug 2, 2026". Empty for all-time. */
  rangeLabel: string;
  /** Null for all-time — no lower bound. */
  start: Date | null;
  /** Exclusive upper bound. Null for all-time. */
  endExclusive: Date | null;
  /** Inclusive ISO bounds, for date inputs and prev/next links. */
  fromISO: string;
  toISO: string;
  /** All-time can't be stepped through. */
  shiftable: boolean;
};

// ---------- UTC date helpers ----------

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** Monday-based start of week. */
function startOfWeek(d: Date): Date {
  return addDays(d, -((d.getUTCDay() + 6) % 7));
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseISODate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(ms) ? null : new Date(ms);
}

// ---------- Labels ----------

function formatDay(d: Date, withYear: boolean): string {
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

/** "Jul 27 – Aug 2, 2026", or a single day when the range is one day long. */
export function formatRange(start: Date, endInclusive: Date): string {
  if (start.getTime() === endInclusive.getTime()) return formatDay(start, true);
  const sameYear = start.getUTCFullYear() === endInclusive.getUTCFullYear();
  return `${formatDay(start, !sameYear)} – ${formatDay(endInclusive, true)}`;
}

// ---------- Resolution ----------

function build(key: PeriodKey, start: Date, endExclusive: Date): ResolvedPeriod {
  const endInclusive = addDays(endExclusive, -1);
  return {
    key,
    rangeLabel: formatRange(start, endInclusive),
    start,
    endExclusive,
    fromISO: toISODate(start),
    toISO: toISODate(endInclusive),
    shiftable: true,
  };
}

/**
 * Turn `?period=`/`?from=`/`?to=` into a concrete range. Unknown or malformed
 * input falls back to the current week rather than erroring.
 */
export function resolvePeriod(params: {
  period?: string;
  from?: string;
  to?: string;
}): ResolvedPeriod {
  const today = todayUTC();
  const tomorrow = addDays(today, 1);
  const key = (params.period ?? "this-week") as PeriodKey;

  switch (key) {
    case "last-week": {
      const start = addDays(startOfWeek(today), -7);
      return build(key, start, addDays(start, 7));
    }
    case "last-7":
      return build(key, addDays(today, -6), tomorrow);
    case "this-month":
      return build(key, startOfMonth(today), addMonths(today, 1));
    case "last-month":
      return build(key, addMonths(today, -1), startOfMonth(today));
    case "last-30":
      return build(key, addDays(today, -29), tomorrow);
    case "this-quarter": {
      const start = new Date(Date.UTC(today.getUTCFullYear(), Math.floor(today.getUTCMonth() / 3) * 3, 1));
      return build(key, start, addMonths(start, 3));
    }
    case "this-year": {
      const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      return build(key, start, new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1)));
    }
    case "all":
      return {
        key,
        rangeLabel: "",
        start: null,
        endExclusive: null,
        fromISO: "",
        toISO: "",
        shiftable: false,
      };
    case "custom": {
      const from = parseISODate(params.from);
      const to = parseISODate(params.to);
      if (!from || !to || to < from) break;
      return build(key, from, addDays(to, 1));
    }
  }

  const start = startOfWeek(today);
  return build("this-week", start, addDays(start, 7));
}

/** True when the range covers whole calendar months end to end. */
function isMonthAligned(start: Date, endInclusive: Date): boolean {
  const nextDay = addDays(endInclusive, 1);
  return start.getUTCDate() === 1 && nextDay.getUTCDate() === 1;
}

/**
 * Step a range one window backwards (`-1`) or forwards (`1`). Month-aligned
 * ranges move by whole calendar months so "last month" keeps landing on month
 * boundaries; everything else shifts by its own length in days.
 */
export function shiftRange(
  period: ResolvedPeriod,
  direction: -1 | 1,
): { from: string; to: string } | null {
  if (!period.start || !period.endExclusive) return null;
  const start = period.start;
  const endInclusive = addDays(period.endExclusive, -1);

  if (isMonthAligned(start, endInclusive)) {
    const months =
      (endInclusive.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (endInclusive.getUTCMonth() - start.getUTCMonth()) +
      1;
    const newStart = addMonths(start, direction * months);
    return { from: toISODate(newStart), to: toISODate(addDays(addMonths(newStart, months), -1)) };
  }

  const spanDays = Math.round((period.endExclusive.getTime() - start.getTime()) / DAY_MS);
  return {
    from: toISODate(addDays(start, direction * spanDays)),
    to: toISODate(addDays(endInclusive, direction * spanDays)),
  };
}
