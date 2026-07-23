import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatDuration } from "@/lib/money";
import { Prisma } from "@/generated/prisma/client";
import { ClassRowActions } from "@/components/class-row-actions";

export type ClassRow = {
  id: string;
  date: Date;
  studentName: string;
  durationMinutes: number;
  fullCost: unknown;
  tutorRate: unknown;
  tutorEarnings: unknown;
  voided: boolean;
  notes: string | null;
  tutor?: { id: string; name: string };
  client?: { id: string; paymentName: string };
};

export function ClassTable({
  rows,
  showTutor = false,
  showClient = false,
  adminLinks = false,
  showActions = false,
  showMargin = false,
  emptyMessage = "No classes yet.",
}: {
  rows: ClassRow[];
  showTutor?: boolean;
  showClient?: boolean;
  /** Link tutor/client names to their admin profiles. */
  adminLinks?: boolean;
  /** Show the manager's edit/void/delete menu column. */
  showActions?: boolean;
  /** Show the manager's cut (full cost − tutor earnings). Admin views only. */
  showMargin?: boolean;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          {showTutor && <TableHead>Tutor</TableHead>}
          {showClient && <TableHead>Client</TableHead>}
          <TableHead>Student</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Full cost</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Earnings</TableHead>
          {showMargin && <TableHead className="text-right">Your cut</TableHead>}
          {showActions && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} data-reveal className={row.voided ? "opacity-50" : undefined}>
            <TableCell className="whitespace-nowrap">
              {row.date.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}
              {row.voided && (
                <Badge variant="outline" className="ml-2 text-red-400">
                  voided
                </Badge>
              )}
            </TableCell>
            {showTutor && (
              <TableCell>
                {adminLinks && row.tutor ? (
                  <Link href={`/admin/tutors/${row.tutor.id}`} className="underline-offset-2 hover:underline">
                    {row.tutor.name}
                  </Link>
                ) : (
                  row.tutor?.name
                )}
              </TableCell>
            )}
            {showClient && (
              <TableCell>
                {adminLinks && row.client ? (
                  <Link href={`/admin/clients/${row.client.id}`} className="underline-offset-2 hover:underline">
                    {row.client.paymentName}
                  </Link>
                ) : (
                  row.client?.paymentName
                )}
              </TableCell>
            )}
            <TableCell>{row.studentName}</TableCell>
            <TableCell>{formatDuration(row.durationMinutes)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(String(row.fullCost))}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(String(row.tutorRate))}/h</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(String(row.tutorEarnings))}</TableCell>
            {showMargin && (
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatUSD(new Prisma.Decimal(String(row.fullCost)).minus(String(row.tutorEarnings)))}
              </TableCell>
            )}
            {showActions && (
              <TableCell className="text-right">
                <ClassRowActions
                  row={{
                    id: row.id,
                    studentName: row.studentName,
                    dateISO: row.date.toISOString().slice(0, 10),
                    durationMinutes: row.durationMinutes,
                    fullCost: String(row.fullCost),
                    tutorRate: String(row.tutorRate),
                    notes: row.notes ?? "",
                    voided: row.voided,
                  }}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
