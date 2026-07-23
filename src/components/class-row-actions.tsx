"use client";

import { useState } from "react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { MoreHorizontal } from "lucide-react";
import {
  setClassVoidedAction,
  updateClassAction,
  deleteClassAction,
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

export type EditableClassRow = {
  id: string;
  studentName: string;
  /** YYYY-MM-DD */
  dateISO: string;
  durationMinutes: number;
  fullCost: string;
  tutorRate: string;
  notes: string;
  voided: boolean;
};

export function ClassRowActions({ row }: { row: EditableClassRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const edit = useActionFeedback((fd) => updateClassAction(undefined, fd), {
    success: "Class updated",
    onSuccess: () => setEditOpen(false),
  });
  const toggleVoid = useActionFeedback((fd) => setClassVoidedAction(fd), {
    success: row.voided ? "Class restored" : "Class voided",
  });
  const remove = useActionFeedback((fd) => deleteClassAction(fd), {
    success: "Class deleted",
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Class actions">
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
              fd.set("voided", String(!row.voided));
              toggleVoid.formAction(fd);
            }}
          >
            {row.voided ? "Restore" : "Void"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (!window.confirm("Permanently delete this class? Prefer Void to keep the record.")) return;
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
            <DialogTitle>Edit class</DialogTitle>
            <DialogDescription>
              Changing the duration or rate recomputes the tutor&apos;s earnings.
            </DialogDescription>
          </DialogHeader>
          <form action={edit.formAction} className="grid gap-4">
            <input type="hidden" name="id" value={row.id} />
            <div className="grid gap-2">
              <Label htmlFor={`student-${row.id}`}>Student name</Label>
              <Input id={`student-${row.id}`} name="studentName" defaultValue={row.studentName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`date-${row.id}`}>Date</Label>
                <Input id={`date-${row.id}`} name="date" type="date" defaultValue={row.dateISO} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`duration-${row.id}`}>Duration (minutes)</Label>
                <Input
                  id={`duration-${row.id}`}
                  name="durationMinutes"
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  defaultValue={row.durationMinutes}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`cost-${row.id}`}>Full cost ($ total)</Label>
                <Input id={`cost-${row.id}`} name="fullCost" inputMode="decimal" defaultValue={row.fullCost} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`rate-${row.id}`}>Tutor rate ($/h)</Label>
                <Input id={`rate-${row.id}`} name="tutorRate" inputMode="decimal" defaultValue={row.tutorRate} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`notes-${row.id}`}>Notes</Label>
              <Textarea id={`notes-${row.id}`} name="notes" rows={2} defaultValue={row.notes} />
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
