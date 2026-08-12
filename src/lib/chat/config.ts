/**
 * Whether the chat box appears on the marketing site.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  TO TURN THE CHAT ON: set SHOW_CHAT to true.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Off for launch, because the chat has two hard dependencies that production
 * does not have yet, and a chat button that fails is worse than no chat button:
 *
 *   1. ANTHROPIC_API_KEY in the Vercel project settings. Without it the
 *      assistant answers 503.
 *   2. The `20260810120000_chat` migration applied to the production database.
 *      The build script runs `prisma generate && next build`, not
 *      `migrate deploy`, so it will not apply itself — run
 *      `npx prisma migrate deploy` against production once. Without those
 *      tables, "Talk to a person" 500s too.
 *
 * Both halves degrade with a readable message rather than crashing, but a
 * visitor who presses the one button on the page that promises a human and
 * gets an error has been told something about the practice that isn't true.
 *
 * Flip this once both are in place, then check /admin/chat opens and a test
 * conversation goes end to end.
 */
export const SHOW_CHAT = false;
