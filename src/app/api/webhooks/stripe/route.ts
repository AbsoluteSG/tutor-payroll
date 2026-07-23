import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { recordCheckoutResult } from "@/lib/stripe-payments";

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

  // Onboarding status is checked live against the Accounts v2 API (see
  // refreshStripeStatus) — no account webhook needed. This endpoint only
  // handles money-movement events.
  switch (event.type) {
    // Client paid a payment link (card: fires paid; ACH: fires with
    // payment_status "unpaid", recorded on async_payment_succeeded below).
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      await recordCheckoutResult(event.data.object);
      break;
    }
    // ACH debit failed after checkout. The request is still PENDING, so the
    // same link keeps working — nothing to change, just leave a trace.
    case "checkout.session.async_payment_failed": {
      console.warn(
        `[stripe] async payment failed for request ${event.data.object.metadata?.paymentRequestId}`,
      );
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
