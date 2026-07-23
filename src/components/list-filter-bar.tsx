"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

/** Search input + any number of select-based filters, laid out in a row. */
export function ListFilterBar({
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  filters: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  }[];
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-52 flex-1 gap-1">
        <span className="text-xs text-muted-foreground">Search</span>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {filters.map((f) => (
        <div key={f.label} className="grid w-40 gap-1">
          <span className="text-xs text-muted-foreground">{f.label}</span>
          <Select items={f.options} value={f.value} onValueChange={(v) => v && f.onChange(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
