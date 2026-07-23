"use client";

import { useActionState } from "react";
import { createInviteAction } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewInviteForm() {
  const [state, formAction, pending] = useActionState(createInviteAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-48 gap-1">
        <span className="text-xs text-neutral-500">Name</span>
        <Input name="name" placeholder="Taylor Tutor" required />
      </div>
      <div className="grid min-w-56 gap-1">
        <span className="text-xs text-neutral-500">Email</span>
        <Input name="email" type="email" placeholder="tutor@example.com" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create invite"}
      </Button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
