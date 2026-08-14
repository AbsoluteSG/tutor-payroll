"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tutorBookingSettingsSchema } from "@/lib/schemas";
import { Prisma } from "@/generated/prisma/client";
import type { TutorTier } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

/**
 * What a tutor charges the public, what they earn, and whether they appear at
 * all. Manager-only — a tutor setting their own pay rate is not a feature.
 */
export async function updateTutorBookingSettingsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireManager();

  const parsed = tutorBookingSettingsSchema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug") ?? "",
    tier: formData.get("tier") ?? "",
    defaultTutorRate: formData.get("defaultTutorRate") ?? "",
    timeZone: formData.get("timeZone") ?? "America/New_York",
    // An unchecked checkbox sends nothing at all, so absence is false.
    bookable: formData.get("bookable") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, slug, tier, defaultTutorRate, timeZone, bookable } = parsed.data;

  // Only the same TUTOR guard the rest of the admin actions use.
  const tutor = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!tutor || tutor.role !== "TUTOR") return { error: "Not a tutor" };

  // Reject a zone the runtime cannot actually resolve, rather than storing a
  // typo that silently breaks every availability calculation later.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    return { error: "That isn't a valid time zone." };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        slug: slug || null,
        tier: tier ? (tier as TutorTier) : null,
        defaultTutorRate: defaultTutorRate
          ? new Prisma.Decimal(defaultTutorRate)
          : null,
        timeZone,
        bookable: Boolean(bookable),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Another tutor already uses that slug." };
    }
    throw error;
  }

  revalidatePath(`/admin/tutors/${id}`);
  // The public pages read this list, so their cached copies are now stale.
  revalidatePath("/tutors");
  revalidatePath("/pricing");
  return {};
}
