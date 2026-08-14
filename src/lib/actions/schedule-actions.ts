"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleClassSchema } from "@/lib/schemas";
import { BUSINESS_TZ, parseDateTimeLocalInZone } from "@/lib/time-zone";
import type { ActionResult } from "@/lib/actions/auth-actions";

/** Manager schedules a class for a tutor↔client pair (must have a rate card). */
export async function createScheduledClassAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();

  const parsed = scheduleClassSchema.safeParse({
    tutorId: formData.get("tutorId"),
    clientId: formData.get("clientId"),
    studentName: formData.get("studentName"),
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { tutorId, clientId, studentName, scheduledAt, durationMinutes, notes } = parsed.data;

  // Only allow pairs the tutor is actually assigned to (same guard as submission).
  const rateCard = await prisma.rateCard.findUnique({
    where: { clientId_tutorId: { clientId, tutorId } },
  });
  if (!rateCard) {
    return { error: "That tutor isn't assigned to that client. Set up a rate first." };
  }

  // A `datetime-local` value is a wall clock with no zone attached, so
  // `new Date(...)` read it in whatever zone the server happened to run in —
  // meaning the same form produced a different instant in development and in
  // production. It is now always read as Brooklyn time, which is what the
  // manager filling the form means, and stored as UTC like every other instant.
  const startsAt = parseDateTimeLocalInZone(scheduledAt, BUSINESS_TZ);
  if (!startsAt) return { error: "That date and time isn't valid." };

  await prisma.scheduledClass.create({
    data: {
      tutorId,
      clientId,
      studentName,
      scheduledAt: startsAt,
      durationMinutes,
      notes,
    },
  });

  revalidatePath("/admin/schedule");
  revalidatePath("/dashboard");
  return {};
}

/** Manager cancels a scheduled class. */
export async function cancelScheduledClassAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const row = await prisma.scheduledClass.findUnique({ where: { id } });
  if (!row || row.status !== "SCHEDULED") return;
  await prisma.scheduledClass.update({ where: { id }, data: { status: "CANCELED" } });
  revalidatePath("/admin/schedule");
  revalidatePath("/dashboard");
}
