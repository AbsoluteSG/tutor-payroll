import { prisma } from "@/lib/prisma";
import { deleteInviteAction } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewInviteForm } from "./new-invite-form";
import { CopyLinkButton } from "./copy-link-button";

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
                  <TableHead className="text-right">Link</TableHead>
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
                        {!inv.usedAt && !expired && (
                          <CopyLinkButton url={`${appUrl}/invite/${inv.token}`} />
                        )}
                        {!inv.usedAt && (
                          <form action={deleteInviteAction} className="inline-block">
                            <input type="hidden" name="token" value={inv.token} />
                            <Button variant="ghost" size="sm" type="submit">
                              Delete
                            </Button>
                          </form>
                        )}
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
