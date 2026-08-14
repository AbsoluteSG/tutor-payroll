import { z } from "zod";

/** "12", "12.5", "12.50" — a positive money amount with ≤2 decimals. */
export const moneyString = z
  .string()
  .trim()
  .regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a valid amount, e.g. 45 or 45.50")
  .refine((v) => parseFloat(v) > 0, "Amount must be greater than zero");

export const classSubmissionSchema = z.object({
  clientId: z.string().min(1, "Pick a client"),
  studentName: z.string().trim().min(1, "Student name is required").max(120),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  durationMinutes: z.coerce.number().int().min(5, "Too short").max(600, "Too long"),
  fullCost: moneyString,
  notes: z.string().trim().max(500).optional(),
});

/** Manager editing a submitted class — rate is editable here (unlike tutor submission). */
export const classEditSchema = z.object({
  id: z.string().min(1),
  studentName: z.string().trim().min(1, "Student name is required").max(120),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  durationMinutes: z.coerce.number().int().min(5, "Too short").max(600, "Too long"),
  fullCost: moneyString,
  tutorRate: moneyString,
  notes: z.string().trim().max(500).optional(),
});

export const clientSchema = z.object({
  paymentName: z.string().trim().min(1, "Payment name is required").max(120),
  displayName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const rateCardSchema = z.object({
  clientId: z.string().min(1),
  tutorId: z.string().min(1),
  tutorRate: moneyString,
  defaultFullCost: moneyString.optional().or(z.literal("")),
});

export const clientPaymentSchema = z.object({
  clientId: z.string().min(1),
  amount: moneyString,
  method: z.enum(["ZELLE", "CASH", "CHECK", "OTHER"]),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  note: z.string().trim().max(500).optional(),
});

export const manualTutorPaymentSchema = z.object({
  tutorId: z.string().min(1),
  amount: moneyString,
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  note: z.string().trim().max(500).optional(),
});

/**
 * A "call me back" from the public site.
 *
 * Only name and email are required. Every extra required field on a lead form
 * costs leads, and the point of this one is to get a phone call started — the
 * rest can be asked on the call.
 */
export const enquirySchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  preferredTimes: z.string().trim().max(200).optional().or(z.literal("")),
  path: z.string().trim().max(200).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  tutorSlug: z.string().trim().max(120).optional().or(z.literal("")),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  name: z.string().trim().min(1, "Name is required").max(120),
});

/** Manager editing a pending invite from the row menu. */
export const inviteEditSchema = inviteSchema.extend({
  token: z.string().min(1),
});

/**
 * What a manager sets to make a tutor bookable on the public site.
 *
 * Everything is optional so a half-configured tutor can be saved and finished
 * later — the bookability gate in lib/booking/tutors.ts is what decides whether
 * the result is complete enough to sell, not this schema.
 */
export const tutorBookingSettingsSchema = z.object({
  id: z.string().min(1),
  /** Matches the marketing roster's slug, e.g. "samantha-yershov". */
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{1,60}$/, "Slug: lowercase letters, numbers and dashes")
    .optional()
    .or(z.literal("")),
  tier: z.enum(["JUNIOR", "MID", "SENIOR"]).optional().or(z.literal("")),
  defaultTutorRate: moneyString.optional().or(z.literal("")),
  /** An IANA zone. Validated against the runtime's own list, not a regex. */
  timeZone: z.string().trim().min(1).max(64),
  bookable: z.coerce.boolean().optional(),
});

/** Lowercase letters, digits, dot/dash/underscore; no "@" so it can't collide with emails. */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{2,29}$/, "Username: 3–30 chars, letters/numbers/._- only");

/** Manager editing a tutor from the row menu. Blank username clears it. */
export const tutorEditSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  username: usernameSchema.optional().or(z.literal("")),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  username: usernameSchema.optional(),
});

/** A user editing their own profile. Blank username clears it; blank newPassword keeps the current one. */
export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  username: usernameSchema.optional().or(z.literal("")),
  currentPassword: z.string().min(1, "Enter your current password to save changes"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200).optional().or(z.literal("")),
});

export const scheduleClassSchema = z.object({
  tutorId: z.string().min(1, "Pick a tutor"),
  clientId: z.string().min(1, "Pick a client"),
  studentName: z.string().trim().min(1, "Student name is required").max(120),
  // From a datetime-local input, e.g. "2026-08-01T14:30".
  scheduledAt: z
    .string()
    .min(1, "Pick a date and time")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date/time"),
  durationMinutes: z.coerce.number().int().min(5, "Too short").max(600, "Too long"),
  notes: z.string().trim().max(500).optional(),
});
