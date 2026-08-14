import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/money";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import { expireStaleBookings } from "@/lib/booking/commit";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingRowActions } from "./booking-row-actions";

/**
 * Bookings taken on the public site.
 *
 * Anything that needs a human comes first and stays first — a booking where
 * money arrived but a session could not be scheduled is the one state in this
 * whole system where a family has paid for something they have not got, and it
 * must not be somewhere on page two.
 *
 * Loading the page also reaps expired holds. There is no cron in this stack, so
 * the two things that free a lapsed hold are a tutor's availability being read
 * and this page being opened.
 */

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-green-500/10 text-green-500",
  PARTIAL: "bg-amber-500/10 text-amber-500",
  UNFULFILLED: "bg-red-500/10 text-red-500",
  PENDING: "bg-blue-500/10 text-blue-500",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELED: "bg-muted text-muted-foreground",
};

export default async function BookingsPage() {
  await expireStaleBookings();

  const bookings = await prisma.booking.findMany({
    // `needsAttention` descending puts true first — the whole ordering of this
    // page exists to answer "does anyone need me right now".
    orderBy: [{ needsAttention: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      tutor: { select: { name: true } },
      client: { select: { id: true, paymentName: true, displayName: true } },
      slots: { orderBy: { startsAt: "asc" } },
    },
  });

  const attention = bookings.filter((b) => b.needsAttention).length;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bookings</CardTitle>
          <CardDescription>
            {attention === 0
              ? "Taken on the website. Nothing needs attention."
              : `${attention} ${attention === 1 ? "booking needs" : "bookings need"} attention — money arrived but not every session was scheduled.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            <ul className="grid gap-3">
              {bookings.map((b) => {
                const confirmed = b.slots.filter((s) => s.status === "CONFIRMED");
                const lost = b.slots.filter((s) => s.status === "CONFLICTED");
                return (
                  <li
                    key={b.id}
                    data-reveal
                    className={`rounded-lg border p-4 ${
                      b.needsAttention ? "border-amber-500/40 bg-amber-500/[0.03]" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{b.parentName}</span>
                          <Badge variant="outline" className={STATUS_STYLE[b.status]}>
                            {b.status.toLowerCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {b.subject} · {b.tutor.name}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {b.studentName} ·{" "}
                          <a
                            href={`mailto:${b.parentEmail}`}
                            className="underline underline-offset-2"
                          >
                            {b.parentEmail}
                          </a>
                          {b.client && (
                            <>
                              {" · "}
                              <Link
                                href={`/admin/clients/${b.client.id}`}
                                className="underline underline-offset-2"
                              >
                                {b.client.displayName ?? b.client.paymentName}
                              </Link>
                            </>
                          )}
                        </p>
                        {b.patternLabel && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {b.patternLabel}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {formatUSD(b.paidAmount ?? b.totalAmount)}
                          {b.paidAmount ? "" : " (unpaid)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatInstant(b.createdAt, BUSINESS_TZ)}
                        </span>
                        <BookingRowActions
                          id={b.id}
                          needsAttention={b.needsAttention}
                          paid={b.paidAmount !== null}
                          suggestedRefund={b.unfulfilledAmount.toFixed(2)}
                          canCancel={
                            b.status === "PENDING" ||
                            b.status === "CONFIRMED" ||
                            b.status === "PARTIAL"
                          }
                        />
                      </div>
                    </div>

                    {b.needsAttention && b.attentionNote && (
                      <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-sm">
                        {b.attentionNote}
                        {b.unfulfilledAmount.gt(0) && (
                          <>
                            {" "}
                            <strong className="font-medium">
                              {formatUSD(b.unfulfilledAmount)}
                            </strong>{" "}
                            is paid for with nothing behind it.
                          </>
                        )}
                      </p>
                    )}

                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {b.slots.map((s) => (
                        <li
                          key={s.id}
                          className={`rounded-md border px-2 py-1 text-xs tabular-nums ${
                            s.status === "CONFIRMED"
                              ? ""
                              : s.status === "CONFLICTED"
                                ? "border-red-500/40 text-red-400 line-through"
                                : "text-muted-foreground line-through"
                          }`}
                          title={s.releasedReason ?? undefined}
                        >
                          {formatInstant(s.startsAt, BUSINESS_TZ)}
                        </li>
                      ))}
                    </ul>

                    {lost.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {confirmed.length} of {b.slots.length} scheduled.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
