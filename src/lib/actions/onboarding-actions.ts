"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * The welcome form a tutor sees once, after accepting their invite.
 *
 * What it does NOT collect is the point: tier, pay rate and `bookable` are all
 * absent. Those are what a client pays, what the tutor earns, and whether they
 * appear on the site — none of which is the tutor's to decide. Completing this
 * form makes a tutor ready to be published; a manager publishes them.
 */

export type OnboardingResult = { error?: string } | undefined;

/** Minutes from local midnight, from an <input type="time"> value. */
function toMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes >= 0 && minutes <= 1440 ? minutes : null;
}

const profileSchema = z.object({
  timeZone: z.string().trim().min(1, "Pick your time zone.").max(64),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  headline: z
    .string()
    .trim()
    .min(3, "Tell us in a few words what you teach.")
    .max(120, "Keep this to one line."),
  bio: z
    .string()
    .trim()
    .min(20, "A sentence or two, please.")
    .max(1500, "That's longer than a profile needs."),
  subjects: z.string().trim().max(500).optional().or(z.literal("")),
  // Coerced from a number input, which posts a string. Blank means "not said"
  // rather than zero — a card with "0 years tutoring" on it is worse than one
  // with no line at all.
  yearsTutoring: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(60)])
    .optional(),
});

/** Step one: who they are and what they teach. */
export async function saveOnboardingProfileAction(
  _prev: OnboardingResult,
  formData: FormData
): Promise<OnboardingResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    timeZone: formData.get("timeZone"),
    phone: formData.get("phone"),
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    subjects: formData.get("subjects"),
    yearsTutoring: formData.get("yearsTutoring"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Comma-separated in the form, an array in the database. Empty entries are
  // dropped so a trailing comma does not become a blank chip on the site.
  const subjects = (data.subjects ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      timeZone: data.timeZone,
      phone: data.phone || null,
      headline: data.headline,
      bio: data.bio,
      subjects,
      yearsTutoring:
        data.yearsTutoring === "" || data.yearsTutoring === undefined
          ? null
          : data.yearsTutoring,
    },
  });

  revalidatePath("/welcome");
  return undefined;
}

const RANGE_LIMIT = 3;

/**
 * Step two: when they can teach.
 *
 * Replaces the week wholesale rather than patching it — the form posts the
 * complete picture every time, and a partial update would leave rows from a
 * previous submission that the tutor can no longer see.
 *
 * Completing this step is what sets `onboardedAt`: availability is the last
 * thing the booking system actually needs, and a tutor who stops before it
 * would otherwise count as done while being unbookable.
 */
export async function saveOnboardingAvailabilityAction(
  _prev: OnboardingResult,
  formData: FormData
): Promise<OnboardingResult> {
  const user = await requireUser();

  const rules: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let i = 0; i < RANGE_LIMIT; i++) {
      const start = String(formData.get(`d${weekday}_start_${i}`) ?? "");
      const end = String(formData.get(`d${weekday}_end_${i}`) ?? "");
      if (!start && !end) continue;

      const startMinute = toMinutes(start);
      const endMinute = toMinutes(end);
      if (startMinute === null || endMinute === null) {
        return { error: "Check the times — one of them isn't a valid time." };
      }
      if (endMinute <= startMinute) {
        return { error: "Each finish time has to be after its start time." };
      }
      rules.push({ weekday, startMinute, endMinute });
    }
  }

  if (rules.length === 0) {
    return { error: "Add at least one time you can teach." };
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { tutorId: user.id } }),
    prisma.availabilityRule.createMany({
      data: rules.map((r) => ({ tutorId: user.id, ...r })),
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { onboardedAt: new Date() },
    }),
  ]);

  revalidatePath("/welcome");
  revalidatePath("/settings/availability");
  return undefined;
}
