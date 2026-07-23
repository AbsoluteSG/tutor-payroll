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

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
