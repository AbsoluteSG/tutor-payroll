import { prisma } from "@/lib/prisma";
import {
  liveEndSchema,
  liveMessageSchema,
  liveRequestSchema,
} from "@/lib/chat/schema";
import { clientKey, rateLimit } from "@/lib/chat/rate-limit";
import { staffOnline } from "@/lib/chat/presence";

/**
 * The visitor's side of a live chat: join the queue, talk to whoever picks up,
 * and hang up.
 *
 * One endpoint with an `action` rather than three routes, because all three are
 * the same thing from the visitor's point of view — writing to their own
 * conversation — and they share the identity check below.
 *
 * On identity: the conversation id is a bearer token. Anyone holding it can
 * post to that conversation. Nothing here trusts a client-supplied name, mode
 * or role, so the worst a stolen id allows is posting into someone else's chat
 * — which is why the widget must never put the id anywhere but sessionStorage,
 * and why nobody should be asked for sensitive detail in this box.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = { limit: 30, windowMs: 60_000 };

function bad(message: string, status = 400) {
  return Response.json({ error: "bad_request", message }, { status });
}

export async function POST(request: Request) {
  const limited = rateLimit(`live:${clientKey(request)}`, LIMIT);
  if (!limited.ok) {
    return Response.json(
      { error: "rate_limited", message: "Slow down a moment." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Malformed request.");
  }

  const action = (payload as { action?: string })?.action;

  try {
    if (action === "request") return await requestPerson(payload);
    if (action === "say") return await say(payload);
    if (action === "end") return await end(payload);
    return bad("Unknown action.");
  } catch (error) {
    console.error("[chat] live action failed", error);
    return Response.json(
      {
        error: "server_error",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}

/** Join the queue. */
async function requestPerson(payload: unknown) {
  const parsed = liveRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Check the form.");
  }
  const { conversationId, name, email, message, path } = parsed.data;

  const existing = conversationId
    ? await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        select: { id: true, mode: true },
      })
    : null;

  const online = await staffOnline();
  const now = new Date();

  const convo = existing
    ? await prisma.chatConversation.update({
        where: { id: existing.id },
        // Reopening after an ended chat is allowed — a visitor who thinks of
        // one more thing should not be stuck with a dead box.
        data: {
          mode: "WAITING",
          visitorName: name,
          visitorEmail: email,
          waitingSince: now,
          endedAt: null,
          visitorSeenAt: now,
        },
        select: { id: true },
      })
    : await prisma.chatConversation.create({
        data: {
          path,
          mode: "WAITING",
          visitorName: name,
          visitorEmail: email,
          waitingSince: now,
          visitorSeenAt: now,
        },
        select: { id: true },
      });

  await prisma.chatMessage.create({
    data: { conversationId: convo.id, role: "USER", content: message },
  });

  return Response.json({
    ok: true,
    conversationId: convo.id,
    mode: "WAITING",
    // The widget says something quite different depending on this: someone is
    // coming, versus we will email you back.
    staffOnline: online,
  });
}

/** Say something to the person who picked up. */
async function say(payload: unknown) {
  const parsed = liveMessageSchema.safeParse(payload);
  if (!parsed.success) return bad("Type a message.");
  const { conversationId, message } = parsed.data;

  const convo = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, mode: true },
  });
  if (!convo) return bad("That conversation has expired.", 404);
  // Allowed while waiting too: a visitor in the queue adding detail is useful
  // to whoever picks it up, and refusing their typing would be baffling.
  if (convo.mode !== "LIVE" && convo.mode !== "WAITING") {
    return bad("This chat has ended.", 409);
  }

  await prisma.chatMessage.create({
    data: { conversationId: convo.id, role: "USER", content: message },
  });
  await prisma.chatConversation.update({
    where: { id: convo.id },
    data: { visitorSeenAt: new Date() },
  });

  return Response.json({ ok: true });
}

/** Hang up. */
async function end(payload: unknown) {
  const parsed = liveEndSchema.safeParse(payload);
  if (!parsed.success) return bad("Unknown conversation.");

  await prisma.chatConversation.updateMany({
    where: {
      id: parsed.data.conversationId,
      mode: { in: ["WAITING", "LIVE"] },
    },
    data: { mode: "ENDED", endedAt: new Date() },
  });

  return Response.json({ ok: true, mode: "ENDED" });
}
