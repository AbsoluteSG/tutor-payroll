import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTutorOwedMap } from "@/lib/balances";
import { formatUSD } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TutorsPage() {
  const [tutors, owedMap] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TUTOR" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, active: true, stripeOnboarded: true },
    }),
    getTutorOwedMap(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tutors</CardTitle>
      </CardHeader>
      <CardContent>
        {tutors.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            No tutors yet — send an invite from the{" "}
            <Link href="/admin/invites" className="underline">
              Invites
            </Link>{" "}
            page.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Payouts</TableHead>
                <TableHead className="text-right">Owed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutors.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/admin/tutors/${t.id}`} className="font-medium underline-offset-2 hover:underline">
                      {t.name}
                    </Link>
                    {!t.active && (
                      <Badge variant="outline" className="ml-2">
                        inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-500">{t.email}</TableCell>
                  <TableCell>
                    {t.stripeOnboarded ? (
                      <Badge className="bg-green-100 text-green-800" variant="outline">
                        Stripe connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">manual</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUSD(owedMap.get(t.id) ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
