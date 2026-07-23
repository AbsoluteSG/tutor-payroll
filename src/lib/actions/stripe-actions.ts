"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured, isRecipientReady } from "@/lib/stripe";
import { getTutorBalance } from "@/lib/balances";
import { moneyString } from "@/lib/schemas";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Tutor: start (or resume) Stripe onboarding.
 *
 * Uses Accounts v2 recipient accounts (the current Connect API — v1
 * `type: "express"` is deprecated): express dashboard, platform collects
 * fees and owns losses, only the stripe_transfers capability is requested
 * so tutor onboarding stays as short as possible.
 */
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

  let onboardingUrl: string;
  try {
    if (!accountId) {
      const account = await stripe.v2.core.accounts.create({
        contact_email: user.email,
        display_name: user.name,
        dashboard: "express",
        identity: {
          country: "us",
          entity_type: "individual",
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        defaults: {
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
          locales: ["en-US"],
        },
      });
      accountId = account.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeAccountId: accountId } });
    }

    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          refresh_url: `${appUrl()}/settings/payouts?refresh=1`,
          return_url: `${appUrl()}/settings/payouts?onboarded=1`,
        },
      },
    });
    onboardingUrl = link.url;
  } catch (err) {
    console.error("[stripe] onboarding failed:", err);
    redirect("/settings/payouts?error=stripe-error");
  }
  redirect(onboardingUrl);
}

/**
 * Refresh a tutor's onboarding status from Stripe and cache it on the user.
 * Called from the payouts page — no webhook required for onboarding status.
 */
export async function refreshStripeStatus(userId: string, accountId: string): Promise<boolean> {
  try {
    const ready = await isRecipientReady(getStripe(), accountId);
    await prisma.user.update({ where: { id: userId }, data: { stripeOnboarded: ready } });
    return ready;
  } catch (err) {
    console.error("[stripe] status refresh failed:", err);
    return false;
  }
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
  if (!tutor.stripeAccountId) {
    return { error: "This tutor hasn't connected their bank account via Stripe yet." };
  }

  const stripe = getStripe();

  // Re-check capability status right before the transfer (per Stripe guidance —
  // requirements can change after onboarding).
  const ready = await isRecipientReady(stripe, tutor.stripeAccountId).catch(() => false);
  if (!ready) {
    await prisma.user.update({ where: { id: tutorId }, data: { stripeOnboarded: false } });
    return { error: "This tutor's Stripe account isn't ready for transfers (onboarding incomplete or new requirements due)." };
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
  return {};
}
