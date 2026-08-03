import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewInviteForm } from "./new-invite-form";
import { InviteRowActions } from "./invite-row-actions";

export default async function InvitesPage() {
  const invites = await prisma.inviteToken.findMany({ orderBy: { createdAt: "desc" } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a tutor</CardTitle>
          <CardDescription>
            Creates a link you can send them — they set their own password. Links expire after 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewInviteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invites</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No invites yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => {
                  const expired = !inv.usedAt && inv.expiresAt < new Date();
                  return (
                    <TableRow key={inv.token} data-reveal>
                      <TableCell>{inv.name}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.email}</TableCell>
                      <TableCell>
                        {inv.usedAt ? (
                          <Badge className="bg-green-500/10 text-green-500" variant="outline">
                            accepted
                          </Badge>
                        ) : expired ? (
                          <Badge className="bg-red-500/10 text-red-400" variant="outline">
                            expired
                          </Badge>
                        ) : (
                          <Badge variant="outline">pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <InviteRowActions
                          row={{
                            token: inv.token,
                            name: inv.name,
                            email: inv.email,
                            accepted: Boolean(inv.usedAt),
                            expired,
                            url: `${appUrl}/invite/${inv.token}`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
