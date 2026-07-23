import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AcceptInviteForm } from "./accept-form";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  const valid = invite && !invite.usedAt && invite.expiresAt > new Date();
  const alreadyUsed = Boolean(invite?.usedAt);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Join Tutor Payroll</CardTitle>
          <CardDescription>
            {valid
              ? `Welcome, ${invite.name}! Set a password for ${invite.email}.`
              : alreadyUsed
                ? "This invite has already been used. If that was you, sign in below."
                : "This invite link is invalid or has expired. Ask your manager for a new one."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {valid ? (
            <AcceptInviteForm token={token} />
          ) : (
            <Link href="/login" className={buttonVariants({ className: "w-full" })}>
              Go to login
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
