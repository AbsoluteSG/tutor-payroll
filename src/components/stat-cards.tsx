import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCards({
  stats,
}: {
  stats: { label: string; value: string; accent?: "green" | "red" | "neutral" }[];
}) {
  return (
    <div className={cn("grid gap-4", stats.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
      {stats.map((s) => (
        <Card key={s.label} data-reveal>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                s.accent === "green" && "text-green-500",
                s.accent === "red" && "text-red-400",
              )}
            >
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
