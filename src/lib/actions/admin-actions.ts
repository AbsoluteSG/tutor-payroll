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
  inviteEditSchema,
  tutorEditSchema,
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

export async function setClientActiveAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return { error: "Missing client" };

  await prisma.client.update({ where: { id }, data: { active } });
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
  return {};
}

/**
 * Hard-delete a client. Refused once the client has history — deactivating
 * keeps past classes and payments intact, which is almost always what's wanted.
 */
export async function deleteClientAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing client" };

  const [classes, payments] = await Promise.all([
    prisma.classSession.count({ where: { clientId: id } }),
    prisma.clientPayment.count({ where: { clientId: id } }),
  ]);
  if (classes > 0 || payments > 0) {
    return {
      error: `This client has ${classes} class(es) and ${payments} payment(s) on record. Deactivate them instead to keep the history.`,
    };
  }

  await prisma.paymentRequest.deleteMany({ where: { clientId: id } });
  await prisma.client.delete({ where: { id } });
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return {};
}

// ---------- Tutors ----------

/**
 * These actions are reachable from the tutor list only, so they must never be
 * able to edit or remove a manager account (including the caller's own).
 */
async function assertTutor(id: string): Promise<ActionResult | null> {
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return { error: "Tutor not found." };
  if (user.role !== "TUTOR") return { error: "Only tutor accounts can be changed here." };
  return null;
}

export async function updateTutorAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = tutorEditSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, name, email, username } = parsed.data;
  const guard = await assertTutor(id);
  if (guard) return guard;

  try {
    await prisma.user.update({
      where: { id },
      data: { name, email, username: username ? username : null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = String(err.meta?.target ?? "");
      return {
        error: target.includes("username")
          ? "That username is already taken."
          : "Another user already has this email.",
      };
    }
    throw err;
  }
  revalidatePath(`/admin/tutors/${id}`);
  revalidatePath("/admin/tutors");
  return {};
}

export async function setTutorActiveAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return { error: "Missing tutor" };
  const guard = await assertTutor(id);
  if (guard) return guard;

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath(`/admin/tutors/${id}`);
  revalidatePath("/admin/tutors");
  return {};
}

/** Hard-delete a tutor. Refused once they have classes or payouts on record. */
export async function deleteTutorAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing tutor" };
  const guard = await assertTutor(id);
  if (guard) return guard;

  const [classes, payments] = await Promise.all([
    prisma.classSession.count({ where: { tutorId: id } }),
    prisma.tutorPayment.count({ where: { tutorId: id } }),
  ]);
  if (classes > 0 || payments > 0) {
    return {
      error: `This tutor has ${classes} class(es) and ${payments} payout(s) on record. Deactivate them instead to keep the history.`,
    };
  }

  // Rate cards and scheduled classes are plans, not history — safe to drop.
  await prisma.scheduledClass.deleteMany({ where: { tutorId: id } });
  await prisma.rateCard.deleteMany({ where: { tutorId: id } });
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/tutors");
  revalidatePath("/admin");
  return {};
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

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  revalidatePath("/admin/invites");
}

export async function updateInviteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const parsed = inviteEditSchema.safeParse({
    token: formData.get("token"),
    email: formData.get("email"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { token, email, name } = parsed.data;

  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite) return { error: "Invite not found." };
  if (invite.usedAt) return { error: "This invite has already been accepted." };

  if (email !== invite.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "A user with this email already exists." };
  }

  await prisma.inviteToken.update({ where: { token }, data: { email, name } });
  revalidatePath("/admin/invites");
  return {};
}

/** Push an invite's expiry back out to 7 days from now, so the link works again. */
export async function renewInviteAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing invite" };

  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite) return { error: "Invite not found." };
  if (invite.usedAt) return { error: "This invite has already been accepted." };

  await prisma.inviteToken.update({
    where: { token },
    data: { expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  revalidatePath("/admin/invites");
  return {};
}

export async function deleteInviteAction(formData: FormData): Promise<ActionResult> {
  await requireManager();
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing invite" };
  await prisma.inviteToken.delete({ where: { token } });
  revalidatePath("/admin/invites");
  return {};
}
