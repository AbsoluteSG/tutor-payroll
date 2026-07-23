"use client";

import {
  createPaymentRequestAction,
  cancelPaymentRequestAction,
  syncPaymentRequestAction,
} from "@/lib/actions/payment-request-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CopyButton } from "@/components/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PaymentRequestRow = {
  id: string;
  amount: string;
  note: string;
  status: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
};

export function PaymentLinks({
  clientId,
  owed,
  requests,
  appUrl,
}: {
  clientId: string;
  owed: string;
  requests: PaymentRequestRow[];
  appUrl: string;
}) {
  const create = useActionFeedback((fd) => createPaymentRequestAction(undefined, fd), {
    success: "Payment link created — copy it below and send it to the client",
  });
  const cancel = useActionFeedback((fd) => cancelPaymentRequestAction(fd), {
    success: "Payment link canceled",
  });
  const sync = useActionFeedback((fd) => syncPaymentRequestAction(fd), {
    success: "Synced with Stripe",
  });

  return (
    <div className="grid gap-4">
      <form action={create.formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="clientId" value={clientId} />
        <div className="grid w-32 gap-1">
          <span className="text-xs text-muted-foreground">Amount ($)</span>
          <Input name="amount" inputMode="decimal" defaultValue={parseFloat(owed) > 0 ? owed : ""} required />
        </div>
        <div className="grid min-w-52 flex-1 gap-1">
          <span className="text-xs text-muted-foreground">What&apos;s it for? (shown to the client)</span>
          <Input name="note" placeholder="e.g. March classes — Emma & Liam" />
        </div>
        <Button type="submit" disabled={create.pending}>
          {create.pending && <Spinner />}
          {create.pending ? "Creating…" : "Create link"}
        </Button>
        {create.error && <p className="w-full text-sm text-red-400">{create.error}</p>}
      </form>

      {requests.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id} data-reveal>
                <TableCell className="whitespace-nowrap">{r.createdAt}</TableCell>
                <TableCell className="text-muted-foreground">{r.note}</TableCell>
                <TableCell>
                  {r.status === "PAID" ? (
                    <Badge className="bg-green-500/10 text-green-500" variant="outline">
                      paid
                    </Badge>
                  ) : r.status === "CANCELED" ? (
                    <Badge variant="outline">canceled</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-500" variant="outline">
                      pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">${r.amount}</TableCell>
                <TableCell className="text-right">
                  {r.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1">
                      <CopyButton text={`${appUrl}/pay/${r.id}`} toastMessage="Payment link copied" />
                      <form
                        action={sync.formAction}
                        className="inline-block"
                        title="Check Stripe for a completed payment"
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <Button variant="ghost" size="sm" type="submit" disabled={sync.pending}>
                          Sync
                        </Button>
                      </form>
                      <form action={cancel.formAction} className="inline-block">
                        <input type="hidden" name="id" value={r.id} />
                        <Button variant="ghost" size="sm" type="submit" disabled={cancel.pending}>
                          Cancel
                        </Button>
                      </form>
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
