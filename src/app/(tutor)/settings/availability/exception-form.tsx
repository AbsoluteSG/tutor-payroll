"use client";

import { useActionFeedback } from "@/lib/use-action-feedback";
import { addAvailabilityExceptionAction } from "@/lib/actions/availability-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/** Block out a single day. Whole days only — see the model's doc comment. */
export function ExceptionForm() {
  const add = useActionFeedback(
    (fd) => addAvailabilityExceptionAction(undefined, fd),
    { success: "Day blocked out" }
  );

  return (
    <form action={add.formAction} className="flex flex-wrap items-end gap-2">
      <div className="grid gap-1">
        <label htmlFor="exception-date" className="text-xs text-muted-foreground">
          Date
        </label>
        <Input id="exception-date" name="date" type="date" required className="w-44" />
      </div>
      <div className="grid min-w-48 flex-1 gap-1">
        <label htmlFor="exception-note" className="text-xs text-muted-foreground">
          Why? (optional)
        </label>
        <Input id="exception-note" name="note" placeholder="e.g. finals week" />
      </div>
      <Button type="submit" variant="outline" disabled={add.pending}>
        {add.pending && <Spinner />}
        Block out
      </Button>
      {add.error && <p className="text-sm text-red-400">{add.error}</p>}
    </form>
  );
}
