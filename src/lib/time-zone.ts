/**
 * Wall clocks, instants, and the conversion between them.
 *
 * ─── Why this exists ────────────────────────────────────────────────────────
 * The app had two disagreeing date models. `ClassSession.date` is a `@db.Date`
 * and `periods.ts` reads it as UTC; `ScheduledClass.scheduledAt` is a timestamp
 * that was *parsed* and *rendered* in whatever timezone the server happened to
 * run in. On a developer's machine in New York those two agree by accident. On
 * a UTC host they do not, and an 8:00 pm class on the 21st becomes the 22nd —
 * which quietly moves a tutor's earnings into the wrong week in every report.
 *
 * The rule this module enforces:
 *
 *   • An INSTANT is always UTC. `Date` objects in the database are instants.
 *   • A WALL CLOCK ("Tuesday 4:00 pm") is meaningless without a zone, so it is
 *     always carried with one, and converted at the boundary — here.
 *
 * Nothing in this file touches Prisma or `next/*`, matching the discipline in
 * `periods.ts`, so client components can import it too.
 *
 * ─── Why hand-rolled ────────────────────────────────────────────────────────
 * `Intl.DateTimeFormat` already ships a complete, maintained IANA database in
 * every runtime we target, so the conversions below need no dependency and no
 * timezone data to keep up to date. The cost is that the inverse conversion
 * (wall clock → instant) has to be solved by probing rather than read off a
 * table — see `zonedWallClockToUTC`. That function is the reason this file has
 * an unusually thorough test suite; if it is ever wrong, bookings land at the
 * wrong hour and money follows them.
 */

/** Borough Prep is in Brooklyn. Public-facing times are quoted in this zone. */
export const BUSINESS_TZ = "America/New_York";

const MINUTE_MS = 60_000;

export type ZonedParts = {
  year: number;
  month: number;
  /** Day of the month, 1–31. */
  day: number;
  /** 0 = Sunday … 6 = Saturday, as observed in the zone. */
  weekday: number;
  /** Minutes from local midnight. 15:30 → 930. */
  minutes: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Formatters are comparatively expensive to construct and we build them in
 * loops (a month of candidate slots is hundreds of calls), so they are cached
 * per zone.
 */
const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Decompose a UTC instant into the wall clock an observer in `timeZone` sees. */
export function utcToZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  // h23 still renders midnight as "24" in some ICU versions; normalise it.
  const hour = Number(get("hour")) % 24;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: hour * 60 + Number(get("minute")),
  };
}

/** How far `instant` sits from the wall clock we wanted, in minutes. */
function driftMinutes(
  instant: Date,
  timeZone: string,
  target: { year: number; month: number; day: number; minutes: number }
): number {
  const seen = utcToZonedParts(instant, timeZone);
  const seenDays = Date.UTC(seen.year, seen.month - 1, seen.day) / 60_000;
  const wantDays = Date.UTC(target.year, target.month - 1, target.day) / 60_000;
  return seenDays + seen.minutes - (wantDays + target.minutes);
}

/**
 * The inverse of `utcToZonedParts`: a wall clock in `timeZone` → the UTC instant.
 *
 * There is no direct API for this, so it is solved by probing. Treat the wall
 * clock as though it were UTC, measure how far that lands from the wall clock we
 * actually wanted, and subtract the difference. One correction is enough for
 * every fixed offset; the second pass catches the case where the correction
 * itself steps across a DST boundary.
 *
 * The two awkward days of the year:
 *
 *   • Spring forward — 2:30 am does not exist. The drift never reaches zero, and
 *     the result lands on 3:30 am. Resolving forward is the conventional choice
 *     and the right one for booking: the slot simply starts an hour later.
 *   • Fall back — 1:30 am happens twice. The probe converges on the first
 *     (daylight-time) occurrence, which is the earlier instant.
 *
 * Both are pinned in the tests rather than left to chance.
 */
export function zonedWallClockToUTC(
  year: number,
  month: number,
  day: number,
  minutes: number,
  timeZone: string
): Date {
  const target = { year, month, day, minutes };
  const naive = Date.UTC(year, month - 1, day) + minutes * MINUTE_MS;

  // Probe once with the offset in force at the naive guess.
  const first = new Date(naive - driftMinutes(new Date(naive), timeZone, target) * MINUTE_MS);
  const firstResidual = driftMinutes(first, timeZone, target);
  if (firstResidual === 0) return first;

  // The correction stepped across a transition. Re-probe with the offset in
  // force at the corrected instant.
  const second = new Date(first.getTime() - firstResidual * MINUTE_MS);
  if (driftMinutes(second, timeZone, target) === 0) return second;

  // Neither round-trips, so this wall clock does not exist — we are inside the
  // spring-forward gap and the two candidates straddle it. Taking the later one
  // is the forward resolution: 2:30 am becomes 3:30 am rather than falling back
  // to 1:30 am, so a booked slot slips an hour instead of silently moving to
  // before the tutor said they were free.
  return first.getTime() >= second.getTime() ? first : second;
}

/**
 * The calendar date an observer in `timeZone` sees, as `YYYY-MM-DD`.
 *
 * This is what a `<input type="date">` and `ClassSession.date` both want. It
 * replaces the server-local `toDateInput` helpers that produced the wrong day
 * on a UTC host.
 */
export function toISODateInZone(instant: Date, timeZone: string): string {
  const { year, month, day } = utcToZonedParts(instant, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The `YYYY-MM-DDTHH:mm` a `<input type="datetime-local">` wants. */
export function toDateTimeLocalInZone(instant: Date, timeZone: string): string {
  const { minutes } = utcToZonedParts(instant, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toISODateInZone(instant, timeZone)}T${pad(Math.floor(minutes / 60))}:${pad(
    minutes % 60
  )}`;
}

/**
 * Parse the `YYYY-MM-DDTHH:mm` a `datetime-local` input produces, reading it as
 * a wall clock in `timeZone`. Returns null on anything malformed — callers are
 * validating user input and should say so rather than get an Invalid Date.
 */
export function parseDateTimeLocalInZone(
  value: string,
  timeZone: string
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59) return null;

  const instant = zonedWallClockToUTC(year, month, day, hour * 60 + minute, timeZone);
  // Rejects 31 February and friends: a rolled-over date won't read back the
  // same, and `Date.UTC` rolls silently.
  const seen = utcToZonedParts(instant, timeZone);
  if (seen.day !== day || seen.month !== month || seen.year !== year) return null;
  return instant;
}

/** "Tue, Aug 12, 4:00 PM". Every render of an instant should go through here. */
export function formatInstant(
  instant: Date,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(instant);
}

/** 930 → "3:30 PM". For availability rules, which store minutes, not instants. */
export function formatMinuteOfDay(minutes: number): string {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/**
 * The zone the visitor's browser is in, for showing a second clock beside the
 * business one. Falls back to the business zone where `Intl` is unavailable.
 */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || BUSINESS_TZ;
  } catch {
    return BUSINESS_TZ;
  }
}
