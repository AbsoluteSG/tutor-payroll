import { prisma } from "@/lib/prisma";
import { enquirySchema } from "@/lib/schemas";
import { clientKey, rateLimit } from "@/lib/chat/rate-limit";

/**
 * "Call me back" from the public site.
 *
 * The one call to action on the marketing site that does not depend on the
 * visitor having a mail client configured — everything else there composes a
 * `mailto:` and hopes. A lead written here survives the browser being closed
 * and lands in /admin/enquiries.
 *
 * Public and unauthenticated, so it is rate limited and carries a honeypot.
 * Neither is a real defence against a determined attacker (see rate-limit.ts on
 * why the limiter is per-instance); they are here to stop the drive-by bots
 * that fill in every form on the internet.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Generous for a person filling in one form; tight for a script. */
const LIMIT = { limit: 5, windowMs: 600_000 };

export async function POST(request: Request) {
  const limited = rateLimit(`enquiry:${clientKey(request)}`, LIMIT);
  if (!limited.ok) {
    return Response.json(
      {
        error: "rate_limited",
        message: "We've already got your message — someone will be in touch.",
      },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "bad_request", message: "Malformed request." },
      { status: 400 }
    );
  }

  // Honeypot. A field no human sees and no human fills in. Answer 200 rather
  // than 400 — a bot that learns it was rejected simply tries again without it.
  const trap = (payload as { company?: unknown })?.company;
  if (typeof trap === "string" && trap.trim() !== "") {
    return Response.json({ ok: true });
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "bad_request",
        message: parsed.error.issues[0]?.message ?? "Check the form.",
      },
      { status: 400 }
    );
  }

  const { name, email, phone, message, preferredTimes, path, subject, tutorSlug } =
    parsed.data;

  try {
    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        email,
        // Empty strings are how an untouched optional input arrives. Store the
        // absence rather than a blank, so the admin list can tell "no phone
        // number" from "an empty one".
        phone: phone || null,
        message: message || null,
        preferredTimes: preferredTimes || null,
        path: path || null,
        subject: subject || null,
        tutorSlug: tutorSlug || null,
      },
      select: { id: true },
    });

    return Response.json({ ok: true, id: enquiry.id });
  } catch (error) {
    console.error("[enquiry] could not save", error);
    return Response.json(
      {
        error: "server_error",
        message: "We couldn't send that. Please email hello@boroughprep.com.",
      },
      { status: 500 }
    );
  }
}
