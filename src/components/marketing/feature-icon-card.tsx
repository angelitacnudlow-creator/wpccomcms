import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export function FeatureIconCard({
  icon: Icon,
  index,
  title,
  description,
  tone = "teal",
  className,
}: {
  icon: LucideIcon;
  index?: number;
  title: string;
  description: string;
  tone?: "teal" | "navy";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-6",
        tone === "teal" ? "bg-brand-teal text-brand-teal-foreground" : "bg-brand-navy text-brand-navy-foreground",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            tone === "teal" ? "bg-white/25" : "bg-white/10",
          )}
        >
          <Icon className="size-5" />
        </span>
        {index != null && (
          <span
            className={cn(
              "font-display text-3xl font-bold",
              tone === "teal" ? "text-brand-teal-foreground/30" : "text-brand-navy-foreground/25",
            )}
          >
            {String(index).padStart(2, "0")}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className={cn("mt-2 text-sm", tone === "teal" ? "text-brand-teal-foreground/85" : "text-brand-navy-foreground/70")}>
        {description}
      </p>
    </div>
  );
}
