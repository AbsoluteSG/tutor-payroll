import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/chat/rate-limit";
import { staffOnline } from "@/lib/chat/presence";

/**
 * What the visitor's browser asks, every few seconds, while a live chat is
 * open: has anyone picked up, and has anyone said anything.
 *
 * Polling rather than websockets or SSE. Next route handlers have no websocket
 * server, and an SSE connection held open per visitor is a serverless function
 * held open per visitor — which on this deployment is both expensive and capped
 * by the platform's timeout. With no Redis or pub/sub in the stack, an SSE
 * stream would end up polling Postgres internally anyway, so this does the same
 * thing without pretending to be a socket. A few seconds of latency is
 * invisible in a conversation where the other end is a human typing.
 *
 * POST rather than GET because it writes: each poll is also the visitor's
 * heartbeat, which is how the console knows they are still on the page.
 *
 * The whole transcript comes back each time rather than a delta. These are
 * support conversations of a few dozen messages, and returning everything makes
 * a whole class of cursor bug impossible.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A poll every 3s, plus slack for retries and a second tab. */
const LIMIT = { limit: 60, windowMs: 60_000 };

const MAX_MESSAGES = 200;

const pollSchema = z.object({ conversationId: z.string().cuid() });

export async function POST(request: Request) {
  const limited = rateLimit(`poll:${clientKey(request)}`, LIMIT);
  if (!limited.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  let parsed;
  try {
    parsed = pollSchema.safeParse(await request.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const convo = await prisma.chatConversation.findUnique({
      where: { id: parsed.data.conversationId },
      select: {
        id: true,
        mode: true,
        waitingSince: true,
        claimedBy: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: MAX_MESSAGES,
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

    if (!convo) {
      // The conversation was deleted, or the browser is holding an id from a
      // previous database. Tell the widget to start over rather than 404 into
      // a permanent error state.
      return Response.json({ gone: true });
    }

    await prisma.chatConversation.update({
      where: { id: convo.id },
      data: { visitorSeenAt: new Date() },
    });

    // Where they are in the queue, so a wait has a shape to it. Counts only
    // conversations that have been waiting longer than this one.
    let queuePosition: number | null = null;
    if (convo.mode === "WAITING" && convo.waitingSince) {
      const ahead = await prisma.chatConversation.count({
        where: {
          mode: "WAITING",
          waitingSince: { lt: convo.waitingSince },
        },
      });
      queuePosition = ahead + 1;
    }

    return Response.json({
      mode: convo.mode,
      staffName: convo.claimedBy?.name ?? null,
      staffOnline: convo.mode === "WAITING" ? await staffOnline() : true,
      queuePosition,
      messages: convo.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
    });
  } catch (error) {
    console.error("[chat] poll failed", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
