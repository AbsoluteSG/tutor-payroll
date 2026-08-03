import Link from "next/link";
import { formatUSD, formatDuration } from "@/lib/money";
import type { ReportBreakdownRow } from "@/lib/reporting";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Per-tutor or per-client activity for a reporting period. */
export function ReportBreakdown({
  rows,
  nameHeader,
  hrefBase,
  emptyMessage,
}: {
  rows: ReportBreakdownRow[];
  nameHeader: string;
  /** e.g. "/admin/tutors" — rows link to `${hrefBase}/${id}`. */
  hrefBase: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameHeader}</TableHead>
          <TableHead className="text-right">Classes</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead className="text-right">Billed</TableHead>
          <TableHead className="text-right">Tutor earnings</TableHead>
          <TableHead className="text-right">Your cut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} data-reveal>
            <TableCell>
              <Link href={`${hrefBase}/${r.id}`} className="font-medium underline-offset-2 hover:underline">
                {r.name}
              </Link>
            </TableCell>
            <TableCell className="text-right tabular-nums">{r.classes}</TableCell>
            <TableCell className="text-right tabular-nums">{formatDuration(r.minutes)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(r.billed)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(r.tutorEarnings)}</TableCell>
            <TableCell className="text-right tabular-nums text-green-500">
              {formatUSD(r.margin)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
