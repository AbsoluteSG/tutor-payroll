import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeConfigured } from "@/lib/stripe";
import { startStripeOnboardingAction, refreshStripeStatus } from "@/lib/actions/stripe-actions";
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

  // Live-refresh from Stripe whenever the user has an account that isn't
  // confirmed ready yet (covers returning from onboarding — no webhook needed).
  let onboarded = dbUser?.stripeOnboarded ?? false;
  if (stripeConfigured() && dbUser?.stripeAccountId && !onboarded) {
    onboarded = await refreshStripeStatus(user.id, dbUser.stripeAccountId);
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Payout settings</CardTitle>
        <CardDescription>
          Connect your bank account through Stripe so your manager can pay you directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {onboarded ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/10 text-green-500" variant="outline">
              Connected
            </Badge>
            <span className="text-sm text-muted-foreground">
              Your bank account is linked. Payouts arrive automatically.
            </span>
          </div>
        ) : (
          <>
            {sp.onboarded && (
              <p className="text-sm text-muted-foreground">
                Thanks! Stripe is verifying your details — check back shortly; this page will show
                “Connected” once everything clears.
              </p>
            )}
            {sp.error === "stripe-not-configured" && (
              <p className="text-sm text-red-400">
                Payouts aren&apos;t set up on this server yet. Ask your manager.
              </p>
            )}
            {sp.error === "stripe-error" && (
              <p className="text-sm text-red-400">
                Something went wrong talking to Stripe. Try again in a minute — if it keeps
                happening, tell your manager.
              </p>
            )}
            {stripeConfigured() ? (
              <form action={startStripeOnboardingAction}>
                <Button type="submit">
                  {dbUser?.stripeAccountId ? "Resume onboarding" : "Connect bank account"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Online payouts aren&apos;t enabled yet — your manager pays you manually for now.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
