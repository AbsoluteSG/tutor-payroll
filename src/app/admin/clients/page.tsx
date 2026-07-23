import { prisma } from "@/lib/prisma";
import { getClientOwedMap } from "@/lib/balances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewClientForm } from "./new-client-form";
import { ClientsTable } from "./clients-table";

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
            <ClientsTable
              clients={clients.map((c) => ({
                id: c.id,
                paymentName: c.paymentName,
                displayName: c.displayName ?? "",
                active: c.active,
                owed: (owedMap.get(c.id) ?? 0).toString(),
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
