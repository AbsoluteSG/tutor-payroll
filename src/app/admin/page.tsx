import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTutorOwedMap, getClientOwedMap, getPlatformMargin } from "@/lib/balances";
import { getPeriodReport } from "@/lib/reporting";
import { resolvePeriod, PERIOD_OPTIONS } from "@/lib/periods";
import { formatUSD, formatDuration, sumDecimals } from "@/lib/money";
import { StatCards } from "@/components/stat-cards";
import { ClassTable } from "@/components/class-table";
import { ReportBreakdown } from "@/components/report-breakdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodPicker } from "./period-picker";

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const period = resolvePeriod({
    period: first(sp.period),
    from: first(sp.from),
    to: first(sp.to),
  });

  const [tutorOwed, clientOwed, platform, report, recent] = await Promise.all([
    getTutorOwedMap(),
    getClientOwedMap(),
    getPlatformMargin(),
    getPeriodReport(period.start, period.endExclusive),
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
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period.key)?.label ?? "Period";

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <StatCards
        stats={[
          { label: "Owed to tutors", value: formatUSD(totalOwedToTutors), accent: "red" },
          { label: "Owed by clients", value: formatUSD(totalOwedByClients), accent: "green" },
          { label: "Your cut (all-time)", value: formatUSD(platform.margin), accent: "green" },
        ]}
      />

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{periodLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {period.rangeLabel || "Every class ever logged"}
            </p>
          </div>
          <PeriodPicker period={period} />
        </div>

        <StatCards
          stats={[
            { label: "Billed to clients", value: formatUSD(report.billed) },
            { label: "Tutor earnings", value: formatUSD(report.tutorEarnings), accent: "red" },
            { label: "Your cut", value: formatUSD(report.margin), accent: "green" },
            { label: "Classes taught", value: String(report.classes) },
          ]}
        />
        <StatCards
          stats={[
            { label: "Hours taught", value: formatDuration(report.minutes) },
            { label: "Payments received", value: formatUSD(report.received), accent: "green" },
            { label: "Paid out to tutors", value: formatUSD(report.paidOut), accent: "red" },
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By tutor</CardTitle>
          <CardDescription>What each tutor taught and earned in this period.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportBreakdown
            rows={report.byTutor}
            nameHeader="Tutor"
            hrefBase="/admin/tutors"
            emptyMessage="No classes in this period."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By client</CardTitle>
          <CardDescription>What each client was billed in this period.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportBreakdown
            rows={report.byClient}
            nameHeader="Client"
            hrefBase="/admin/clients"
            emptyMessage="No classes in this period."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recent submissions</CardTitle>
          <Link href="/admin/submissions" className="text-sm text-muted-foreground hover:underline">
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
