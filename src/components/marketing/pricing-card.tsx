import { Check } from "lucide-react";
import { cn } from "cn";

export function PricingCard({
  name,
  priceLabel,
  priceSuffix,
  features,
  featured,
  children,
}: {
  name: string;
  priceLabel: string;
  priceSuffix?: string;
  features: string[];
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
        featured ? "border-brand-teal ring-2 ring-brand-teal/40" : "border-border",
      )}
    >
      {featured && (
        <span className="mb-3 w-fit rounded-full bg-brand-teal px-3 py-1 text-xs font-semibold text-brand-teal-foreground">
          Most popular
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-brand-navy">{name}</h3>
      <p className="mt-2 font-display text-3xl font-bold text-brand-navy">
        {priceLabel}
        {priceSuffix && <span className="text-sm font-normal text-muted-foreground"> {priceSuffix}</span>}
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-teal" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{children}</div>
    </div>
  );
}
