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
import { setClassVoidedAction } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";

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
  showVoidControls = false,
  showMargin = false,
  emptyMessage = "No classes yet.",
}: {
  rows: ClassRow[];
  showTutor?: boolean;
  showClient?: boolean;
  /** Link tutor/client names to their admin profiles. */
  adminLinks?: boolean;
  /** Show the manager's void/restore button column. */
  showVoidControls?: boolean;
  /** Show the manager's cut (full cost − tutor earnings). Admin views only. */
  showMargin?: boolean;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">{emptyMessage}</p>;
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
          {showVoidControls && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className={row.voided ? "opacity-50" : undefined}>
            <TableCell className="whitespace-nowrap">
              {row.date.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}
              {row.voided && (
                <Badge variant="outline" className="ml-2 text-red-600">
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
              <TableCell className="text-right tabular-nums text-neutral-500">
                {formatUSD(new Prisma.Decimal(String(row.fullCost)).minus(String(row.tutorEarnings)))}
              </TableCell>
            )}
            {showVoidControls && (
              <TableCell className="text-right">
                <form action={setClassVoidedAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="voided" value={String(!row.voided)} />
                  <Button variant="ghost" size="sm" type="submit">
                    {row.voided ? "Restore" : "Void"}
                  </Button>
                </form>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
