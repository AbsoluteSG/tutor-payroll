"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PERIOD_OPTIONS, shiftRange, type PeriodKey, type ResolvedPeriod } from "@/lib/periods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Drives the overview's date range through the URL, so a report is always
 * shareable and bookmarkable. Stepping a range switches to an explicit custom
 * range covering the neighbouring window.
 */
export function PeriodPicker({ period }: { period: ResolvedPeriod }) {
  const router = useRouter();

  const go = (params: Record<string, string>) => {
    router.push(`/admin?${new URLSearchParams(params).toString()}`);
  };

  const step = (direction: -1 | 1) => {
    const next = shiftRange(period, direction);
    if (next) go({ period: "custom", from: next.from, to: next.to });
  };

  const setCustomBound = (bound: "from" | "to", value: string) => {
    if (!value) return;
    go({ period: "custom", from: period.fromISO, to: period.toISO, [bound]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={PERIOD_OPTIONS}
        value={period.key}
        onValueChange={(v) => {
          if (!v) return;
          const key = v as PeriodKey;
          // Seed a custom range from whatever is on screen, so the date inputs
          // start somewhere sensible instead of empty.
          go(
            key === "custom"
              ? { period: "custom", from: period.fromISO, to: period.toISO }
              : { period: key },
          );
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period.key === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From date"
            className="w-40"
            value={period.fromISO}
            onChange={(e) => setCustomBound("from", e.target.value)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="To date"
            className="w-40"
            value={period.toISO}
            onChange={(e) => setCustomBound("to", e.target.value)}
          />
        </div>
      )}

      {period.shiftable && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous period"
            onClick={() => step(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next period"
            onClick={() => step(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
