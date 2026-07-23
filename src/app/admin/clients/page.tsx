import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientOwedMap } from "@/lib/balances";
import { formatUSD } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewClientForm } from "./new-client-form";

export default async function ClientsPage() {
  const [clients, owedMap] = await Promise.all([
    prisma.client.findMany({
      orderBy: { paymentName: "asc" },
      select: { id: true, paymentName: true, displayName: true, active: true },
    }),
    getClientOwedMap(),
  ]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a client</CardTitle>
        </CardHeader>
        <CardContent>
          <NewClientForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No clients yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment name</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead className="text-right">Owes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id} data-reveal>
                    <TableCell>
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {c.paymentName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.displayName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUSD(owedMap.get(c.id) ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
