import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUSD, formatDuration } from "@/lib/money";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * What a family sees: their sessions and what they have paid. Read-only by
 * design — changes go through the studio.
 *
 * ─── What must never appear here ────────────────────────────────────────────
 * This page is scoped to one clientId, and everything it reads is joined
 * through that. Two things are deliberately absent even though they sit one
 * relation away: the tutor's pay rate (RateCard.tutorRate / ClassSession
 * .tutorEarnings), which is the tutor's wage and none of the family's business,
 * and anything belonging to another client. Select explicitly here; a `include:
 * { tutor: true }` would ship the wage to the browser.
 */

export const dynamic = "force-dynamic";

const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Paid", className: "bg-green-500/10 text-green-500" },
  PARTIAL: { label: "Partly scheduled", className: "bg-amber-500/10 text-amber-500" },
  UNFULFILLED: { label: "Needs attention", className: "bg-red-500/10 text-red-500" },
  PENDING: { label: "Awaiting payment", className: "bg-blue-500/10 text-blue-500" },
  EXPIRED: { label: "Expired", className: "bg-muted text-muted-foreground" },
  CANCELED: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export default async function AccountPage() {
  const client = await requireClient();
  const now = new Date();

  const [upcoming, past, bookings, payments] = await Promise.all([
    prisma.scheduledClass.findMany({
      where: { clientId: client.id, scheduledAt: { gte: now }, status: { not: "CANCELED" } },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        studentName: true,
        notes: true,
        tutor: { select: { name: true } },
      },
    }),
    prisma.scheduledClass.findMany({
      where: { clientId: client.id, scheduledAt: { lt: now } },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        studentName: true,
        status: true,
        tutor: { select: { name: true } },
      },
    }),
    prisma.booking.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        subject: true,
        track: true,
        patternLabel: true,
        totalAmount: true,
        paidAmount: true,
        paidAt: true,
        createdAt: true,
        tutor: { select: { name: true } },
      },
    }),
    prisma.clientPayment.findMany({
      where: { clientId: client.id },
      orderBy: { receivedAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        method: true,
        receivedAt: true,
        note: true,
      },
    }),
  ]);

  const paidTotal = payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          {client.displayName ?? client.paymentName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your sessions and payments. To change a booking, get in touch and
          we&apos;ll sort it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming sessions</CardTitle>
          <CardDescription>
            {upcoming.length === 0
              ? "Nothing booked at the moment."
              : `${upcoming.length} scheduled. Times shown in ${BUSINESS_TZ.split("/")[1]?.replace("_", " ")}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              When you book a session it will appear here.
            </p>
          ) : (
            <ul className="grid gap-2">
              {upcoming.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border p-3"
                >
                  <span className="font-medium">
                    {formatInstant(c.scheduledAt, BUSINESS_TZ)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {c.studentName} with {c.tutor.name} ·{" "}
                    {formatDuration(c.durationMinutes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>
            {payments.length === 0
              ? "No payments recorded yet."
              : `${formatUSD(paidTotal)} received in total.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {bookings.length > 0 && (
            <ul className="grid gap-2">
              {bookings.map((b) => {
                const style = BOOKING_STATUS[b.status] ?? {
                  label: b.status,
                  className: "bg-muted text-muted-foreground",
                };
                return (
                  <li key={b.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="font-medium">
                        {b.subject} — {b.track}
                      </span>
                      <Badge className={style.className}>{style.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {b.patternLabel} with {b.tutor.name} ·{" "}
                      {formatUSD(Number(b.paidAmount ?? b.totalAmount))}
                      {b.paidAt
                        ? ` · paid ${formatInstant(b.paidAt, BUSINESS_TZ)}`
                        : " · not yet paid"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {payments.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Receipts</p>
              <ul className="grid gap-1.5">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm"
                  >
                    <span>{formatInstant(p.receivedAt, BUSINESS_TZ)}</span>
                    <span className="text-muted-foreground">
                      {formatUSD(Number(p.amount))} · {p.method.toLowerCase()}
                      {p.note ? ` · ${p.note}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bookings.length === 0 && payments.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Past sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No past sessions yet.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {past.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm"
                >
                  <span>{formatInstant(c.scheduledAt, BUSINESS_TZ)}</span>
                  <span className="text-muted-foreground">
                    {c.studentName} with {c.tutor.name} ·{" "}
                    {formatDuration(c.durationMinutes)}
                    {c.status === "CANCELED" ? " · cancelled" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
