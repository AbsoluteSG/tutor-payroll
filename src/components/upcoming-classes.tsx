import Link from "next/link";
import { formatDuration } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type UpcomingClass = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  studentName: string;
  clientLabel: string;
};

export function UpcomingClasses({ rows }: { rows: UpcomingClass[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming classes</CardTitle>
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
                    {r.scheduledAt.toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
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
