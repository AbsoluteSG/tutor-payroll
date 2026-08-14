"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/auth-actions";

/**
 * A tutor's own availability.
 *
 * Every write here is scoped to `user.id` and never to an id from the form.
 * That matters more than usual: `(tutor)/layout.tsx` only calls `requireUser`,
 * so a MANAGER can reach these pages too — and a manager wandering in must edit
 * their own availability, not somebody else's.
 */

const MAX_RANGES_PER_DAY = 8;

type Range = { weekday: number; startMinute: number; endMinute: number };

/** "16:30" → 990. Returns null on anything malformed. */
function toMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  const total = hours * 60 + minutes;
  return total <= 1440 ? total : null;
}

/**
 * Replace the whole ruleset in one transaction rather than diffing rows.
 *
 * The form always posts the complete week, so a delete-then-create is both
 * simpler and impossible to get half-applied. It matches the minimalism
 * elsewhere in this codebase — `ScheduledClass` has create and cancel and no
 * edit — and at a handful of rows per tutor the cost is irrelevant.
 */
export async function saveAvailabilityAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const ranges: Range[] = [];
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const starts = formData.getAll(`start-${weekday}`).map(String);
    const ends = formData.getAll(`end-${weekday}`).map(String);

    if (starts.length > MAX_RANGES_PER_DAY) {
      return { error: "That's too many windows in one day." };
    }

    for (let i = 0; i < starts.length; i += 1) {
      // A row the tutor cleared out. Skip rather than complain.
      if (!starts[i] && !ends[i]) continue;

      const startMinute = toMinutes(starts[i] ?? "");
      const endMinute = toMinutes(ends[i] ?? "");
      if (startMinute == null || endMinute == null) {
        return { error: "Check the times — one of them isn't valid." };
      }
      if (startMinute >= endMinute) {
        return { error: "A window has to end after it starts." };
      }
      ranges.push({ weekday, startMinute, endMinute });
    }
  }

  // Overlapping windows on the same day would emit duplicate candidate slots
  // and make the grid look wrong. Rejected here rather than deduped silently,
  // so the tutor can see what they typed.
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const day = ranges
      .filter((r) => r.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < day.length; i += 1) {
      if (day[i].startMinute < day[i - 1].endMinute) {
        return { error: "Two windows on the same day overlap." };
      }
    }
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { tutorId: user.id } }),
    ...(ranges.length > 0
      ? [
          prisma.availabilityRule.createMany({
            data: ranges.map((r) => ({ ...r, tutorId: user.id })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/settings/availability");
  return {};
}

/** The zone the tutor's windows are written in. */
export async function setTimeZoneAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const timeZone = String(formData.get("timeZone") ?? "").trim();
  if (!timeZone) return { error: "Pick a time zone." };

  // Reject anything the runtime can't resolve rather than storing a typo that
  // breaks every slot calculation later.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    return { error: "That isn't a valid time zone." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { timeZone },
  });

  revalidatePath("/settings/availability");
  revalidatePath("/schedule");
  return {};
}

/** Block out a day — a holiday, an exam week. */
export async function addAvailabilityExceptionAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const date = String(formData.get("date") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a date." };
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  await prisma.availabilityException.create({
    data: {
      tutorId: user.id,
      // A `@db.Date` carries no zone; the string names a calendar day and is
      // stored as that day at UTC midnight.
      date: new Date(`${date}T00:00:00.000Z`),
      allDay: true,
      note: note || null,
    },
  });

  revalidatePath("/settings/availability");
  return {};
}

export async function removeAvailabilityExceptionAction(
  formData: FormData
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Scoped by tutorId as well as id: deleteMany makes a mismatch a no-op
  // rather than letting one tutor delete another's day off.
  await prisma.availabilityException.deleteMany({
    where: { id, tutorId: user.id },
  });
  revalidatePath("/settings/availability");
}
