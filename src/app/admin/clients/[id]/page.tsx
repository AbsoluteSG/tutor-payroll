import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientBalance } from "@/lib/balances";
import { formatUSD } from "@/lib/money";
import { StatCards } from "@/components/stat-cards";
import { ClassTable } from "@/components/class-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordPaymentForm } from "./record-payment-form";
import { PaymentLinks } from "./payment-links";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [balance, classes, payments, paymentRequests] = await Promise.all([
    getClientBalance(id),
    prisma.classSession.findMany({
      where: { clientId: id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        tutor: { select: { id: true, name: true } },
        client: { select: { id: true, paymentName: true } },
      },
    }),
    prisma.clientPayment.findMany({ where: { clientId: id }, orderBy: { receivedAt: "desc" } }),
    prisma.paymentRequest.findMany({ where: { clientId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{client.paymentName}</h1>
        {client.displayName && <p className="text-sm text-muted-foreground">{client.displayName}</p>}
        {client.notes && <p className="mt-1 text-sm text-muted-foreground">{client.notes}</p>}
      </div>

      <StatCards
        stats={[
          { label: "All-time billed", value: formatUSD(balance.billed) },
          { label: "Received", value: formatUSD(balance.received) },
          // A client who booked online has paid before any class is logged, so
          // `owed` is legitimately negative until the tutor works through the
          // sessions. Rendering that as "Owes −$900" reads like a bug; it is a
          // credit, and saying so is the whole fix.
          balance.owed.lt(0)
            ? {
                label: "In credit",
                value: formatUSD(balance.owed.negated()),
                accent: "neutral" as const,
              }
            : {
                label: "Owes",
                value: formatUSD(balance.owed),
                accent: balance.owed.gt(0) ? ("green" as const) : ("neutral" as const),
              },
          { label: "Your cut", value: formatUSD(balance.margin), accent: "green" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment links</CardTitle>
          <CardDescription>
            Send the client a link to pay by card or bank transfer — the payment records itself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentLinks
            clientId={client.id}
            owed={balance.owed.toFixed(2)}
            appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
            requests={paymentRequests.map((r) => ({
              id: r.id,
              amount: r.amount.toFixed(2),
              note: r.note ?? "",
              status: r.status,
              createdAt: r.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record a payment</CardTitle>
          <CardDescription>
            When money comes in (e.g. a Zelle from “{client.paymentName}”), log it here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordPaymentForm clientId={client.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classes</CardTitle>
          <CardDescription>All classes across tutors and students for this client.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClassTable rows={classes} showTutor adminLinks showActions showMargin />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments received</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} data-reveal>
                    <TableCell className="whitespace-nowrap">
                      {p.receivedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="capitalize">{p.method.toLowerCase()}</TableCell>
                    <TableCell className="text-muted-foreground">{p.note}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUSD(p.amount.toString())}</TableCell>
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
