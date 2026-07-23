"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getTutorBalance } from "@/lib/balances";
import { moneyString } from "@/lib/schemas";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Tutor: start (or resume) Stripe Express onboarding. */
export async function startStripeOnboardingAction(): Promise<void> {
  const user = await requireUser();
  if (!stripeConfigured()) {
    redirect("/settings/payouts?error=stripe-not-configured");
  }
  const stripe = getStripe();

  let accountId = (await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true },
  }))?.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
    });
    accountId = account.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeAccountId: accountId } });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl()}/settings/payouts?refresh=1`,
    return_url: `${appUrl()}/settings/payouts?onboarded=1`,
    type: "account_onboarding",
  });
  redirect(link.url);
}

/** Manager: pay a tutor via Stripe transfer. Amount defaults to full owed balance. */
export async function payTutorViaStripeAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireManager();
  const tutorId = String(formData.get("tutorId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();

  if (!stripeConfigured()) {
    return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in the environment." };
  }

  const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
  if (!tutor) return { error: "Tutor not found." };
  if (!tutor.stripeAccountId || !tutor.stripeOnboarded) {
    return { error: "This tutor hasn't connected their bank account via Stripe yet." };
  }

  const balance = await getTutorBalance(tutorId);
  let amount: Prisma.Decimal;
  if (amountRaw) {
    const parsed = moneyString.safeParse(amountRaw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    amount = new Prisma.Decimal(parsed.data);
  } else {
    amount = balance.owed;
  }
  if (amount.lte(0)) return { error: "Nothing to pay — balance is zero." };
  if (amount.gt(balance.owed)) {
    return { error: `Amount exceeds owed balance (${balance.owed.toFixed(2)}).` };
  }

  const stripe = getStripe();

  // Create the ledger row first so the payout is never untracked, then attach
  // the transfer. The idempotency key prevents double-transfers on retries.
  const payment = await prisma.tutorPayment.create({
    data: { tutorId, amount, method: "STRIPE", status: "PENDING" },
  });

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: amount.mul(100).toNumber(), // cents
        currency: "usd",
        destination: tutor.stripeAccountId,
        description: `Tutor payout — ${tutor.name}`,
        metadata: { tutorPaymentId: payment.id, tutorId },
      },
      { idempotencyKey: `tutor-payment-${payment.id}` },
    );
    await prisma.tutorPayment.update({
      where: { id: payment.id },
      // Transfers to a connected account settle immediately from the platform
      // balance; Stripe then auto-pays out to the tutor's bank.
      data: { stripeTransferId: transfer.id, status: "PAID", paidAt: new Date() },
    });
  } catch (err) {
    await prisma.tutorPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", note: err instanceof Error ? err.message : "Transfer failed" },
    });
    return { error: err instanceof Error ? err.message : "Stripe transfer failed." };
  }

  revalidatePath(`/admin/tutors/${tutorId}`);
  revalidatePath("/admin/tutors");
  revalidatePath("/admin");
}
