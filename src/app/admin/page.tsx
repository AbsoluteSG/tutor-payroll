import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTutorOwedMap, getClientOwedMap, getPlatformMargin } from "@/lib/balances";
import { formatUSD, sumDecimals } from "@/lib/money";
import { StatCards } from "@/components/stat-cards";
import { ClassTable } from "@/components/class-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverview() {
  const [tutorOwed, clientOwed, platform, recent] = await Promise.all([
    getTutorOwedMap(),
    getClientOwedMap(),
    getPlatformMargin(),
    prisma.classSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        tutor: { select: { id: true, name: true } },
        client: { select: { id: true, paymentName: true } },
      },
    }),
  ]);

  const totalOwedToTutors = sumDecimals([...tutorOwed.values()]);
  const totalOwedByClients = sumDecimals([...clientOwed.values()]);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <StatCards
        stats={[
          { label: "Owed to tutors", value: formatUSD(totalOwedToTutors), accent: "red" },
          { label: "Owed by clients", value: formatUSD(totalOwedByClients), accent: "green" },
          { label: "Your cut (all-time)", value: formatUSD(platform.margin), accent: "green" },
          {
            label: "Net position",
            value: formatUSD(totalOwedByClients.minus(totalOwedToTutors)),
          },
        ]}
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recent submissions</CardTitle>
          <Link href="/admin/submissions" className="text-sm text-neutral-500 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <ClassTable rows={recent} showTutor showClient adminLinks showMargin />
        </CardContent>
      </Card>
    </div>
  );
}
