import Link from "next/link";
import { formatDuration } from "@/lib/money";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type UpcomingClass = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  studentName: string;
  clientLabel: string;
};

export function UpcomingClasses({
  rows,
  /**
   * The zone to show times in. This is a server component's `toLocaleString`
   * otherwise, which renders in the host's zone — so a tutor in Miami saw
   * whatever timezone Vercel happened to be in rather than a time they could
   * act on. Defaults to the business zone until tutors carry their own.
   */
  timeZone = BUSINESS_TZ,
  /** Where "view all" points. Omitted on surfaces that already show everything. */
  viewAllHref,
}: {
  rows: UpcomingClass[];
  timeZone?: string;
  viewAllHref?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Upcoming classes</CardTitle>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            View all &rarr;
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing scheduled — your manager will add classes here.
          </p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="grid gap-0.5">
                  <span className="font-medium">
                    {formatInstant(r.scheduledAt, timeZone)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {r.clientLabel} · {r.studentName} · {formatDuration(r.durationMinutes)}
                  </span>
                </div>
                <Link
                  href={`/submit?scheduledId=${r.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Log this
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
