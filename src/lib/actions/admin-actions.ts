"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  clientSchema,
  classEditSchema,
  rateCardSchema,
  clientPaymentSchema,
  manualTutorPaymentSchema,
  inviteSchema,
} from "@/lib/schemas";
import { computeEarnings } from "@/lib/money";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

const D = Prisma.Decimal;

// ---------- Clients ----------

export async function createClientAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = clientSchema.safeParse({
    paymentName: formData.get("paymentName"),
    displayName: formData.get("displayName") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let clientId: string;
  try {
    const client = await prisma.client.create({ data: parsed.data });
    clientId = client.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "A client with this payment name already exists." };
    }
    throw err;
  }
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${clientId}`);
}

export async function updateClientAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const parsed = clientSchema.safeParse({
    paymentName: formData.get("paymentName"),
    displayName: formData.get("displayName") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!id || !parsed.success) return { error: parsed.success ? "Missing client" : parsed.error.issues[0].message };

  try {
    await prisma.client.update({ where: { id }, data: parsed.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "A client with this payment name already exists." };
    }
    throw err;
  }
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
}

// ---------- Rate cards ----------

export async function upsertRateCardAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = rateCardSchema.safeParse({
    clientId: formData.get("clientId"),
    tutorId: formData.get("tutorId"),
    tutorRate: formData.get("tutorRate"),
    defaultFullCost: formData.get("defaultFullCost") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { clientId, tutorId, tutorRate, defaultFullCost } = parsed.data;

  await prisma.rateCard.upsert({
    where: { clientId_tutorId: { clientId, tutorId } },
    update: {
      tutorRate: new D(tutorRate),
      defaultFullCost: defaultFullCost ? new D(defaultFullCost) : null,
    },
    create: {
      clientId,
      tutorId,
      tutorRate: new D(tutorRate),
      defaultFullCost: defaultFullCost ? new D(defaultFullCost) : null,
    },
  });
  revalidatePath(`/admin/tutors/${tutorId}`);
}

export async function deleteRateCardAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const card = await prisma.rateCard.delete({ where: { id } });
  revalidatePath(`/admin/tutors/${card.tutorId}`);
}

// ---------- Payments ----------

export async function recordClientPaymentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = clientPaymentSchema.safeParse({
    clientId: formData.get("clientId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    receivedAt: formData.get("receivedAt"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { clientId, amount, method, receivedAt, note } = parsed.data;

  await prisma.clientPayment.create({
    data: { clientId, amount: new D(amount), method, receivedAt: new Date(receivedAt), note },
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export async function recordManualTutorPaymentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = manualTutorPaymentSchema.safeParse({
    tutorId: formData.get("tutorId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { tutorId, amount, paidAt, note } = parsed.data;

  await prisma.tutorPayment.create({
    data: { tutorId, amount: new D(amount), method: "MANUAL", status: "PAID", paidAt: new Date(paidAt), note },
  });
  revalidatePath(`/admin/tutors/${tutorId}`);
  revalidatePath("/admin/tutors");
  revalidatePath("/admin");
}

// ---------- Class sessions ----------

/** Every page whose numbers a class-session change can affect. */
function revalidateClassPaths(tutorId: string, clientId: string) {
  for (const path of [
    "/admin",
    "/admin/submissions",
    "/admin/tutors",
    "/admin/clients",
    `/admin/tutors/${tutorId}`,
    `/admin/clients/${clientId}`,
    "/dashboard",
    "/history",
  ]) {
    revalidatePath(path);
  }
}

export async function setClassVoidedAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const voided = formData.get("voided") === "true";
  const row = await prisma.classSession.update({ where: { id }, data: { voided } });
  revalidateClassPaths(row.tutorId, row.clientId);
}

export async function updateClassAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = classEditSchema.safeParse({
    id: formData.get("id"),
    studentName: formData.get("studentName"),
    date: formData.get("date"),
    durationMinutes: formData.get("durationMinutes"),
    fullCost: formData.get("fullCost"),
    tutorRate: formData.get("tutorRate"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, studentName, date, durationMinutes, fullCost, tutorRate, notes } = parsed.data;

  const row = await prisma.classSession.update({
    where: { id },
    data: {
      studentName,
      date: new Date(date),
      durationMinutes,
      fullCost: new D(fullCost),
      tutorRate: new D(tutorRate),
      tutorEarnings: computeEarnings(tutorRate, durationMinutes),
      notes: notes ?? null,
    },
  });
  revalidateClassPaths(row.tutorId, row.clientId);
  return {};
}

export async function deleteClassAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const row = await prisma.classSession.delete({ where: { id } });
  revalidateClassPaths(row.tutorId, row.clientId);
}

// ---------- Invites ----------

export async function createInviteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "A user with this email already exists." };

  await prisma.inviteToken.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "TUTOR",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  revalidatePath("/admin/invites");
}

export async function deleteInviteAction(formData: FormData): Promise<void> {
  await requireManager();
  const token = String(formData.get("token") ?? "");
  await prisma.inviteToken.delete({ where: { token } });
  revalidatePath("/admin/invites");
}
