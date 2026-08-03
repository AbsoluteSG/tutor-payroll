"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatUSDPlain } from "@/lib/format-client";
import { ListFilterBar } from "@/components/list-filter-bar";
import { TutorRowActions } from "./tutor-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TutorRow = {
  id: string;
  name: string;
  email: string;
  username: string;
  active: boolean;
  stripeOnboarded: boolean;
  owed: string;
};

export function TutorsTable({ tutors }: { tutors: TutorRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [payouts, setPayouts] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tutors.filter((t) => {
      if (
        q &&
        !t.name.toLowerCase().includes(q) &&
        !t.email.toLowerCase().includes(q) &&
        !t.username.toLowerCase().includes(q)
      )
        return false;
      if (status === "active" && !t.active) return false;
      if (status === "inactive" && t.active) return false;
      if (payouts === "stripe" && !t.stripeOnboarded) return false;
      if (payouts === "manual" && t.stripeOnboarded) return false;
      return true;
    });
  }, [tutors, query, status, payouts]);

  return (
    <div className="grid gap-4">
      <ListFilterBar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search by name, email, or username…"
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
            label: "Payouts",
            value: payouts,
            onChange: setPayouts,
            options: [
              { value: "all", label: "All" },
              { value: "stripe", label: "Stripe connected" },
              { value: "manual", label: "Manual" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tutors match your search.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Payouts</TableHead>
              <TableHead className="text-right">Owed</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} data-reveal>
                <TableCell>
                  <Link href={`/admin/tutors/${t.id}`} className="font-medium underline-offset-2 hover:underline">
                    {t.name}
                  </Link>
                  {!t.active && (
                    <Badge variant="outline" className="ml-2">
                      inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{t.email}</TableCell>
                <TableCell>
                  {t.stripeOnboarded ? (
                    <Badge className="bg-green-500/10 text-green-500" variant="outline">
                      Stripe connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">manual</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatUSDPlain(t.owed)}</TableCell>
                <TableCell className="text-right">
                  <TutorRowActions
                    row={{
                      id: t.id,
                      name: t.name,
                      email: t.email,
                      username: t.username,
                      active: t.active,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
