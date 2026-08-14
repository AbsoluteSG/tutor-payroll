"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  cancelBookingAction,
  refundBookingAction,
  resolveBookingAction,
  syncBookingAction,
} from "@/lib/actions/booking-admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BookingRowActions({
  id,
  needsAttention,
  paid,
  suggestedRefund,
  canCancel,
}: {
  id: string;
  needsAttention: boolean;
  paid: boolean;
  /** The stranded amount, prefilled — usually exactly what should go back. */
  suggestedRefund: string;
  canCancel: boolean;
}) {
  const [refundOpen, setRefundOpen] = useState(false);

  const sync = useActionFeedback((fd) => syncBookingAction(fd), {
    success: "Checked with Stripe",
  });
  const cancel = useActionFeedback((fd) => cancelBookingAction(fd), {
    success: "Booking cancelled",
  });
  const resolve = useActionFeedback((fd) => resolveBookingAction(fd), {
    success: "Marked resolved",
  });
  const refund = useActionFeedback(
    (fd) => refundBookingAction(undefined, fd),
    { success: "Refunded", onSuccess: () => setRefundOpen(false) }
  );

  const submitId = (action: (fd: FormData) => void) => {
    const fd = new FormData();
    fd.set("id", id);
    action(fd);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {needsAttention && (
          <Button size="sm" variant="outline" onClick={() => submitId(resolve.formAction)}>
            Mark resolved
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Booking actions">
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => submitId(sync.formAction)}>
              Check with Stripe
            </DropdownMenuItem>
            {paid && (
              <DropdownMenuItem onClick={() => setRefundOpen((v) => !v)}>
                {refundOpen ? "Hide refund" : "Refund…"}
              </DropdownMenuItem>
            )}
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (
                      !window.confirm(
                        paid
                          ? "Cancel this booking and its classes? The payment stays on the client's account as credit until you refund it."
                          : "Cancel this booking and free its times?"
                      )
                    ) {
                      return;
                    }
                    submitId(cancel.formAction);
                  }}
                >
                  Cancel booking
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {refundOpen && (
        <form action={refund.formAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-1">
            <label htmlFor={`refund-${id}`} className="text-xs text-muted-foreground">
              Amount to refund
            </label>
            <Input
              id={`refund-${id}`}
              name="amount"
              inputMode="decimal"
              defaultValue={suggestedRefund}
              className="w-32"
            />
          </div>
          <Button type="submit" variant="outline" disabled={refund.pending}>
            {refund.pending && <Spinner />}
            {refund.pending ? "Refunding…" : "Refund"}
          </Button>
          {refund.error && <p className="text-sm text-red-400">{refund.error}</p>}
        </form>
      )}
    </>
  );
}
