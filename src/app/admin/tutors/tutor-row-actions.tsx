"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  updateTutorAction,
  setTutorActiveAction,
  deleteTutorAction,
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

export type EditableTutorRow = {
  id: string;
  name: string;
  email: string;
  username: string;
  active: boolean;
};

export function TutorRowActions({ row }: { row: EditableTutorRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const edit = useActionFeedback((fd) => updateTutorAction(undefined, fd), {
    success: "Tutor updated",
    onSuccess: () => setEditOpen(false),
  });
  const toggleActive = useActionFeedback((fd) => setTutorActiveAction(fd), {
    success: row.active ? "Tutor deactivated" : "Tutor reactivated",
  });
  const remove = useActionFeedback((fd) => deleteTutorAction(fd), {
    success: "Tutor deleted",
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Tutor actions">
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
                  "Permanently delete this tutor? Only possible while they have no classes or payouts — otherwise deactivate them.",
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
            <DialogTitle>Edit tutor</DialogTitle>
            <DialogDescription>
              They sign in with either their email or username. Leave the username blank to clear it.
            </DialogDescription>
          </DialogHeader>
          <form action={edit.formAction} className="grid gap-4">
            <input type="hidden" name="id" value={row.id} />
            <div className="grid gap-2">
              <Label htmlFor={`tutor-name-${row.id}`}>Name</Label>
              <Input id={`tutor-name-${row.id}`} name="name" defaultValue={row.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`tutor-email-${row.id}`}>Email</Label>
              <Input
                id={`tutor-email-${row.id}`}
                name="email"
                type="email"
                defaultValue={row.email}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`tutor-username-${row.id}`}>Username</Label>
              <Input
                id={`tutor-username-${row.id}`}
                name="username"
                defaultValue={row.username}
                placeholder="optional"
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
