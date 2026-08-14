import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { evaluateBookingSession } from "@/lib/stripe-payments";
import { Prisma } from "@/generated/prisma/client";

/**
 * Turning a paid Checkout session into a real booking.
 *
 * ─── Why three transactions and not one ─────────────────────────────────────
 * The obvious shape — one `$transaction` that creates the client, the rate
 * card, the classes and the payment — is wrong here. Prisma aborts an entire
 * interactive transaction when a constraint fires, and there are no savepoints,
 * so a single slot losing a race to the overlap constraint would roll back the
 * payment record too. Money would have moved at Stripe and left no trace here.
 *
 * So: money first, in its own transaction, unconditionally. Then each slot in
 * its own small transaction, where a failure costs that slot and nothing else.
 * Then a roll-up. The invariant "money is never silently dropped" is therefore
 * structural rather than something the code has to remember.
 *
 * ─── Idempotency ────────────────────────────────────────────────────────────
 * Safe to call repeatedly — webhook retry, the /book/[id] page-load backstop,
 * a manual re-sync. `ClientPayment.stripeSessionId` is unique and guards the
 * money; `BookingSlot.scheduledClassId` is unique and guards the calendar.
 */

/** The tutor↔client rate card is the gate; see below for why this matters. */
async function ensureClientAndRateCard(
  tx: Prisma.TransactionClient,
  booking: {
    id: string;
    tutorId: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string | null;
    hourlyRate: Prisma.Decimal;
  },
  tutorRate: Prisma.Decimal
): Promise<string> {
  const email = booking.parentEmail.toLowerCase();

  const existing = await tx.client.findUnique({
    where: { email },
    select: { id: true },
  });

  let clientId = existing?.id ?? null;

  if (!clientId) {
    // `paymentName` is unique and is a human name, so two families called
    // Smith is not an edge case. Fall back to something that actually differs
    // rather than failing the booking; a manager can rename it later.
    const candidates = [
      booking.parentName,
      `${booking.parentName} (${email})`,
      `${booking.parentName} (${booking.id.slice(0, 6)})`,
    ];

    for (const paymentName of candidates) {
      try {
        const created = await tx.client.create({
          data: {
            paymentName,
            displayName: booking.parentName,
            email,
            phone: booking.parentPhone,
            notes: "Created from a website booking.",
          },
          select: { id: true },
        });
        clientId = created.id;
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  if (!clientId) {
    throw new Error(`could not resolve a client for booking ${booking.id}`);
  }

  // ─── The sharpest edge in the whole feature ──────────────────────────────
  // Without a rate card for this tutor↔client pair, `submitClassAction` refuses
  // — so every class this booking creates would be one the tutor is unable to
  // log, after the parent has paid. It is invisible in the booking UI and no
  // booking-flow test would catch it.
  //
  // `update: {}` is equally load-bearing: a returning parent must not reset a
  // rate a manager negotiated by hand back to the tier default.
  await tx.rateCard.upsert({
    where: { clientId_tutorId: { clientId, tutorId: booking.tutorId } },
    create: {
      clientId,
      tutorId: booking.tutorId,
      tutorRate,
      // Makes /submit prefill the amount the parent actually paid.
      defaultFullCost: booking.hourlyRate,
    },
    update: {},
  });

  return clientId;
}

export async function commitBookingCheckout(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const result = evaluateBookingSession({
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    metadata: session.metadata,
  });
  if (!result.record) return false;

  const booking = await prisma.booking.findUnique({
    where: { id: result.bookingId! },
    include: { slots: { orderBy: { startsAt: "asc" } } },
  });
  if (!booking) {
    console.error("[booking] paid session references no booking", result.bookingId);
    return false;
  }

  // The tutor's pay rate is fetched here and nowhere near the public page.
  const tutor = await prisma.user.findUnique({
    where: { id: booking.tutorId },
    select: { defaultTutorRate: true },
  });
  const tutorRate = tutor?.defaultTutorRate ?? new Prisma.Decimal(0);

  // ── T1: money. Unconditional, idempotent, touches no slots. ──────────────
  let clientId = booking.clientId;
  await prisma.$transaction(async (tx) => {
    const already = await tx.clientPayment.findUnique({
      where: { stripeSessionId: session.id },
      select: { id: true },
    });
    if (already) return;

    clientId = await ensureClientAndRateCard(tx, booking, tutorRate);

    await tx.clientPayment.create({
      data: {
        clientId,
        bookingId: booking.id,
        amount: result.amount!,
        method: "STRIPE",
        stripeSessionId: session.id,
        note: `Booked online — ${booking.slots.length} session${
          booking.slots.length === 1 ? "" : "s"
        }`,
        receivedAt: new Date(),
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        clientId,
        paidAt: new Date(),
        paidAmount: result.amount!,
        // Stripe took a different amount than we asked for. Should be
        // impossible, so it is surfaced rather than reconciled.
        ...(result.amount!.equals(booking.totalAmount)
          ? {}
          : {
              needsAttention: true,
              attentionNote: `Charged ${result.amount!.toFixed(
                2
              )} but the booking totalled ${booking.totalAmount.toFixed(2)}.`,
            }),
      },
    });
  });

  if (!clientId) {
    // Only reachable if T1 short-circuited on an existing payment but the
    // booking never got its client — re-read rather than guess.
    const refreshed = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { clientId: true },
    });
    clientId = refreshed?.clientId ?? null;
  }
  if (!clientId) return false;

  // ── T2: one small transaction per slot. ──────────────────────────────────
  let confirmed = 0;
  let stranded = new Prisma.Decimal(0);

  for (const slot of booking.slots) {
    if (slot.status === "CONFIRMED" && slot.scheduledClassId) {
      confirmed += 1;
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Re-acquire. `updateMany` scoped to HELD means a slot the reaper
        // already released is a no-op rather than a throw.
        const claimed = await tx.bookingSlot.updateMany({
          where: { id: slot.id, status: "HELD" },
          data: { status: "CONFIRMED", releasedAt: null },
        });
        if (claimed.count === 0) {
          throw new SlotGone(slot.id);
        }

        const scheduled = await tx.scheduledClass.create({
          data: {
            tutorId: booking.tutorId,
            clientId: clientId!,
            studentName: booking.studentName,
            scheduledAt: slot.startsAt,
            durationMinutes: slot.durationMinutes,
            notes: `Booked online · ${booking.subject}`,
          },
          select: { id: true },
        });

        await tx.bookingSlot.update({
          where: { id: slot.id },
          data: { scheduledClassId: scheduled.id },
        });
      });
      confirmed += 1;
    } catch (error) {
      const reason =
        error instanceof SlotGone
          ? "the time was taken before payment settled"
          : "could not be scheduled";
      console.error("[booking] slot failed to commit", slot.id, error);

      await prisma.bookingSlot.update({
        where: { id: slot.id },
        data: {
          status: "CONFLICTED",
          releasedAt: new Date(),
          releasedReason: reason,
        },
      });
      stranded = stranded.plus(slot.priceAmount);
    }
  }

  // ── T3: roll up. ─────────────────────────────────────────────────────────
  const total = booking.slots.length;
  const status =
    confirmed === total ? "CONFIRMED" : confirmed === 0 ? "UNFULFILLED" : "PARTIAL";

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status,
      ...(confirmed < total
        ? {
            needsAttention: true,
            unfulfilledAmount: stranded,
            attentionNote: `${total - confirmed} of ${total} sessions could not be scheduled.`,
          }
        : {}),
    },
  });

  return true;
}

/** Thrown when a slot's hold has already gone. Not an error worth a stack. */
class SlotGone extends Error {
  constructor(id: string) {
    super(`slot ${id} was no longer held`);
    this.name = "SlotGone";
  }
}

/**
 * Free slots whose hold lapsed, so the overlap constraint stops blocking them.
 *
 * Lazy: there is no cron in this stack. Called from the availability read and
 * from Stripe's `checkout.session.expired` webhook, which between them cover
 * the realistic cases — a slot only stays wrongly held if nobody looks at that
 * tutor's calendar AND Stripe never fires, and then only until either happens.
 */
export async function expireStaleBookings(): Promise<void> {
  const now = new Date();

  const stale = await prisma.booking.findMany({
    where: { status: "PENDING", holdExpiresAt: { lt: now } },
    select: { id: true },
    take: 100,
  });
  if (stale.length === 0) return;

  const ids = stale.map((b) => b.id);
  await prisma.$transaction([
    prisma.bookingSlot.updateMany({
      where: { bookingId: { in: ids }, status: "HELD" },
      data: { status: "EXPIRED", releasedAt: now, releasedReason: "hold lapsed" },
    }),
    prisma.booking.updateMany({
      where: { id: { in: ids }, status: "PENDING" },
      data: { status: "EXPIRED" },
    }),
  ]);
}

/** Stripe told us the session expired — release immediately rather than wait. */
export async function expireBookingForSession(sessionId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, status: true },
  });
  if (!booking || booking.status !== "PENDING") return;

  const now = new Date();
  await prisma.$transaction([
    prisma.bookingSlot.updateMany({
      where: { bookingId: booking.id, status: "HELD" },
      data: {
        status: "EXPIRED",
        releasedAt: now,
        releasedReason: "checkout expired",
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "EXPIRED" },
    }),
  ]);
}
