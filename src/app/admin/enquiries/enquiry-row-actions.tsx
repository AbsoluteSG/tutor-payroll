"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  convertEnquiryToClientAction,
  saveEnquiryNotesAction,
  setEnquiryStatusAction,
} from "@/lib/actions/enquiry-actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EnquiryRowActions({
  id,
  status,
  staffNotes,
}: {
  id: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  staffNotes: string;
}) {
  const [notesOpen, setNotesOpen] = useState(false);

  const move = useActionFeedback((fd) => setEnquiryStatusAction(fd), {
    success: "Enquiry updated",
  });
  const notes = useActionFeedback((fd) => saveEnquiryNotesAction(undefined, fd), {
    success: "Notes saved",
    onSuccess: () => setNotesOpen(false),
  });
  // No success toast: this one redirects to the new client's page, so the
  // confirmation is the navigation itself.
  const convert = useActionFeedback((fd) => convertEnquiryToClientAction(fd));

  const submitStatus = (next: string) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next);
    move.formAction(fd);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "NEW" && (
          <Button size="sm" variant="outline" onClick={() => submitStatus("CONTACTED")}>
            Mark called
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Enquiry actions">
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setNotesOpen((v) => !v)}>
              {notesOpen ? "Hide notes" : "Add notes"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const fd = new FormData();
                fd.set("id", id);
                convert.formAction(fd);
              }}
            >
              Convert to client
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status !== "CONTACTED" && (
              <DropdownMenuItem onClick={() => submitStatus("CONTACTED")}>
                Mark called
              </DropdownMenuItem>
            )}
            {status !== "CLOSED" && (
              <DropdownMenuItem onClick={() => submitStatus("CLOSED")}>
                Close
              </DropdownMenuItem>
            )}
            {status !== "NEW" && (
              <DropdownMenuItem onClick={() => submitStatus("NEW")}>
                Reopen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {notesOpen && (
        <form action={notes.formAction} className="mt-3 grid gap-2">
          <input type="hidden" name="id" value={id} />
          <textarea
            name="staffNotes"
            defaultValue={staffNotes}
            rows={3}
            maxLength={2000}
            placeholder="What happened on the call?"
            aria-label="Staff notes"
            className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-ring"
          />
          {notes.error && <p className="text-sm text-red-400">{notes.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setNotesOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={notes.pending}>
              {notes.pending && <Spinner />}
              {notes.pending ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
