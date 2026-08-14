import { utcToZonedParts, zonedWallClockToUTC } from "@/lib/time-zone";

/**
 * Expanding "Tuesdays at 4pm × 6" into six actual instants.
 *
 * Pure, and nothing about the pattern is stored: the database holds the six
 * resulting slots, not the rule that produced them. That is what lets an
 * arbitrary multi-select UI be added later without a migration — it produces
 * the same array by a different route.
 *
 * ─── The one thing that must not be got wrong ───────────────────────────────
 * Stepping a week means adding seven days to the WALL CLOCK, not 7 × 86400000
 * milliseconds. A six-week block booked in late October crosses the November
 * DST boundary, and a millisecond step would quietly move every class after it
 * from 4:00 pm to 3:00 pm. The parent would arrive an hour early for four of
 * their six sessions.
 */

export const MAX_SESSIONS = 12;

export type SeriesSlot = { startsAt: Date; durationMinutes: number };

/**
 * `count` occurrences of the same weekday and time, one `intervalWeeks` apart,
 * anchored on `firstStartsAt` and expressed in `timeZone`.
 */
export function weeklySeries(opts: {
  firstStartsAt: Date;
  count: number;
  durationMinutes: number;
  timeZone: string;
  intervalWeeks?: number;
}): SeriesSlot[] {
  const {
    firstStartsAt,
    count,
    durationMinutes,
    timeZone,
    intervalWeeks = 1,
  } = opts;

  if (count < 1) return [];
  const capped = Math.min(count, MAX_SESSIONS);

  // The wall clock the parent picked. Every later occurrence keeps this time of
  // day; only the date moves.
  const anchor = utcToZonedParts(firstStartsAt, timeZone);

  const out: SeriesSlot[] = [];
  for (let i = 0; i < capped; i += 1) {
    // Date arithmetic in UTC purely as a calendar — Date.UTC handles month and
    // year rollover — then the result is read back as a wall clock in the
    // tutor's zone and converted to a real instant. The time-of-day never goes
    // through a millisecond step, which is what keeps it stable across DST.
    const calendar = new Date(
      Date.UTC(anchor.year, anchor.month - 1, anchor.day) +
        i * intervalWeeks * 7 * 86_400_000
    );

    out.push({
      startsAt: zonedWallClockToUTC(
        calendar.getUTCFullYear(),
        calendar.getUTCMonth() + 1,
        calendar.getUTCDate(),
        anchor.minutes,
        timeZone
      ),
      durationMinutes,
    });
  }

  return out;
}

/** "Tuesdays 4:00 PM × 6". Display only — never parsed back. */
export function seriesLabel(
  firstStartsAt: Date,
  count: number,
  timeZone: string
): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(firstStartsAt);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(firstStartsAt);

  if (count === 1) return `${weekday} ${time}`;
  return `${weekday}s ${time} × ${count}`;
}
