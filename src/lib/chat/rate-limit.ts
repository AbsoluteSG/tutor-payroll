/**
 * A fixed-window rate limiter, in memory.
 *
 * /api/chat is public, unauthenticated, and bills per token. Without a limit,
 * one script pointed at it runs up a bill for as long as it is left running.
 * This is the cheap floor: it costs nothing to run and stops the obvious abuse.
 *
 * What it does NOT do, and you should know before relying on it: the counters
 * live in this process, so each serverless instance enforces the limit
 * separately and every deploy resets them. On a single long-lived server that
 * is the real limit; spread across N instances the effective allowance is up to
 * N times the number below. If this endpoint ever carries real traffic, move
 * the counters to Redis (or the database) and keep this as the local fallback.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Stops the map growing without bound on a long-lived server. */
function sweep(now: number) {
  if (windows.size < 5000) return;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets — sent as Retry-After on a 429. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Caller identity, best effort.
 *
 * Behind a proxy the socket address is the proxy's, so the forwarded header is
 * the only signal available — and it is client-settable, so a determined caller
 * can rotate it and defeat the limit. That is accepted here: this limiter is
 * for accidents and casual abuse, not for an attacker.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
