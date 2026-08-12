/**
 * The booking panel's availability grid.
 *
 * ─── None of this is real ───────────────────────────────────────────────────
 * Weekday names rather than dates, deliberately: a real date implies a real
 * calendar, and nothing here is connected to one. The times are a fixed
 * placeholder set, uneven per day only so the grid does not read as a mock-up
 * where everything is always free.
 *
 * This is why the panel says "request" rather than "book" and states that
 * nothing is reserved until the practice replies. Replace this with a
 * scheduling backend — and the wording at the same time — before the site
 * carries paid traffic.
 *
 * Lived in book-v2/ while the two booking iterations were being compared. That
 * exploration is gone and its winner is now the shared panel, so the data moved
 * here with it.
 */

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];

export const SLOTS = [
  "3:30 pm",
  "4:00 pm",
  "4:30 pm",
  "5:00 pm",
  "5:30 pm",
  "6:00 pm",
  "6:30 pm",
  "7:00 pm",
];

/** Keyed by day so the pattern is stable between renders. */
const UNAVAILABLE: Record<string, string[]> = {
  Monday: ["3:30 pm", "6:30 pm"],
  Tuesday: ["5:00 pm"],
  Wednesday: ["3:30 pm", "4:00 pm", "7:00 pm"],
  Thursday: ["6:00 pm", "6:30 pm"],
  Saturday: ["5:30 pm", "6:00 pm", "6:30 pm", "7:00 pm"],
};

export function slotsFor(day: string) {
  const taken = UNAVAILABLE[day] ?? [];
  return SLOTS.map((time) => ({ time, available: !taken.includes(time) }));
}
