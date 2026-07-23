"use client";

import { payTutorViaStripeAction } from "@/lib/actions/stripe-actions";
import { recordManualTutorPaymentAction } from "@/lib/actions/admin-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PaymentSection({
  tutorId,
  owed,
  stripeReady,
}: {
  tutorId: string;
  owed: string;
  stripeReady: boolean;
}) {
  const stripe = useActionFeedback((fd) => payTutorViaStripeAction(undefined, fd), {
    success: "Payout sent — the tutor's bank transfer is on its way",
  });
  const manual = useActionFeedback((fd) => recordManualTutorPaymentAction(undefined, fd), {
    success: "Payment recorded",
  });
  const nothingOwed = parseFloat(owed) <= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pay via Stripe</CardTitle>
          <CardDescription>
            {stripeReady
              ? "Transfers from your Stripe balance to the tutor's bank."
              : "Unavailable — the tutor hasn't connected a bank account yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={stripe.formAction} className="grid gap-3">
            <input type="hidden" name="tutorId" value={tutorId} />
            <div className="grid gap-2">
              <Label htmlFor="stripe-amount">Amount (blank = full balance)</Label>
              <Input
                id="stripe-amount"
                name="amount"
                inputMode="decimal"
                placeholder={owed}
                disabled={!stripeReady || nothingOwed}
              />
            </div>
            {stripe.error && <p className="text-sm text-red-400">{stripe.error}</p>}
            <Button type="submit" disabled={!stripeReady || nothingOwed || stripe.pending}>
              {stripe.pending && <Spinner />}
              {stripe.pending ? "Paying…" : nothingOwed ? "Nothing owed" : `Pay $${owed}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record manual payment</CardTitle>
          <CardDescription>For payouts made outside the app (Zelle, cash…).</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={manual.formAction} className="grid gap-3">
            <input type="hidden" name="tutorId" value={tutorId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="manual-amount">Amount ($)</Label>
                <Input id="manual-amount" name="amount" inputMode="decimal" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-date">Date</Label>
                <Input id="manual-date" name="paidAt" type="date" defaultValue={todayISO()} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-note">Note (optional)</Label>
              <Input id="manual-note" name="note" placeholder="e.g. Zelle 7/23" />
            </div>
            {manual.error && <p className="text-sm text-red-400">{manual.error}</p>}
            <Button type="submit" variant="outline" disabled={manual.pending}>
              {manual.pending && <Spinner />}
              {manual.pending ? "Recording…" : "Record payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
