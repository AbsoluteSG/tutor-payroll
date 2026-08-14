import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cancelScheduledClassAction } from "@/lib/actions/schedule-actions";
import { formatDuration } from "@/lib/money";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScheduleForm, type TutorOption } from "./schedule-form";

export default async function SchedulePage() {
  // Show anything scheduled from yesterday onward.
  const since = new Date();
  since.setDate(since.getDate() - 1);

  const [tutors, scheduled] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TUTOR", active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        rateCards: {
          where: { client: { active: true } },
          include: { client: { select: { id: true, paymentName: true, displayName: true } } },
          orderBy: { client: { paymentName: "asc" } },
        },
      },
    }),
    prisma.scheduledClass.findMany({
      orderBy: { scheduledAt: "asc" },
      where: { scheduledAt: { gte: since } },
      include: {
        tutor: { select: { id: true, name: true } },
        client: { select: { id: true, paymentName: true } },
      },
    }),
  ]);

  const tutorOptions: TutorOption[] = tutors.map((t) => ({
    id: t.id,
    name: t.name,
    clients: t.rateCards.map((rc) => ({
      id: rc.client.id,
      label: rc.client.displayName ?? rc.client.paymentName,
    })),
  }));

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule a class</CardTitle>
          <CardDescription>
            The tutor sees it on their dashboard and logs it in one click when it happens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tutorOptions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No active tutors with client rates yet.
            </p>
          ) : (
            <ScheduleForm tutors={tutorOptions} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming &amp; recent</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduled.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduled.map((s) => (
                  <TableRow key={s.id} data-reveal>
                    <TableCell className="whitespace-nowrap">
                      {formatInstant(s.scheduledAt, BUSINESS_TZ, {
                        weekday: undefined,
                      })}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/tutors/${s.tutor.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {s.tutor.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/clients/${s.client.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {s.client.paymentName}
                      </Link>
                    </TableCell>
                    <TableCell>{s.studentName}</TableCell>
                    <TableCell>{formatDuration(s.durationMinutes)}</TableCell>
                    <TableCell>
                      {s.status === "COMPLETED" ? (
                        <Badge className="bg-green-500/10 text-green-500" variant="outline">
                          logged
                        </Badge>
                      ) : s.status === "CANCELED" ? (
                        <Badge variant="outline">canceled</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-500" variant="outline">
                          scheduled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === "SCHEDULED" && (
                        <form action={cancelScheduledClassAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <Button variant="ghost" size="sm" type="submit">
                            Cancel
                          </Button>
                        </form>
                      )}
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
