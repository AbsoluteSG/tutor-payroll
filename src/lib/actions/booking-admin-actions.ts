"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { commitBookingCheckout } from "@/lib/booking/commit";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

/**
 * What a manager does about a booking that did not go cleanly.
 *
 * The three verbs mirror the payment-request ones deliberately: sync when the
 * webhook is late, cancel when it is dead, and mark resolved when a human has
 * dealt with it. Nothing here invents a new pattern.
 */

/**
 * Backstop for a missed webhook, exactly like `syncPaymentRequestAction`.
 * Idempotent, because `commitBookingCheckout` is.
 */
export async function syncBookingAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  if (!stripeConfigured()) return { error: "Stripe isn't configured." };

  const id = String(formData.get("id") ?? "");
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { stripeSessionId: true },
  });
  if (!booking?.stripeSessionId) {
    return { error: "That booking never reached Stripe." };
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(
      booking.stripeSessionId
    );
    await commitBookingCheckout(session);
  } catch (error) {
    console.error("[booking] manual sync failed", error);
    return { error: "Stripe wouldn't answer. Try again." };
  }

  revalidatePath("/admin/bookings");
  return {};
}

/**
 * Kill a booking and free its slots.
 *
 * Cancels the scheduled classes too — leaving them behind would put a tutor in
 * front of a family who is no longer coming. Any money already taken is
 * deliberately NOT touched: it stays in the ledger as a credit on the client
 * until someone refunds it, because silently deleting a payment record is how
 * books stop balancing.
 */
export async function cancelBookingAction(formData: FormData): Promise<ActionResult> {
  await requireManager();

  const id = String(formData.get("id") ?? "");
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slots: true },
  });
  if (!booking) return { error: "No such booking." };

  const now = new Date();
  const scheduledIds = booking.slots
    .map((s) => s.scheduledClassId)
    .filter((v): v is string => v !== null);

  await prisma.$transaction([
    ...(scheduledIds.length > 0
      ? [
          prisma.scheduledClass.updateMany({
            where: { id: { in: scheduledIds }, status: "SCHEDULED" },
            data: { status: "CANCELED" },
          }),
        ]
      : []),
    prisma.bookingSlot.updateMany({
      where: { bookingId: id, releasedAt: null },
      data: {
        status: "CANCELED",
        releasedAt: now,
        releasedReason: "cancelled by staff",
      },
    }),
    prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELED",
        needsAttention: booking.paidAt !== null,
        attentionNote: booking.paidAt
          ? "Cancelled after payment — refund or rebook the balance."
          : null,
      },
    }),
  ]);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/schedule");
  return {};
}

/** A human has dealt with it. Clears it out of the action queue. */
export async function resolveBookingAction(formData: FormData): Promise<ActionResult> {
  await requireManager();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!id) return { error: "No such booking." };

  await prisma.booking.update({
    where: { id },
    data: {
      needsAttention: false,
      resolvedAt: new Date(),
      attentionNote: note || null,
    },
  });

  revalidatePath("/admin/bookings");
  return {};
}

/**
 * Refund some or all of a booking.
 *
 * ─── Why a negative ClientPayment ───────────────────────────────────────────
 * `balances.ts` computes what a client has paid as a plain sum of
 * `ClientPayment.amount`, so a negative row reduces it correctly and no
 * aggregate anywhere needs changing. The alternative — a `refunded` flag on the
 * original — would mean editing four separate sums and would erase the fact
 * that money moved twice. This way the refund is its own line in the ledger,
 * which is what a refund actually is.
 *
 * `stripeRefundId` is unique for the same reason `stripeSessionId` is: a
 * retried refund must not be recorded twice.
 */
export async function refundBookingAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireManager();
  if (!stripeConfigured()) return { error: "Stripe isn't configured." };

  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("amount") ?? "").trim();

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      clientId: true,
      paidAmount: true,
      unfulfilledAmount: true,
      stripeSessionId: true,
    },
  });
  if (!booking?.clientId || !booking.paidAmount) {
    return { error: "Nothing has been paid on that booking." };
  }

  // Default to the stranded amount — the common case is refunding exactly the
  // sessions that could not be scheduled.
  const amount = raw
    ? new Prisma.Decimal(raw)
    : booking.unfulfilledAmount;
  if (amount.lte(0)) return { error: "Enter an amount above zero." };
  if (amount.gt(booking.paidAmount)) {
    return { error: "That's more than was paid." };
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(
      booking.stripeSessionId!
    );
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!paymentIntent) return { error: "No payment found to refund." };

    const refund = await getStripe().refunds.create(
      {
        payment_intent: paymentIntent,
        amount: amount.mul(100).toNumber(),
      },
      // Same guard as the tutor transfers: a retry must not refund twice.
      { idempotencyKey: `booking-refund-${id}-${amount.toFixed(2)}` }
    );

    await prisma.clientPayment.create({
      data: {
        clientId: booking.clientId,
        bookingId: id,
        // Negative: this is money going back out.
        amount: amount.negated(),
        method: "STRIPE",
        stripeRefundId: refund.id,
        note: "Refund — booking",
        receivedAt: new Date(),
      },
    });

    await prisma.booking.update({
      where: { id },
      data: {
        needsAttention: false,
        resolvedAt: new Date(),
        attentionNote: `Refunded ${amount.toFixed(2)}.`,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "That refund is already recorded." };
    }
    console.error("[booking] refund failed", error);
    return { error: "Stripe wouldn't process that refund." };
  }

  revalidatePath("/admin/bookings");
  return {};
}
