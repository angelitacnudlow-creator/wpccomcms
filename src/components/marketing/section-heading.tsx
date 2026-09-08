import { cn } from "cn";

export function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  /** A trailing accent word rendered in brand teal, e.g. title="Domain Name" accent="Registration" */
  accent?: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-2xl",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <p className="font-display text-sm font-semibold tracking-wide text-brand-teal uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-display text-3xl font-bold text-brand-navy sm:text-4xl">
        {title} {accent && <span className="text-brand-teal">{accent}</span>}
      </h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
