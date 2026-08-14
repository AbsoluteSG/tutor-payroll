import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { bookableTutorBySlug, tutorPayRate } from "@/lib/booking/tutors";
import { openSlots } from "@/lib/booking/availability";
import { expireStaleBookings } from "@/lib/booking/commit";
import { MAX_SESSIONS, seriesLabel, weeklySeries } from "@/lib/booking/series";
import {
  HOLD_MINUTES,
  createBookingCheckoutSession,
} from "@/lib/stripe-payments";
import { stripeConfigured } from "@/lib/stripe";
import { clientKey, rateLimit } from "@/lib/chat/rate-limit";
import { BUSINESS_TZ } from "@/lib/time-zone";

/**
 * Hold the slots, then send the parent to Stripe.
 *
 * The order matters: the rows exist *before* the Checkout session, so the
 * overlap constraint is what wins a race between two parents rather than luck.
 * A `P2002`/`23P01` here is the expected "someone just took this" path and
 * answers 409, not 500.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = { limit: 6, windowMs: 600_000 };

/** How many live holds one email may have at once. */
const MAX_LIVE_HOLDS = 3;

const bookingRequestSchema = z.object({
  tutorSlug: z.string().min(1).max(120),
  /** ISO UTC instant of the first session, chosen from /api/booking/slots. */
  firstStartsAt: z.string().datetime(),
  sessionCount: z.coerce.number().int().min(1).max(MAX_SESSIONS),
  durationMinutes: z.coerce.number().int().min(30).max(180),
  subject: z.string().trim().min(1).max(120),
  track: z.string().trim().min(1).max(120),
  parentName: z.string().trim().min(1).max(120),
  parentEmail: z.string().trim().toLowerCase().email().max(200),
  parentPhone: z.string().trim().max(40).optional().or(z.literal("")),
  studentName: z.string().trim().min(1).max(120),
  studentGrade: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  /** The visitor's own zone, for their confirmation. */
  timeZone: z.string().trim().max(64).optional(),
});

function bad(message: string, status = 400, code = "bad_request") {
  return Response.json({ error: code, message }, { status });
}

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return bad(
      "Online booking isn't available right now — please get in touch and we'll arrange it.",
      503,
      "unconfigured"
    );
  }

  const limited = rateLimit(`checkout:${clientKey(request)}`, LIMIT);
  if (!limited.ok) {
    return bad("Too many attempts — try again shortly.", 429, "rate_limited");
  }

  let parsed;
  try {
    parsed = bookingRequestSchema.safeParse(await request.json());
  } catch {
    return bad("Malformed request.");
  }
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Check the form.");
  }
  const input = parsed.data;

  const tutor = await bookableTutorBySlug(input.tutorSlug);
  if (!tutor) return bad("That tutor isn't taking bookings.", 404, "not_found");

  const payRate = await tutorPayRate(tutor.userId);
  if (!payRate) {
    // The listing gate should make this unreachable; refuse rather than sell a
    // class that cannot be provisioned.
    return bad("That tutor isn't taking bookings.", 409, "not_bookable");
  }

  // Release anything whose hold lapsed, so the grid and the constraint agree.
  await expireStaleBookings();

  // The series is generated in the TUTOR's zone: "Tuesdays at 4pm" is their
  // 4pm, and it has to survive a DST change mid-block.
  const slots = weeklySeries({
    firstStartsAt: new Date(input.firstStartsAt),
    count: input.sessionCount,
    durationMinutes: input.durationMinutes,
    timeZone: tutor.timeZone,
  });
  if (slots.length === 0) return bad("Pick at least one session.");

  // Re-verify every slot against live availability — the visitor's grid may be
  // minutes old, and this is the last chance to check before taking money.
  const last = slots[slots.length - 1].startsAt;
  const open = await openSlots({
    tutorId: tutor.userId,
    from: new Date(),
    to: new Date(last.getTime() + 86_400_000),
    durationMinutes: input.durationMinutes,
  });
  const openAt = new Set(open.map((s) => s.startsAt.getTime()));
  const unavailable = slots.filter((s) => !openAt.has(s.startsAt.getTime()));
  if (unavailable.length > 0) {
    return Response.json(
      {
        error: "slot_taken",
        message:
          unavailable.length === slots.length
            ? "Those times have just gone. Pick another."
            : `${unavailable.length} of those times have just gone. Pick another start.`,
        unavailable: unavailable.map((s) => s.startsAt.toISOString()),
      },
      { status: 409 }
    );
  }

  // A database-backed cap, because the IP limiter is per-instance and this is
  // the endpoint that creates rows and reserves other people's time.
  const liveHolds = await prisma.booking.count({
    where: {
      parentEmail: input.parentEmail,
      status: "PENDING",
      holdExpiresAt: { gt: new Date() },
    },
  });
  if (liveHolds >= MAX_LIVE_HOLDS) {
    return bad(
      "You've got bookings waiting to be paid for. Finish those first.",
      429,
      "too_many_holds"
    );
  }

  // Price is computed here from the tier, never taken from the request body.
  const perSession = new Prisma.Decimal(tutor.hourlyRate)
    .mul(input.durationMinutes)
    .div(60)
    .toDecimalPlaces(2);
  const total = perSession.mul(slots.length).toDecimalPlaces(2);

  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  let bookingId: string;
  try {
    const booking = await prisma.booking.create({
      data: {
        tutorId: tutor.userId,
        parentName: input.parentName,
        parentEmail: input.parentEmail,
        parentPhone: input.parentPhone || null,
        studentName: input.studentName,
        studentGrade: input.studentGrade || null,
        subject: input.subject,
        track: input.track,
        notes: input.notes || null,
        tier: tutor.tier.toUpperCase() as "JUNIOR" | "MID" | "SENIOR",
        hourlyRate: new Prisma.Decimal(tutor.hourlyRate),
        totalAmount: total,
        bookedTimeZone: input.timeZone || BUSINESS_TZ,
        patternLabel: seriesLabel(
          slots[0].startsAt,
          slots.length,
          tutor.timeZone
        ),
        holdExpiresAt,
        slots: {
          create: slots.map((s) => ({
            tutorId: tutor.userId,
            startsAt: s.startsAt,
            endsAt: new Date(
              s.startsAt.getTime() + s.durationMinutes * 60_000
            ),
            durationMinutes: s.durationMinutes,
            priceAmount: perSession,
          })),
        },
      },
      select: { id: true },
    });
    bookingId = booking.id;
  } catch (error) {
    // The overlap constraint fired: somebody took one of these between the
    // availability check above and this insert. Expected, not exceptional.
    const code =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "";
    const message = error instanceof Error ? error.message : "";
    if (code === "P2002" || /BookingSlot_no_overlap|23P01/.test(message)) {
      return Response.json(
        {
          error: "slot_taken",
          message: "Someone just took one of those times. Pick another.",
        },
        { status: 409 }
      );
    }
    console.error("[booking] could not hold slots", error);
    return bad("We couldn't start that booking. Please try again.", 500, "server_error");
  }

  try {
    const session = await createBookingCheckoutSession({
      id: bookingId,
      tutorName: tutor.name,
      subject: input.subject,
      sessionCount: slots.length,
      whenLabel: seriesLabel(slots[0].startsAt, slots.length, tutor.timeZone),
      amount: total,
      parentEmail: input.parentEmail,
      holdExpiresAt,
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripeSessionId: session.id },
    });

    return Response.json({ url: session.url, bookingId });
  } catch (error) {
    console.error("[booking] stripe session failed", error);
    // Release the hold immediately rather than sitting on somebody's afternoon
    // for 35 minutes because of our own failure.
    const now = new Date();
    await prisma.$transaction([
      prisma.bookingSlot.updateMany({
        where: { bookingId, status: "HELD" },
        data: {
          status: "CANCELED",
          releasedAt: now,
          releasedReason: "checkout could not be started",
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELED" },
      }),
    ]);
    return bad("We couldn't reach the payment page. Please try again.", 502, "stripe_error");
  }
}
