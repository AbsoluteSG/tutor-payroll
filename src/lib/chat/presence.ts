import { prisma } from "@/lib/prisma";

/**
 * Who is available to take a live chat.
 *
 * The marketing site has to know this *before* it offers a person, because the
 * failure this whole feature is exposed to is a visitor typing into a queue at
 * eleven at night with nobody coming. So availability is derived from an actual
 * heartbeat rather than a setting somebody forgot to turn off.
 */

/**
 * How stale a heartbeat may be before we treat that person as gone.
 *
 * Three missed beats at the console's 15s interval. Long enough to ride out a
 * slow request or a laptop lid closing for a moment, short enough that a
 * visitor is not offered a live chat with someone who left ten minutes ago.
 */
export const PRESENCE_WINDOW_MS = 45_000;

// The console polls every 3s (see admin/chat/console.tsx) and every poll is a
// heartbeat, so the window above is comfortably wider than the beat. Nothing
// here is imported by the console itself: this module reaches Prisma, and
// importing it from a client component would pull the database client into the
// browser bundle.

function cutoff() {
  return new Date(Date.now() - PRESENCE_WINDOW_MS);
}

/** Is anyone sitting at the console right now? */
export async function staffOnline(): Promise<boolean> {
  const present = await prisma.staffPresence.count({
    where: { lastSeenAt: { gt: cutoff() } },
  });
  return present > 0;
}

/** Called by the console on a timer for as long as it is open. */
export async function touchPresence(userId: string) {
  const now = new Date();
  await prisma.staffPresence.upsert({
    where: { userId },
    create: { userId, lastSeenAt: now },
    update: { lastSeenAt: now },
  });
}

/**
 * Called when the console closes. Not relied upon — a browser being closed
 * fires nothing reliable — which is why the window above is what actually
 * decides availability. This just makes the common case immediate.
 */
export async function clearPresence(userId: string) {
  await prisma.staffPresence
    .delete({ where: { userId } })
    .catch(() => undefined);
}
