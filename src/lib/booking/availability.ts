import { prisma } from "@/lib/prisma";
import { utcToZonedParts, zonedWallClockToUTC } from "@/lib/time-zone";

/**
 * Turning a tutor's weekly pattern into bookable times.
 *
 * Split the same way `stripe-payments.ts` splits `evaluateCheckoutSession` from
 * `recordCheckoutResult`: the decision core is pure and unit-tested, and the
 * part that touches the database is a thin wrapper around it. Everything hard
 * here is arithmetic — overlap, DST, half-open intervals — and none of it
 * should need a database to test.
 */

/** A bookable start time. */
export type Slot = { startsAt: Date; durationMinutes: number };

/** A window the tutor is not free. Half-open: [start, end). */
export type Busy = { start: Date; end: Date };

/**
 * A stranger must not be able to book a class starting in twenty minutes. This
 * is the tutor's protection, not a technical limit.
 */
export const MIN_LEAD_HOURS = 24;

/** How far ahead the public grid runs. */
export const BOOKING_HORIZON_DAYS = 28;

/** Starts are offered on the half hour. */
export const SLOT_GRANULARITY_MINUTES = 30;

const MINUTE_MS = 60_000;

/**
 * Candidate starts inside one local date, from that weekday's rules.
 *
 * Pure. Takes the calendar date as parts rather than a `Date` so there is no
 * hidden zone in the input — the zone is the explicit argument.
 *
 * A slot must fit entirely inside its window, so a 60-minute class needs a
 * window of at least 60 minutes; a 4:00–5:00 window offers 4:00 and nothing
 * else at that length.
 */
export function candidatesForDate(
  rules: { startMinute: number; endMinute: number }[],
  year: number,
  month: number,
  day: number,
  timeZone: string,
  durationMinutes: number,
  granularity: number = SLOT_GRANULARITY_MINUTES
): Slot[] {
  const slots: Slot[] = [];

  for (const rule of rules) {
    // Round the first candidate up to the granularity so a window starting at
    // 3:50 offers 4:00, not 3:50.
    const first = Math.ceil(rule.startMinute / granularity) * granularity;
    for (
      let minute = first;
      minute + durationMinutes <= rule.endMinute;
      minute += granularity
    ) {
      slots.push({
        startsAt: zonedWallClockToUTC(year, month, day, minute, timeZone),
        durationMinutes,
      });
    }
  }

  // Two overlapping rules on the same day would otherwise emit the same start
  // twice. The server action rejects overlaps, so this is belt and braces.
  const seen = new Set<number>();
  return slots
    .filter((s) => {
      const key = s.startsAt.getTime();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Drop every candidate that overlaps something already booked.
 *
 * Pure. Intervals are half-open on both sides, which is the whole subtlety: a
 * class ending at 4:00 must NOT block a slot starting at 4:00, and a slot
 * ending at 4:00 must not be blocked by a class starting at 4:00.
 */
export function subtractBusy(candidates: Slot[], busy: Busy[]): Slot[] {
  if (busy.length === 0) return candidates;

  return candidates.filter((slot) => {
    const start = slot.startsAt.getTime();
    const end = start + slot.durationMinutes * MINUTE_MS;
    return !busy.some((b) => start < b.end.getTime() && b.start.getTime() < end);
  });
}

/** Every local date between two instants, as seen in `timeZone`. */
function datesInRange(from: Date, to: Date, timeZone: string) {
  const dates: { year: number; month: number; day: number; weekday: number }[] = [];
  // Step by a day at a time from the local date of `from`. Walking UTC days
  // would skip or repeat a date whenever the zone offset crosses midnight.
  let cursor = from;
  let guard = 0;
  while (cursor.getTime() <= to.getTime() && guard < 400) {
    const parts = utcToZonedParts(cursor, timeZone);
    dates.push({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      weekday: parts.weekday,
    });
    // Midday on the following local date — noon avoids landing inside a DST
    // gap, where a midnight-based step could resolve back onto the same day.
    cursor = new Date(
      zonedWallClockToUTC(parts.year, parts.month, parts.day, 12 * 60, timeZone).getTime() +
        24 * 60 * MINUTE_MS
    );
    guard += 1;
  }
  return dates;
}

/**
 * What a tutor actually has free, between two instants.
 *
 * Subtracts, in order: days blocked by an exception, then everything already on
 * the calendar. Both `ScheduledClass` (manager-created, and the destination of
 * every confirmed booking) and any live `BookingSlot` hold count as busy — a
 * slot being paid for right now must not be offered to somebody else.
 */
export async function openSlots(opts: {
  tutorId: string;
  from: Date;
  to: Date;
  durationMinutes: number;
}): Promise<Slot[]> {
  const { tutorId, from, to, durationMinutes } = opts;

  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
    select: { timeZone: true },
  });
  if (!tutor) return [];
  const timeZone = tutor.timeZone;

  const [rules, exceptions, scheduled] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { tutorId },
      select: { weekday: true, startMinute: true, endMinute: true },
    }),
    prisma.availabilityException.findMany({
      where: { tutorId, date: { gte: startOfDay(from), lte: to } },
      select: { date: true, allDay: true, startMinute: true, endMinute: true },
    }),
    prisma.scheduledClass.findMany({
      where: {
        tutorId,
        status: { not: "CANCELED" },
        scheduledAt: { gte: addMinutes(from, -600), lte: to },
      },
      select: { scheduledAt: true, durationMinutes: true },
    }),
  ]);

  if (rules.length === 0) return [];

  const byWeekday = new Map<number, typeof rules>();
  for (const rule of rules) {
    const bucket = byWeekday.get(rule.weekday);
    if (bucket) bucket.push(rule);
    else byWeekday.set(rule.weekday, [rule]);
  }

  // Exceptions are keyed by the local date they name. `@db.Date` comes back as
  // midnight UTC, so it is read in UTC rather than the tutor's zone — the value
  // is a calendar date, not an instant.
  const blocked = new Map<string, { start: number; end: number }[]>();
  for (const ex of exceptions) {
    const key = ex.date.toISOString().slice(0, 10);
    const spans = blocked.get(key) ?? [];
    spans.push(
      ex.allDay || ex.startMinute == null || ex.endMinute == null
        ? { start: 0, end: 1440 }
        : { start: ex.startMinute, end: ex.endMinute }
    );
    blocked.set(key, spans);
  }

  const busy: Busy[] = scheduled.map((s) => ({
    start: s.scheduledAt,
    end: addMinutes(s.scheduledAt, s.durationMinutes),
  }));

  // Nothing sooner than the lead time, whatever the caller asked for.
  const earliest = addMinutes(new Date(), MIN_LEAD_HOURS * 60);

  const out: Slot[] = [];
  for (const date of datesInRange(from, to, timeZone)) {
    const dayRules = byWeekday.get(date.weekday);
    if (!dayRules || dayRules.length === 0) continue;

    const key = `${date.year}-${pad(date.month)}-${pad(date.day)}`;
    const holes = blocked.get(key) ?? [];

    const effective = holes.some((h) => h.start === 0 && h.end === 1440)
      ? []
      : dayRules.filter(
          (r) => !holes.some((h) => r.startMinute < h.end && h.start < r.endMinute)
        );

    for (const slot of candidatesForDate(
      effective,
      date.year,
      date.month,
      date.day,
      timeZone,
      durationMinutes
    )) {
      if (slot.startsAt < earliest) continue;
      if (slot.startsAt < from || slot.startsAt > to) continue;
      out.push(slot);
    }
  }

  return subtractBusy(out, busy).sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
