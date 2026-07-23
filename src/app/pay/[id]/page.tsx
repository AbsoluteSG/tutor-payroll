import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { recordCheckoutResult } from "@/lib/stripe-payments";
import { startCheckoutAction } from "@/lib/actions/payment-request-actions";
import { formatUSD } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  let request = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { client: { select: { paymentName: true, displayName: true } } },
  });
  if (!request) notFound();

  // Returning from Stripe (or a stale PENDING with a session): sync so card
  // payments show "Paid" immediately even without a webhook (local dev).
  if (request.status === "PENDING" && request.stripeSessionId && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(request.stripeSessionId);
      const recorded = await recordCheckoutResult(session);
      if (recorded) {
        request = { ...request, status: "PAID", paidAt: new Date() };
      }
    } catch (err) {
      console.error("[stripe] pay-page sync failed:", err);
    }
  }

  const label = request.client.displayName ?? request.client.paymentName;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tutoring payment</CardTitle>
          <CardDescription>For {label}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{formatUSD(request.amount.toString())}</p>
            {request.note && <p className="mt-1 text-sm text-muted-foreground">{request.note}</p>}
          </div>

          {request.status === "PAID" ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-500" variant="outline">
                Paid
              </Badge>
              <span className="text-sm text-muted-foreground">Thank you — you&apos;re all set!</span>
            </div>
          ) : request.status === "CANCELED" ? (
            <p className="text-sm text-muted-foreground">
              This payment link is no longer active. Reach out to your tutor coordinator if you think
              that&apos;s a mistake.
            </p>
          ) : (
            <>
              {sp.back && (
                <p className="text-sm text-muted-foreground">
                  If you just paid by bank transfer, it can take a few days to clear — this page will
                  show Paid once it does.
                </p>
              )}
              {sp.error && (
                <p className="text-sm text-red-400">
                  Something went wrong starting the payment. Please try again.
                </p>
              )}
              <form action={startCheckoutAction}>
                <input type="hidden" name="id" value={request.id} />
                <Button type="submit" className="w-full">
                  Pay securely with Stripe
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Card or US bank account (ACH). Payments are processed by Stripe — we never see your
                card details.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
