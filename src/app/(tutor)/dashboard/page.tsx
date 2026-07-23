import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorBalance } from "@/lib/balances";
import { formatUSD } from "@/lib/money";
import { StatCards } from "@/components/stat-cards";
import { ClassTable } from "@/components/class-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TutorDashboard() {
  const user = await requireUser();
  const [balance, recent] = await Promise.all([
    getTutorBalance(user.id),
    prisma.classSession.findMany({
      where: { tutorId: user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { client: { select: { id: true, paymentName: true } } },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
        <Link href="/submit" className={buttonVariants()}>
          Log a class
        </Link>
      </div>

      <StatCards
        stats={[
          { label: "All-time earnings", value: formatUSD(balance.earned) },
          { label: "Paid out", value: formatUSD(balance.paid) },
          { label: "Owed to you", value: formatUSD(balance.owed), accent: "green" },
        ]}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recent classes</CardTitle>
          <Link href="/history" className="text-sm text-muted-foreground hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <ClassTable rows={recent} showClient emptyMessage="No classes yet — log your first one!" />
        </CardContent>
      </Card>
    </div>
  );
}
