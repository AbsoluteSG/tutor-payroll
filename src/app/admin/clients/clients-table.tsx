"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatUSDPlain } from "@/lib/format-client";
import { ListFilterBar } from "@/components/list-filter-bar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ClientRow = {
  id: string;
  paymentName: string;
  displayName: string;
  active: boolean;
  owed: string;
};

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [balance, setBalance] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (
        q &&
        !c.paymentName.toLowerCase().includes(q) &&
        !c.displayName.toLowerCase().includes(q)
      )
        return false;
      if (status === "active" && !c.active) return false;
      if (status === "inactive" && c.active) return false;
      const owesMoney = parseFloat(c.owed) > 0;
      if (balance === "owes" && !owesMoney) return false;
      if (balance === "paid" && owesMoney) return false;
      return true;
    });
  }, [clients, query, status, balance]);

  return (
    <div className="grid gap-4">
      <ListFilterBar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search by payment or display name…"
        filters={[
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          {
            label: "Balance",
            value: balance,
            onChange: setBalance,
            options: [
              { value: "all", label: "All" },
              { value: "owes", label: "Owes money" },
              { value: "paid", label: "Paid up" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No clients match your search.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment name</TableHead>
              <TableHead>Display name</TableHead>
              <TableHead className="text-right">Owes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} data-reveal>
                <TableCell>
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {c.paymentName}
                  </Link>
                  {!c.active && (
                    <Badge variant="outline" className="ml-2">
                      inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{c.displayName}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUSDPlain(c.owed)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
