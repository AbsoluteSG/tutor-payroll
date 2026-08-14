import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { Prisma } from "@/generated/prisma/client";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Mint a fresh Checkout session for a payment request. Called every time a
 * client opens /pay/[id] — sessions expire in 24h but our links must not.
 */
export async function createCheckoutSession(request: {
  id: string;
  clientId: string;
  amount: Prisma.Decimal;
  note: string | null;
  clientLabel: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "us_bank_account"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: request.amount.mul(100).toNumber(),
          product_data: {
            name: `Tutoring — ${request.clientLabel}`,
            ...(request.note ? { description: request.note } : {}),
          },
        },
      },
    ],
    metadata: { paymentRequestId: request.id, clientId: request.clientId },
    success_url: `${appUrl()}/pay/${request.id}?back=1`,
    cancel_url: `${appUrl()}/pay/${request.id}`,
  });
}

/**
 * Stripe's minimum `expires_at` is 30 minutes, so the hold is 35 — long enough
 * to satisfy Stripe, short enough that an abandoned checkout does not sit on
 * somebody's Tuesday afternoon for an hour.
 */
export const HOLD_MINUTES = 35;

/**
 * Checkout for a self-serve booking. Sibling of `createCheckoutSession`, and
 * deliberately different in three ways:
 *
 *   • **Card only.** The invoice flow accepts `us_bank_account` because a late
 *     ACH settlement is harmless there. Here it would be actively wrong: ACH
 *     takes days to clear, a slot cannot be held that long, and a class must
 *     not start unpaid. ACH stays on /pay/[id].
 *   • **`expires_at`**, set to the same instant as the booking's own hold, so
 *     Stripe and the database agree on when the slots come free. Without it a
 *     stale tab could pay for time that was resold half an hour ago.
 *   • **`metadata.bookingId`**, which is how the webhook tells a booking from
 *     an invoice.
 */
export async function createBookingCheckoutSession(booking: {
  id: string;
  tutorName: string;
  subject: string;
  sessionCount: number;
  whenLabel: string;
  amount: Prisma.Decimal;
  parentEmail: string;
  holdExpiresAt: Date;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const plural = booking.sessionCount === 1 ? "session" : "sessions";

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    // Prefill only — no Stripe Customer object is created, keeping this
    // integration's "no Customers, no Products/Prices catalog" shape.
    customer_email: booking.parentEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: booking.amount.mul(100).toNumber(),
          product_data: {
            name: `${booking.sessionCount} ${plural} with ${booking.tutorName}`,
            description: `${booking.subject} — ${booking.whenLabel}`,
          },
        },
      },
    ],
    metadata: { bookingId: booking.id },
    expires_at: Math.floor(booking.holdExpiresAt.getTime() / 1000),
    success_url: `${appUrl()}/book/${booking.id}?paid=1`,
    cancel_url: `${appUrl()}/book/${booking.id}?canceled=1`,
  });
}

/** The decision core, pure so it's unit-testable. */
export function evaluateCheckoutSession(session: {
  payment_status: string;
  amount_total: number | null;
  metadata: Record<string, string> | null;
}): { record: boolean; amount?: Prisma.Decimal; paymentRequestId?: string; clientId?: string } {
  const paymentRequestId = session.metadata?.paymentRequestId;
  const clientId = session.metadata?.clientId;
  if (!paymentRequestId || !clientId) return { record: false };
  // Cards are "paid" at completion; ACH stays "unpaid" until the async
  // succeeded event arrives with payment_status "paid".
  if (session.payment_status !== "paid") return { record: false };
  if (session.amount_total == null || session.amount_total <= 0) return { record: false };
  return {
    record: true,
    amount: new Prisma.Decimal(session.amount_total).div(100),
    paymentRequestId,
    clientId,
  };
}

/**
 * The booking equivalent, pure for the same reason.
 *
 * Kept separate from `evaluateCheckoutSession` rather than generalised: the two
 * read different metadata keys, and a single function that accepted either
 * would happily record a booking as an invoice payment if a key were ever
 * mistyped. Two narrow functions cannot make that mistake.
 */
export function evaluateBookingSession(session: {
  payment_status: string;
  amount_total: number | null;
  metadata: Record<string, string> | null;
}): { record: boolean; amount?: Prisma.Decimal; bookingId?: string } {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return { record: false };
  if (session.payment_status !== "paid") return { record: false };
  if (session.amount_total == null || session.amount_total <= 0) {
    return { record: false };
  }
  return {
    record: true,
    amount: new Prisma.Decimal(session.amount_total).div(100),
    bookingId,
  };
}

/**
 * Idempotently record the outcome of a Checkout session: mark the request
 * PAID and create the ClientPayment ledger row. Safe to call repeatedly
 * (webhook retries, manual sync) — the unique stripeSessionId dedupes.
 */
export async function recordCheckoutResult(session: Stripe.Checkout.Session): Promise<boolean> {
  const result = evaluateCheckoutSession({
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    metadata: session.metadata,
  });
  if (!result.record) return false;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.clientPayment.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (existing) return;

    await tx.clientPayment.create({
      data: {
        clientId: result.clientId!,
        amount: result.amount!,
        method: "STRIPE",
        stripeSessionId: session.id,
        note: "Paid via payment link",
        receivedAt: new Date(),
      },
    });
    await tx.paymentRequest.update({
      where: { id: result.paymentRequestId! },
      data: { status: "PAID", paidAt: new Date(), stripeSessionId: session.id },
    });
  });
  return true;
}
