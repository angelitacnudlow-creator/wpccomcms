import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

export function SupportCtaBand({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-3xl bg-brand-navy px-8 py-12 text-center text-brand-navy-foreground sm:px-16">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-brand-navy-foreground/70">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className={cn(buttonVariants(), "bg-brand-teal text-brand-teal-foreground hover:bg-brand-teal/90")}
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-brand-navy-foreground/30 text-brand-navy-foreground hover:bg-white/10",
            )}
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
