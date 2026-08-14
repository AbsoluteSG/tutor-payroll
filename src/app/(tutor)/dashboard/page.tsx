import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorBalance } from "@/lib/balances";
import { formatUSD } from "@/lib/money";
import { StatCards } from "@/components/stat-cards";
import { ClassTable } from "@/components/class-table";
import { UpcomingClasses } from "@/components/upcoming-classes";
import { DashboardGrid } from "@/components/dashboard-grid";
import { buttonVariants } from "@/components/ui/button";
import { SubmittedToast } from "./submitted-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TutorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser();
  const { submitted } = await searchParams;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [balance, recent, upcoming, me] = await Promise.all([
    getTutorBalance(user.id),
    prisma.classSession.findMany({
      where: { tutorId: user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { client: { select: { id: true, paymentName: true } } },
    }),
    prisma.scheduledClass.findMany({
      where: { tutorId: user.id, status: "SCHEDULED", scheduledAt: { gte: startOfToday } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { client: { select: { paymentName: true, displayName: true } } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { timeZone: true },
    }),
  ]);

  const widgets = [
    {
      id: "balance",
      node: (
        <StatCards
          stats={[
            { label: "All-time earnings", value: formatUSD(balance.earned) },
            { label: "Paid out", value: formatUSD(balance.paid) },
            { label: "Owed to you", value: formatUSD(balance.owed), accent: "green" as const },
          ]}
        />
      ),
    },
    {
      id: "upcoming",
      node: (
        <UpcomingClasses
          timeZone={me?.timeZone}
          // The widget deliberately keeps its cap of five; /schedule is where
          // everything lives, so this links there rather than growing.
          viewAllHref="/schedule"
          rows={upcoming.map((u) => ({
            id: u.id,
            scheduledAt: u.scheduledAt,
            durationMinutes: u.durationMinutes,
            studentName: u.studentName,
            clientLabel: u.client.displayName ?? u.client.paymentName,
          }))}
        />
      ),
    },
    {
      id: "recent",
      node: (
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
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      {submitted === "1" && <SubmittedToast />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
        <Link href="/submit" className={buttonVariants()}>
          Log a class
        </Link>
      </div>

      <DashboardGrid items={widgets} storageKey={`dashboard-order:${user.id}`} />
    </div>
  );
}
