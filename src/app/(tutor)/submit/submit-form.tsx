"use client";

import { useActionState, useMemo, useState } from "react";
import { submitClassAction } from "@/lib/actions/tutor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientOption = {
  clientId: string;
  label: string;
  tutorRate: string;
  defaultFullCost: string;
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Default full cost = client hourly rate × duration, e.g. 80/h × 90min = "120". */
function defaultCost(hourlyRate: string, durationMinutes: string): string {
  const rate = parseFloat(hourlyRate);
  const mins = parseInt(durationMinutes, 10);
  if (!Number.isFinite(rate) || !Number.isFinite(mins) || mins <= 0) return "";
  return String(Math.round((rate * mins * 100) / 60) / 100);
}

export function SubmitClassForm({ options }: { options: ClientOption[] }) {
  const [state, formAction, pending] = useActionState(submitClassAction, undefined);
  const [clientId, setClientId] = useState(options.length === 1 ? options[0].clientId : "");
  const [duration, setDuration] = useState("60");
  const [fullCost, setFullCost] = useState(
    options.length === 1 ? defaultCost(options[0].defaultFullCost, "60") : "",
  );
  // Once the tutor edits the cost by hand, stop auto-filling it.
  const [costTouched, setCostTouched] = useState(false);

  const selected = useMemo(() => options.find((o) => o.clientId === clientId), [options, clientId]);

  const earningsPreview = useMemo(() => {
    if (!selected) return null;
    const mins = parseInt(duration, 10);
    if (!Number.isFinite(mins) || mins <= 0) return null;
    const cents = Math.round((parseFloat(selected.tutorRate) * mins * 100) / 60);
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }, [selected, duration]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Client</Label>
        <Select
          name="clientId"
          items={options.map((o) => ({ value: o.clientId, label: o.label }))}
          value={clientId}
          onValueChange={(v) => {
            if (!v) return;
            setClientId(v);
            const opt = options.find((o) => o.clientId === v);
            setCostTouched(false);
            if (opt?.defaultFullCost) setFullCost(defaultCost(opt.defaultFullCost, duration));
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Pick a client" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.clientId} value={o.clientId}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="studentName">Student name</Label>
        <Input id="studentName" name="studentName" placeholder="e.g. Emma Smith" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={todayISO()} required />
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
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              if (!costTouched && selected?.defaultFullCost) {
                setFullCost(defaultCost(selected.defaultFullCost, e.target.value));
              }
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullCost">Full cost ($ total)</Label>
          <Input
            id="fullCost"
            name="fullCost"
            inputMode="decimal"
            placeholder="e.g. 60"
            value={fullCost}
            onChange={(e) => {
              setCostTouched(true);
              setFullCost(e.target.value);
            }}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Your rate</Label>
          <Input value={selected ? `$${selected.tutorRate}/h` : "—"} readOnly disabled />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      {earningsPreview && (
        <p className="text-sm text-muted-foreground">
          You&apos;ll earn <span className="font-semibold">{earningsPreview}</span> for this class.
        </p>
      )}
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending || !clientId}>
        {pending ? "Submitting…" : "Submit class"}
      </Button>
    </form>
  );
}
