"use client";

import { createInviteAction } from "@/lib/actions/admin-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function NewInviteForm() {
  const { formAction, error, pending } = useActionFeedback(
    (fd) => createInviteAction(undefined, fd),
    { success: "Invite created — copy the link from the list below" },
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-48 gap-1">
        <span className="text-xs text-muted-foreground">Name</span>
        <Input name="name" placeholder="Taylor Tutor" required />
      </div>
      <div className="grid min-w-56 gap-1">
        <span className="text-xs text-muted-foreground">Email</span>
        <Input name="email" type="email" placeholder="tutor@example.com" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Creating…" : "Create invite"}
      </Button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
