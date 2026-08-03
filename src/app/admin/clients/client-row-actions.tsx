"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  updateClientAction,
  setClientActiveAction,
  deleteClientAction,
} from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export type EditableClientRow = {
  id: string;
  paymentName: string;
  displayName: string;
  notes: string;
  active: boolean;
};

export function ClientRowActions({ row }: { row: EditableClientRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const edit = useActionFeedback((fd) => updateClientAction(undefined, fd), {
    success: "Client updated",
    onSuccess: () => setEditOpen(false),
  });
  const toggleActive = useActionFeedback((fd) => setClientActiveAction(fd), {
    success: row.active ? "Client deactivated" : "Client reactivated",
  });
  const remove = useActionFeedback((fd) => deleteClientAction(fd), {
    success: "Client deleted",
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Client actions">
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const fd = new FormData();
              fd.set("id", row.id);
              fd.set("active", String(!row.active));
              toggleActive.formAction(fd);
            }}
          >
            {row.active ? "Deactivate" : "Reactivate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (
                !window.confirm(
                  "Permanently delete this client? Only possible while they have no classes or payments — otherwise deactivate them.",
                )
              )
                return;
              const fd = new FormData();
              fd.set("id", row.id);
              remove.formAction(fd);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription>
              The payment name is how incoming payments are matched — keep it exactly as it appears
              on transfers.
            </DialogDescription>
          </DialogHeader>
          <form action={edit.formAction} className="grid gap-4">
            <input type="hidden" name="id" value={row.id} />
            <div className="grid gap-2">
              <Label htmlFor={`payment-name-${row.id}`}>Payment name</Label>
              <Input
                id={`payment-name-${row.id}`}
                name="paymentName"
                defaultValue={row.paymentName}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`display-name-${row.id}`}>Display name</Label>
              <Input
                id={`display-name-${row.id}`}
                name="displayName"
                defaultValue={row.displayName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`client-notes-${row.id}`}>Notes</Label>
              <Textarea id={`client-notes-${row.id}`} name="notes" rows={2} defaultValue={row.notes} />
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
