import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openSlots, BOOKING_HORIZON_DAYS } from "@/lib/booking/availability";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import { removeAvailabilityExceptionAction } from "@/lib/actions/availability-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityForm, type WeekRanges } from "./availability-form";
import { ExceptionForm } from "./exception-form";

/**
 * Where a tutor says when they can teach.
 *
 * The preview at the bottom is the point of the page: availability rules are
 * abstract, and the only way to know you have typed them correctly is to see
 * the times a parent would actually be offered. It runs the same `openSlots`
 * the public API does, so what a tutor sees here is what the site will sell.
 */

function toTimeInput(minutes: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export default async function AvailabilityPage() {
  const user = await requireUser();

  const [me, rules, exceptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { timeZone: true, bookable: true },
    }),
    prisma.availabilityRule.findMany({
      where: { tutorId: user.id },
      orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
    }),
    prisma.availabilityException.findMany({
      where: { tutorId: user.id, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 50,
    }),
  ]);

  const tz = me?.timeZone ?? BUSINESS_TZ;

  const week: WeekRanges = {};
  for (const rule of rules) {
    const bucket = week[rule.weekday] ?? [];
    bucket.push({
      start: toTimeInput(rule.startMinute),
      end: toTimeInput(rule.endMinute),
    });
    week[rule.weekday] = bucket;
  }

  const from = new Date();
  const to = new Date(from.getTime() + BOOKING_HORIZON_DAYS * 86_400_000);
  const preview = await openSlots({
    tutorId: user.id,
    from,
    to,
    durationMinutes: 60,
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-lg font-medium">Availability</h1>
        <p className="text-sm text-muted-foreground">
          {me?.bookable
            ? "You're listed on the website — families can book these times."
            : "You're not listed on the website yet. Your manager turns that on."}
        </p>
      </div>

      <AvailabilityForm initial={week} timeZone={tz} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Days off</CardTitle>
          <CardDescription>
            Block out a whole day — a holiday, an exam week. Nothing can be
            booked on it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ExceptionForm />

          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing blocked out.</p>
          ) : (
            <ul className="grid gap-2">
              {exceptions.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <span className="text-sm">
                    {ex.date.toISOString().slice(0, 10)}
                    {ex.note ? ` · ${ex.note}` : ""}
                  </span>
                  <form action={removeAvailabilityExceptionAction}>
                    <input type="hidden" name="id" value={ex.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What families will see</CardTitle>
          <CardDescription>
            The next {BOOKING_HORIZON_DAYS} days, for a one-hour class, in your
            zone. Anything already on your schedule has been taken out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preview.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing bookable yet — add some windows above.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {preview.length} open{" "}
                {preview.length === 1 ? "time" : "times"}. Showing the first 24.
              </p>
              <ul className="flex flex-wrap gap-2">
                {preview.slice(0, 24).map((slot) => (
                  <li
                    key={slot.startsAt.toISOString()}
                    className="rounded-md border px-2.5 py-1 text-sm tabular-nums"
                  >
                    {formatInstant(slot.startsAt, tz)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
