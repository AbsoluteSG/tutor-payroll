import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/money";
import {
  BUSINESS_TZ,
  formatMinuteOfDay,
  toISODateInZone,
  utcToZonedParts,
} from "@/lib/time-zone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarGrid, type CalendarEntry } from "./calendar-grid";

/**
 * Every class, every tutor, on one calendar. No filter — that is the point:
 * the schedule page already answers "what is next" per row, and this answers
 * "is Thursday empty" and "is anyone double-booked", which a list cannot.
 *
 * Days and times are computed HERE, in the business zone, and shipped as
 * strings. Doing it in the browser would place a 9pm class on the wrong day for
 * any manager whose laptop is in a different zone from the studio.
 */

export const dynamic = "force-dynamic";

/** Months either side of today to load. */
const WINDOW_MONTHS = 3;

export default async function AdminCalendarPage() {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - WINDOW_MONTHS);
  const to = new Date(now);
  to.setMonth(to.getMonth() + WINDOW_MONTHS);

  const classes = await prisma.scheduledClass.findMany({
    where: { scheduledAt: { gte: from, lte: to } },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
      studentName: true,
      status: true,
      notes: true,
      tutor: { select: { id: true, name: true } },
      client: { select: { id: true, paymentName: true, displayName: true } },
      // Present only when this class came out of a public booking — the
      // relation is what distinguishes the two on the grid, and carries what
      // the family actually bought for the detail panel.
      bookingSlot: {
        select: {
          booking: {
            select: {
              id: true,
              subject: true,
              track: true,
              paidAmount: true,
              parentName: true,
              parentEmail: true,
            },
          },
        },
      },
    },
  });

  const entries: CalendarEntry[] = classes.map((c) => {
    // `minutes` is minutes from local midnight in the business zone, which is
    // exactly what formatMinuteOfDay takes — no clock arithmetic here.
    const { minutes } = utcToZonedParts(c.scheduledAt, BUSINESS_TZ);
    const booking = c.bookingSlot?.booking ?? null;
    return {
      id: c.id,
      day: toISODateInZone(c.scheduledAt, BUSINESS_TZ),
      /** Sorts correctly and is the y-position in the day view. */
      startMinutes: minutes,
      time: formatMinuteOfDay(minutes),
      endTime: formatMinuteOfDay(minutes + c.durationMinutes),
      tutorName: c.tutor.name,
      clientId: c.client.id,
      clientLabel: c.client.displayName ?? c.client.paymentName,
      studentName: c.studentName,
      durationMinutes: c.durationMinutes,
      status: c.status,
      notes: c.notes,
      booking: booking
        ? {
            id: booking.id,
            subject: booking.subject,
            track: booking.track,
            paid: booking.paidAmount ? formatUSD(booking.paidAmount) : null,
            parentName: booking.parentName,
            parentEmail: booking.parentEmail,
          }
        : null,
    };
  });

  const todayKey = toISODateInZone(now, BUSINESS_TZ);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendar</CardTitle>
          <CardDescription>
            Every tutor and every client, unfiltered. Times in{" "}
            {BUSINESS_TZ.split("/")[1]?.replace("_", " ")}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarGrid
            entries={entries}
            initialMonth={todayKey.slice(0, 7)}
            today={todayKey}
          />
        </CardContent>
      </Card>
    </div>
  );
}
