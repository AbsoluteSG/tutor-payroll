"use client";

import { useMemo, useState } from "react";
import { createScheduledClassAction } from "@/lib/actions/schedule-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TutorOption = {
  id: string;
  name: string;
  clients: { id: string; label: string }[];
};

export function ScheduleForm({ tutors }: { tutors: TutorOption[] }) {
  const { formAction, error, pending } = useActionFeedback(
    (fd) => createScheduledClassAction(undefined, fd),
    { success: "Class scheduled" },
  );
  const [tutorId, setTutorId] = useState("");
  const [clientId, setClientId] = useState("");

  const clients = useMemo(
    () => tutors.find((t) => t.id === tutorId)?.clients ?? [],
    [tutors, tutorId],
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Tutor</Label>
          <Select
            name="tutorId"
            items={tutors.map((t) => ({ value: t.id, label: t.name }))}
            value={tutorId}
            onValueChange={(v) => {
              if (!v) return;
              setTutorId(v);
              setClientId("");
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a tutor" />
            </SelectTrigger>
            <SelectContent>
              {tutors.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Client</Label>
          <Select
            name="clientId"
            items={clients.map((c) => ({ value: c.id, label: c.label }))}
            value={clientId}
            onValueChange={(v) => v && setClientId(v)}
            disabled={!tutorId}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={tutorId ? "Pick a client" : "Pick a tutor first"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="studentName">Student name</Label>
        <Input id="studentName" name="studentName" placeholder="e.g. Emma Smith" required />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          {/* Says the zone out loud. The value is a bare wall clock, and the
              action reads it as Brooklyn time — a manager travelling, or a
              host in another region, would otherwise have no way to know
              which clock this box means. */}
          <Label htmlFor="scheduledAt">Date &amp; time (ET)</Label>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={5}
            max={600}
            step={5}
            defaultValue={60}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" placeholder="Anything the tutor should know" />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending || !clientId}>
        {pending && <Spinner />}
        {pending ? "Scheduling…" : "Schedule class"}
      </Button>
    </form>
  );
}
