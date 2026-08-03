"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  updateInviteAction,
  renewInviteAction,
  deleteInviteAction,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EditableInviteRow = {
  token: string;
  name: string;
  email: string;
  accepted: boolean;
  expired: boolean;
  url: string;
};

export function InviteRowActions({ row }: { row: EditableInviteRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const edit = useActionFeedback((fd) => updateInviteAction(undefined, fd), {
    success: "Invite updated",
    onSuccess: () => setEditOpen(false),
  });
  const renew = useActionFeedback((fd) => renewInviteAction(fd), {
    success: "Invite renewed — the link works for another 7 days",
  });
  const remove = useActionFeedback((fd) => deleteInviteAction(fd), {
    success: "Invite deleted",
  });

  const submitToken = (action: (fd: FormData) => void) => {
    const fd = new FormData();
    fd.set("token", row.token);
    action(fd);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Invite actions">
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {!row.accepted && (
            <DropdownMenuItem
              onClick={async () => {
                await navigator.clipboard.writeText(row.url);
                toast.success("Invite link copied to clipboard");
              }}
            >
              Copy link
            </DropdownMenuItem>
          )}
          {!row.accepted && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          )}
          {!row.accepted && (
            <DropdownMenuItem onClick={() => submitToken(renew.formAction)}>
              {row.expired ? "Renew link" : "Extend 7 days"}
            </DropdownMenuItem>
          )}
          {!row.accepted && <DropdownMenuSeparator />}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              const message = row.accepted
                ? "Delete this accepted invite record? The tutor's account is not affected."
                : "Delete this invite? The link will stop working immediately.";
              if (!window.confirm(message)) return;
              submitToken(remove.formAction);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit invite</DialogTitle>
            <DialogDescription>
              The invite link stays the same — only the name and email on it change.
            </DialogDescription>
          </DialogHeader>
          <form action={edit.formAction} className="grid gap-4">
            <input type="hidden" name="token" value={row.token} />
            <div className="grid gap-2">
              <Label htmlFor={`invite-name-${row.token}`}>Name</Label>
              <Input id={`invite-name-${row.token}`} name="name" defaultValue={row.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`invite-email-${row.token}`}>Email</Label>
              <Input
                id={`invite-email-${row.token}`}
                name="email"
                type="email"
                defaultValue={row.email}
                required
              />
            </div>
            {edit.error && <p className="text-sm text-red-400">{edit.error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={edit.pending}>
                {edit.pending && <Spinner />}
                {edit.pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
