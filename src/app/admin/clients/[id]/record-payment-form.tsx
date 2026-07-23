"use client";

import { recordClientPaymentAction } from "@/lib/actions/admin-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RecordPaymentForm({ clientId }: { clientId: string }) {
  const { formAction, error, pending } = useActionFeedback(
    (fd) => recordClientPaymentAction(undefined, fd),
    { success: "Payment recorded" },
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid w-32 gap-1">
        <span className="text-xs text-muted-foreground">Amount ($)</span>
        <Input name="amount" inputMode="decimal" placeholder="100" required />
      </div>
      <div className="grid w-36 gap-1">
        <span className="text-xs text-muted-foreground">Method</span>
        <Select
          name="method"
          items={[
            { value: "ZELLE", label: "Zelle" },
            { value: "CASH", label: "Cash" },
            { value: "CHECK", label: "Check" },
            { value: "OTHER", label: "Other" },
          ]}
          defaultValue="ZELLE"
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ZELLE">Zelle</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="CHECK">Check</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-40 gap-1">
        <span className="text-xs text-muted-foreground">Date received</span>
        <Input name="receivedAt" type="date" defaultValue={todayISO()} required />
      </div>
      <div className="grid min-w-44 flex-1 gap-1">
        <span className="text-xs text-muted-foreground">Note (optional)</span>
        <Input name="note" placeholder="e.g. Zelle confirmation #" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Recording…" : "Record"}
      </Button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
