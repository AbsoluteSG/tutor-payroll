import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // Tutor finished (or updated) Express onboarding.
    case "account.updated": {
      const account = event.data.object;
      await prisma.user.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboarded: Boolean(account.payouts_enabled) },
      });
      break;
    }
    // A transfer we created was reversed (e.g. insufficient funds recovery).
    case "transfer.reversed": {
      const transfer = event.data.object;
      await prisma.tutorPayment.updateMany({
        where: { stripeTransferId: transfer.id },
        data: { status: "FAILED", note: "Transfer reversed in Stripe" },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
