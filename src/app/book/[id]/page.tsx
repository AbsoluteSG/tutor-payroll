import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { commitBookingCheckout } from "@/lib/booking/commit";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import { formatUSD } from "@/lib/money";

/**
 * Where Stripe sends the parent back to.
 *
 * Mirrors /pay/[id]: if the booking is still PENDING but has a session, the
 * session is retrieved and committed here. That is the backstop for a webhook
 * that has not landed yet — and in local development, where no webhook is
 * configured at all, it is the only path that ever confirms a booking.
 *
 * The id is a bearer token. Anyone with the link sees the booking, so nothing
 * on this page may go beyond what the parent themselves typed and their own
 * times — no tutor pay rate, no other client's name.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your booking — Borough Prep",
  robots: { index: false, follow: false },
};

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";
const ACCENT = "var(--v3-accent)";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tutor: { select: { name: true, timeZone: true } },
      slots: { orderBy: { startsAt: "asc" } },
    },
  });
  if (!booking) notFound();

  // Confirm without waiting on the webhook.
  if (booking.status === "PENDING" && booking.stripeSessionId && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(
        booking.stripeSessionId
      );
      if (await commitBookingCheckout(session)) {
        booking = await prisma.booking.findUnique({
          where: { id },
          include: {
            tutor: { select: { name: true, timeZone: true } },
            slots: { orderBy: { startsAt: "asc" } },
          },
        });
      }
    } catch (error) {
      console.error("[booking] return-page sync failed", error);
    }
  }
  if (!booking) notFound();

  const tz = booking.bookedTimeZone || BUSINESS_TZ;
  const confirmed = booking.slots.filter((s) => s.status === "CONFIRMED");
  const lost = booking.slots.filter((s) => s.status === "CONFLICTED");
  const paid = booking.status === "CONFIRMED" || booking.status === "PARTIAL";

  return (
    <div
      className={`${editorial.variable} flex min-h-[100svh] flex-col px-5 py-14 sm:px-8`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-55">
          Borough Prep
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(2.2rem,6vw,3.6rem)] leading-[0.98] tracking-[-0.02em]">
          {booking.status === "CONFIRMED"
            ? "You're booked."
            : booking.status === "PARTIAL"
              ? "Mostly booked."
              : booking.status === "PENDING"
                ? "Not paid yet."
                : "This booking has ended."}
        </h1>

        <p className="mt-5 text-[0.95rem] leading-relaxed opacity-75">
          {booking.status === "CONFIRMED" && (
            <>
              {confirmed.length}{" "}
              {confirmed.length === 1 ? "session" : "sessions"} with{" "}
              {booking.tutor.name}. We&rsquo;ve emailed nothing yet —{" "}
              {booking.parentEmail} is on file and someone will be in touch
              before the first one.
            </>
          )}
          {booking.status === "PARTIAL" && (
            <>
              {confirmed.length} of {booking.slots.length} sessions are
              confirmed. {lost.length}{" "}
              {lost.length === 1 ? "time was" : "times were"} taken before your
              payment finished — we&rsquo;ll call you to rearrange{" "}
              {lost.length === 1 ? "it" : "them"} or refund the difference.
            </>
          )}
          {booking.status === "PENDING" && (
            <>
              These times are held until{" "}
              {formatInstant(booking.holdExpiresAt, tz)}. If you closed the
              payment page, start again from the course page.
            </>
          )}
          {(booking.status === "EXPIRED" ||
            booking.status === "CANCELED" ||
            booking.status === "UNFULFILLED") && (
            <>
              Nothing was scheduled.{" "}
              {booking.status === "UNFULFILLED"
                ? "Your payment went through but the times had gone — we'll be in touch to sort it out."
                : "The hold ran out before payment. You can book again any time."}
            </>
          )}
        </p>

        <div
          className="mt-9 rounded-[0.8rem] border border-current/15 p-6"
          style={{ backgroundColor: "var(--v3-card)" }}
        >
          <p className="font-mono text-[0.52rem] tracking-[0.2em] uppercase opacity-55">
            {booking.subject} · {booking.track}
          </p>
          <p className="mt-2 text-[1.05rem]">
            {booking.studentName} with {booking.tutor.name}
          </p>

          <ul className="mt-5 grid gap-2 border-t border-current/12 pt-5">
            {booking.slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-baseline justify-between gap-3 text-[0.92rem]"
              >
                <span
                  className={
                    slot.status === "CONFIRMED" ? "" : "line-through opacity-50"
                  }
                >
                  {formatInstant(slot.startsAt, tz)}
                </span>
                <span className="font-mono text-[0.5rem] tracking-[0.14em] uppercase opacity-60">
                  {slot.status === "CONFIRMED"
                    ? "confirmed"
                    : slot.status === "CONFLICTED"
                      ? "unavailable"
                      : slot.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-baseline justify-between border-t border-current/12 pt-5">
            <span className="font-mono text-[0.52rem] tracking-[0.16em] uppercase opacity-55">
              {paid ? "Paid" : "Total"}
            </span>
            <span className="font-[family-name:var(--font-editorial)] text-[1.6rem]">
              {formatUSD(booking.paidAmount ?? booking.totalAmount)}
            </span>
          </div>

          <p className="mt-3 text-[0.8rem] leading-relaxed opacity-60">
            Times shown in {tz.replace("_", " ")}.
          </p>
        </div>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center rounded-full border border-current/25 px-6 py-3 font-mono text-[0.62rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
          >
            Back to courses
          </Link>
          <a
            href="mailto:hello@boroughprep.com"
            className="inline-flex items-center rounded-full px-6 py-3 font-mono text-[0.62rem] tracking-[0.16em] uppercase"
            style={{ backgroundColor: ACCENT, color: PAPER }}
          >
            Something wrong? Email us
          </a>
        </div>
      </div>
    </div>
  );
}
