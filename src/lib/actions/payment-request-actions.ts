"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createCheckoutSession, recordCheckoutResult } from "@/lib/stripe-payments";
import { moneyString } from "@/lib/schemas";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

/** Manager: create a shareable payment link for a client. */
export async function createPaymentRequestAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  if (!stripeConfigured()) {
    return { error: "Stripe is not configured on this server." };
  }
  const clientId = String(formData.get("clientId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const parsedAmount = moneyString.safeParse(formData.get("amount"));
  if (!clientId || !parsedAmount.success) {
    return { error: parsedAmount.success ? "Missing client" : parsedAmount.error.issues[0].message };
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "Client not found." };

  await prisma.paymentRequest.create({
    data: { clientId, amount: new Prisma.Decimal(parsedAmount.data), note },
  });
  revalidatePath(`/admin/clients/${clientId}`);
  return {};
}

/** Manager: cancel a pending payment link. */
export async function cancelPaymentRequestAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const request = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!request || request.status !== "PENDING") return;
  await prisma.paymentRequest.update({ where: { id }, data: { status: "CANCELED" } });
  revalidatePath(`/admin/clients/${request.clientId}`);
}

/**
 * Manager: pull the latest session state from Stripe and record it if paid.
 * Backstop for missed webhooks (and the primary path in local dev).
 */
export async function syncPaymentRequestAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id") ?? "");
  const request = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!request?.stripeSessionId || request.status !== "PENDING") return;

  const session = await getStripe().checkout.sessions.retrieve(request.stripeSessionId);
  await recordCheckoutResult(session);
  revalidatePath(`/admin/clients/${request.clientId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

/**
 * Public (no auth): called from /pay/[id] — mints a fresh Checkout session
 * and sends the client to Stripe's hosted payment page.
 */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const request = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { client: { select: { paymentName: true, displayName: true } } },
  });
  if (!request || request.status !== "PENDING" || !stripeConfigured()) {
    redirect(`/pay/${id}`);
  }

  let url: string | null = null;
  try {
    const session = await createCheckoutSession({
      id: request.id,
      clientId: request.clientId,
      amount: request.amount,
      note: request.note,
      clientLabel: request.client.displayName ?? request.client.paymentName,
    });
    await prisma.paymentRequest.update({
      where: { id: request.id },
      data: { stripeSessionId: session.id },
    });
    url = session.url;
  } catch (err) {
    console.error("[stripe] checkout session failed:", err);
    redirect(`/pay/${id}?error=1`);
  }
  redirect(url ?? `/pay/${id}?error=1`);
}
