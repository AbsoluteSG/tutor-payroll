"use client";

import { useActionState } from "react";
import { upsertRateCardAction, deleteRateCardAction } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RateCardRow = {
  id: string;
  clientId: string;
  clientName: string;
  tutorRate: string;
  defaultFullCost: string;
};

export function RateCardEditor({
  tutorId,
  rateCards,
  clients,
}: {
  tutorId: string;
  rateCards: RateCardRow[];
  clients: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(upsertRateCardAction, undefined);
  const unassigned = clients.filter((c) => !rateCards.some((rc) => rc.clientId === c.id));

  return (
    <div className="grid gap-4">
      {rateCards.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Tutor rate ($/h)</TableHead>
              <TableHead className="text-right">Default full cost ($)</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateCards.map((rc) => (
              <TableRow key={rc.id}>
                <TableCell>{rc.clientName}</TableCell>
                <TableCell className="text-right tabular-nums">{rc.tutorRate}</TableCell>
                <TableCell className="text-right tabular-nums">{rc.defaultFullCost || "—"}</TableCell>
                <TableCell className="text-right">
                  <form action={deleteRateCardAction}>
                    <input type="hidden" name="id" value={rc.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      Remove
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-md border p-3">
        <input type="hidden" name="tutorId" value={tutorId} />
        <div className="grid min-w-44 gap-1">
          <span className="text-xs text-neutral-500">Client</span>
          <Select
            name="clientId"
            items={clients.map((c) => ({ value: c.id, label: c.label }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                  {rateCards.some((rc) => rc.clientId === c.id) ? " (update)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-32 gap-1">
          <span className="text-xs text-neutral-500">Rate ($/h)</span>
          <Input name="tutorRate" inputMode="decimal" placeholder="30" required />
        </div>
        <div className="grid w-36 gap-1">
          <span className="text-xs text-neutral-500">Default cost ($)</span>
          <Input name="defaultFullCost" inputMode="decimal" placeholder="optional" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save rate"}
        </Button>
        {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        {unassigned.length === 0 && clients.length > 0 && rateCards.length === clients.length && (
          <p className="w-full text-xs text-neutral-400">All clients assigned — picking one updates its rate.</p>
        )}
      </form>
    </div>
  );
}
