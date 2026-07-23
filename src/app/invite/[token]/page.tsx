import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInviteForm } from "./accept-form";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  const valid = invite && !invite.usedAt && invite.expiresAt > new Date();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Join Tutor Payroll</CardTitle>
          <CardDescription>
            {valid
              ? `Welcome, ${invite.name}! Set a password for ${invite.email}.`
              : "This invite link is invalid or has expired. Ask your manager for a new one."}
          </CardDescription>
        </CardHeader>
        {valid && (
          <CardContent>
            <AcceptInviteForm token={token} />
          </CardContent>
        )}
      </Card>
    </main>
  );
}
