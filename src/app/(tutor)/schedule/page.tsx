import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/money";
import { BUSINESS_TZ, formatInstant, toISODateInZone } from "@/lib/time-zone";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * A tutor's own schedule.
 *
 * The dashboard shows the next five classes and nothing else — no "view all",
 * no route — so a tutor with six upcoming classes could not see the sixth
 * anywhere in the app. This is that page.
 *
 * Times render in the tutor's OWN zone, not the server's and not the
 * business's. Tutors are spread across several states, and a class time they
 * have to convert in their head is a class they turn up late to.
 */

export default async function TutorSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ past?: string }>;
}) {
  const user = await requireUser();
  const { past } = await searchParams;
  const showPast = past === "1";

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timeZone: true },
  });
  const tz = me?.timeZone ?? BUSINESS_TZ;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = await prisma.scheduledClass.findMany({
    where: {
      tutorId: user.id,
      ...(showPast ? {} : { scheduledAt: { gte: startOfToday } }),
    },
    orderBy: { scheduledAt: showPast ? "desc" : "asc" },
    // No `take`. The point of this page is that nothing is hidden; the cap is
    // a generous safety valve, not a pagination scheme.
    take: 200,
    include: { client: { select: { paymentName: true, displayName: true } } },
  });

  // Grouped by the tutor's own calendar day, so "Tuesday" means their Tuesday.
  const days = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = toISODateInZone(row.scheduledAt, tz);
    const bucket = days.get(key);
    if (bucket) bucket.push(row);
    else days.set(key, [row]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">Your schedule</h1>
          <p className="text-sm text-muted-foreground">
            Times shown in {tz.replace("_", " ")}. Ask your manager if that&apos;s
            wrong.
          </p>
        </div>
        <Link
          href={showPast ? "/schedule" : "/schedule?past=1"}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {showPast ? "Show upcoming" : "Show past"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {showPast
              ? "Nothing in the past."
              : "Nothing scheduled — your manager will add classes here."}
          </CardContent>
        </Card>
      ) : (
        [...days.entries()].map(([day, items]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-base">
                {formatInstant(items[0].scheduledAt, tz, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: undefined,
                  minute: undefined,
                })}
              </CardTitle>
              <CardDescription>
                {items.length} {items.length === 1 ? "class" : "classes"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {items.map((r) => (
                <div
                  key={r.id}
                  data-reveal
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="grid gap-0.5">
                    <span className="font-medium">
                      {formatInstant(r.scheduledAt, tz, {
                        weekday: undefined,
                        month: undefined,
                        day: undefined,
                      })}{" "}
                      · {formatDuration(r.durationMinutes)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {r.client.displayName ?? r.client.paymentName} ·{" "}
                      {r.studentName}
                    </span>
                    {r.notes && (
                      <span className="text-sm text-muted-foreground">
                        {r.notes}
                      </span>
                    )}
                  </div>

                  {r.status === "SCHEDULED" ? (
                    <Link
                      href={`/submit?scheduledId=${r.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Log this
                    </Link>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        r.status === "COMPLETED"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {r.status === "COMPLETED" ? "logged" : "canceled"}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
