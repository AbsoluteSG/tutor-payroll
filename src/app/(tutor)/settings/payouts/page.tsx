import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeConfigured } from "@/lib/stripe";
import { startStripeOnboardingAction } from "@/lib/actions/stripe-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PayoutsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string; error?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true, stripeOnboarded: true },
  });

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Payout settings</CardTitle>
        <CardDescription>
          Connect your bank account through Stripe so your manager can pay you directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {dbUser?.stripeOnboarded ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800" variant="outline">
              Connected
            </Badge>
            <span className="text-sm text-neutral-600">
              Your bank account is linked. Payouts arrive automatically.
            </span>
          </div>
        ) : (
          <>
            {sp.onboarded && !dbUser?.stripeOnboarded && (
              <p className="text-sm text-neutral-600">
                Thanks! Stripe is verifying your details — this page will show “Connected” once
                everything clears (usually within a few minutes).
              </p>
            )}
            {sp.error === "stripe-not-configured" && (
              <p className="text-sm text-red-600">
                Payouts aren&apos;t set up on this server yet. Ask your manager.
              </p>
            )}
            {stripeConfigured() ? (
              <form action={startStripeOnboardingAction}>
                <Button type="submit">
                  {dbUser?.stripeAccountId ? "Resume onboarding" : "Connect bank account"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-neutral-500">
                Online payouts aren&apos;t enabled yet — your manager pays you manually for now.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
