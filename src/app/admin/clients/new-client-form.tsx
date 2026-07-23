"use client";

import { useActionState } from "react";
import { createClientAction } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewClientForm() {
  const [state, formAction, pending] = useActionState(createClientAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-52 gap-1">
        <span className="text-xs text-neutral-500">Payment name (e.g. name on Zelle)</span>
        <Input name="paymentName" placeholder="John Smith" required />
      </div>
      <div className="grid min-w-52 gap-1">
        <span className="text-xs text-neutral-500">Display name (optional)</span>
        <Input name="displayName" placeholder="Smith family" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create client"}
      </Button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
