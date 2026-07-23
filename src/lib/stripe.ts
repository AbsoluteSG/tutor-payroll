import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Go-live readiness check for a v2 recipient account: transfers can only be
 * sent once the stripe_transfers capability is active. (v1's payouts_enabled
 * is deprecated — capability status is the source of truth.)
 */
export async function isRecipientReady(stripe: Stripe, accountId: string): Promise<boolean> {
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient"],
  });
  return (
    account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ===
    "active"
  );
}
