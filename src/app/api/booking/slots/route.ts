import { z } from "zod";
import { bookableTutorBySlug } from "@/lib/booking/tutors";
import {
  BOOKING_HORIZON_DAYS,
  openSlots,
} from "@/lib/booking/availability";
import { clientKey, rateLimit } from "@/lib/chat/rate-limit";

/**
 * Open times for one tutor. Public and unauthenticated.
 *
 * Returns instants and nothing else. No client names, no student names, no
 * indication of who is in the slots that are missing — a stranger can see that
 * a tutor is busy at 4pm on Tuesday, which is unavoidable in any booking
 * system, but must never learn who with.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Generous: the grid refetches whenever the visitor changes tutor or length. */
const LIMIT = { limit: 60, windowMs: 60_000 };

const querySchema = z.object({
  tutor: z.string().min(1).max(120),
  duration: z.coerce.number().int().min(30).max(180).default(60),
  weeks: z.coerce.number().int().min(1).max(8).default(4),
});

export async function GET(request: Request) {
  const limited = rateLimit(`slots:${clientKey(request)}`, LIMIT);
  if (!limited.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    tutor: url.searchParams.get("tutor") ?? "",
    duration: url.searchParams.get("duration") ?? undefined,
    weeks: url.searchParams.get("weeks") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { tutor: slug, duration, weeks } = parsed.data;

  try {
    // The bookability gate, not just an existence check: a tutor without a
    // tier or a pay rate must not appear to have open times, because a booking
    // against them could not be provisioned.
    const tutor = await bookableTutorBySlug(slug);
    if (!tutor) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const from = new Date();
    const horizon = Math.min(weeks * 7, BOOKING_HORIZON_DAYS);
    const to = new Date(from.getTime() + horizon * 86_400_000);

    const slots = await openSlots({
      tutorId: tutor.userId,
      from,
      to,
      durationMinutes: duration,
    });

    return Response.json(
      {
        tutor: { slug: tutor.slug, name: tutor.name, timeZone: tutor.timeZone },
        durationMinutes: duration,
        /** Price for one session at this length, in whole dollars. */
        price: Math.round((tutor.hourlyRate * duration) / 60),
        slots: slots.map((s) => s.startsAt.toISOString()),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[booking] slots failed", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
