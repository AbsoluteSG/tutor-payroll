import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTutorBalance } from "@/lib/balances";
import { formatUSD } from "@/lib/money";
import { StatCards } from "@/components/stat-cards";
import { ClassTable } from "@/components/class-table";
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
import { PaymentSection } from "./payment-section";
import { RateCardEditor } from "./rate-card-editor";

export default async function TutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await prisma.user.findUnique({
    where: { id, role: "TUTOR" },
    select: { id: true, name: true, email: true, active: true, stripeOnboarded: true },
  });
  if (!tutor) notFound();

  const [balance, classes, payments, rateCards, allClients] = await Promise.all([
    getTutorBalance(id),
    prisma.classSession.findMany({
      where: { tutorId: id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { client: { select: { id: true, paymentName: true } } },
    }),
    prisma.tutorPayment.findMany({ where: { tutorId: id }, orderBy: { paidAt: "desc" } }),
    prisma.rateCard.findMany({
      where: { tutorId: id },
      include: { client: { select: { id: true, paymentName: true, displayName: true } } },
      orderBy: { client: { paymentName: "asc" } },
    }),
    prisma.client.findMany({
      where: { active: true },
      select: { id: true, paymentName: true, displayName: true },
      orderBy: { paymentName: "asc" },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{tutor.name}</h1>
          {tutor.stripeOnboarded ? (
            <Badge className="bg-green-500/10 text-green-500" variant="outline">
              Stripe connected
            </Badge>
          ) : (
            <Badge variant="outline">manual payouts only</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{tutor.email}</p>
      </div>

      <StatCards
        stats={[
          { label: "All-time earnings", value: formatUSD(balance.earned) },
          { label: "Paid", value: formatUSD(balance.paid) },
          { label: "Owed", value: formatUSD(balance.owed), accent: balance.owed.gt(0) ? "red" : "neutral" },
          { label: "Your cut", value: formatUSD(balance.margin), accent: "green" },
        ]}
      />

      <PaymentSection
        tutorId={tutor.id}
        owed={balance.owed.toFixed(2)}
        stripeReady={tutor.stripeOnboarded}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rates & clients</CardTitle>
          <CardDescription>
            Which clients this tutor can log classes for, and at what hourly rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RateCardEditor
            tutorId={tutor.id}
            rateCards={rateCards.map((rc) => ({
              id: rc.id,
              clientId: rc.clientId,
              clientName: rc.client.displayName ?? rc.client.paymentName,
              tutorRate: rc.tutorRate.toString(),
              defaultFullCost: rc.defaultFullCost?.toString() ?? "",
            }))}
            clients={allClients.map((c) => ({
              id: c.id,
              label: c.displayName ?? c.paymentName,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission log</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassTable rows={classes} showClient adminLinks showActions showMargin />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} data-reveal>
                    <TableCell className="whitespace-nowrap">
                      {p.paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>{p.method === "STRIPE" ? "Stripe" : "Manual"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          p.status === "PAID"
                            ? "bg-green-500/10 text-green-500"
                            : p.status === "FAILED"
                              ? "bg-red-500/10 text-red-400"
                              : ""
                        }
                      >
                        {p.status.toLowerCase()}
                      </Badge>
                    </TableCell>
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
