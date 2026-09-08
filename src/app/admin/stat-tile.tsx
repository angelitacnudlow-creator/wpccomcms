import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  deltaPct,
  icon: Icon,
}: {
  label: string;
  value: string;
  deltaPct?: number | null;
  icon: LucideIcon;
}) {
  const hasDelta = typeof deltaPct === "number";
  const up = hasDelta && deltaPct >= 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {hasDelta && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              up ? "text-[#006300]" : "text-destructive",
            )}
          >
            {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>
      {hasDelta && <p className="mt-1 text-xs text-muted-foreground">vs. previous 30 days</p>}
    </div>
  );
}
