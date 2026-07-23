"use client";

import { createClientAction } from "@/lib/actions/admin-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function NewClientForm() {
  // Success navigates to the new client's profile, so no toast needed.
  const { formAction, error, pending } = useActionFeedback((fd) => createClientAction(undefined, fd));

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-52 gap-1">
        <span className="text-xs text-muted-foreground">Payment name (e.g. name on Zelle)</span>
        <Input name="paymentName" placeholder="John Smith" required />
      </div>
      <div className="grid min-w-52 gap-1">
        <span className="text-xs text-muted-foreground">Display name (optional)</span>
        <Input name="displayName" placeholder="Smith family" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Creating…" : "Create client"}
      </Button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
