"use server";

import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PRESENCE_WINDOW_MS,
  clearPresence,
  touchPresence,
} from "@/lib/chat/presence";

/**
 * The staff side of the live chat.
 *
 * Server actions rather than route handlers because auth here is the app's
 * existing session, and `requireManager` redirects — which is the right
 * behaviour inside the app and the wrong response body for an API route.
 *
 * `consoleState` is called on a timer by the console and doubles as the
 * presence heartbeat, so being logged in is never on its own enough to make the
 * marketing site claim someone is available: the console has to be open.
 */

export type ConsoleMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "STAFF";
  content: string;
  authorName: string | null;
};

export type ConsoleWaiting = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  path: string | null;
  waitingSince: string | null;
  /** First thing they said, so the queue is scannable without opening each. */
  preview: string;
};

export type ConsoleState = {
  meId: string;
  meName: string;
  waiting: ConsoleWaiting[];
  active: {
    id: string;
    visitorName: string | null;
    visitorEmail: string | null;
    path: string | null;
    mode: "WAITING" | "LIVE" | "ENDED" | "BOT";
    /** True when the visitor's browser has stopped polling. */
    visitorGone: boolean;
    messages: ConsoleMessage[];
  } | null;
  /** Other people also sitting at a console right now. */
  othersOnline: number;
};

/** A visitor who has not polled in this long has closed the tab. */
const VISITOR_GONE_MS = 30_000;

export async function consoleState(): Promise<ConsoleState> {
  const me = await requireManager();
  await touchPresence(me.id);

  const [waitingRows, active, othersOnline] = await Promise.all([
    prisma.chatConversation.findMany({
      where: { mode: "WAITING" },
      orderBy: { waitingSince: "asc" },
      take: 25,
      select: {
        id: true,
        visitorName: true,
        visitorEmail: true,
        path: true,
        waitingSince: true,
        messages: {
          where: { role: "USER" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.chatConversation.findFirst({
      where: { claimedById: me.id, mode: "LIVE" },
      orderBy: { claimedAt: "desc" },
      select: {
        id: true,
        visitorName: true,
        visitorEmail: true,
        path: true,
        mode: true,
        visitorSeenAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 200,
          select: {
            id: true,
            role: true,
            content: true,
            author: { select: { name: true } },
          },
        },
      },
    }),
    prisma.staffPresence.count({
      where: {
        userId: { not: me.id },
        lastSeenAt: { gt: new Date(Date.now() - PRESENCE_WINDOW_MS) },
      },
    }),
  ]);

  return {
    meId: me.id,
    meName: me.name,
    othersOnline,
    waiting: waitingRows.map((c) => ({
      id: c.id,
      visitorName: c.visitorName,
      visitorEmail: c.visitorEmail,
      path: c.path,
      waitingSince: c.waitingSince?.toISOString() ?? null,
      preview: c.messages[0]?.content ?? "",
    })),
    active: active
      ? {
          id: active.id,
          visitorName: active.visitorName,
          visitorEmail: active.visitorEmail,
          path: active.path,
          mode: active.mode,
          visitorGone:
            active.visitorSeenAt == null ||
            Date.now() - active.visitorSeenAt.getTime() > VISITOR_GONE_MS,
          messages: active.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            authorName: m.author?.name ?? null,
          })),
        }
      : null,
  };
}

/**
 * Pick up a waiting conversation.
 *
 * Conditional on it still being WAITING, so two people hitting the same row at
 * the same time cannot both take it — the second update matches nothing and
 * that person is told it has gone.
 */
export async function claimConversation(
  conversationId: string
): Promise<{ ok: boolean; message?: string }> {
  const me = await requireManager();

  const taken = await prisma.chatConversation.updateMany({
    where: { id: conversationId, mode: "WAITING" },
    data: {
      mode: "LIVE",
      claimedById: me.id,
      claimedAt: new Date(),
    },
  });
  if (taken.count === 0) {
    return { ok: false, message: "Someone else picked that up." };
  }

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "STAFF",
      authorId: me.id,
      content: `${me.name} has joined the chat.`,
    },
  });

  return { ok: true };
}

export async function sendStaffReply(
  conversationId: string,
  message: string
): Promise<{ ok: boolean; message?: string }> {
  const me = await requireManager();

  const text = message.trim().slice(0, 2000);
  if (!text) return { ok: false, message: "Type a message." };

  // Only into a chat you actually hold, and only while it is live.
  const convo = await prisma.chatConversation.findFirst({
    where: { id: conversationId, claimedById: me.id, mode: "LIVE" },
    select: { id: true },
  });
  if (!convo) return { ok: false, message: "That chat is no longer yours." };

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "STAFF",
      authorId: me.id,
      content: text,
    },
  });
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return { ok: true };
}

export async function endConversation(
  conversationId: string
): Promise<{ ok: boolean }> {
  const me = await requireManager();

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "STAFF",
      authorId: me.id,
      content: "This chat has been closed. Thanks for getting in touch.",
    },
  });
  await prisma.chatConversation.updateMany({
    where: { id: conversationId, claimedById: me.id },
    data: { mode: "ENDED", endedAt: new Date() },
  });

  return { ok: true };
}

/**
 * Leave the console. Best effort — see presence.ts on why the timeout window
 * is what actually decides availability.
 */
export async function goOffline(): Promise<void> {
  const me = await requireManager();
  await clearPresence(me.id);
}
