"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activateSubscription, cancelSubscription } from "./actions";

function defaultPeriodEnd(billingCycle: string | null, termYears: number | null) {
  const d = new Date();
  if (termYears) d.setFullYear(d.getFullYear() + termYears);
  else if (billingCycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function SubscriptionRowActions({
  id,
  status,
  billingCycle,
  termYears,
}: {
  id: string;
  status: string;
  billingCycle: string | null;
  termYears: number | null;
}) {
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd(billingCycle, termYears));
  const [isPending, startTransition] = useTransition();

  if (status === "cancelled" || status === "active") {
    return status === "active" ? (
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Cancel this subscription?")) return;
          startTransition(async () => {
            try {
              await cancelSubscription(id);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to cancel");
            }
          });
        }}
      >
        Cancel
      </Button>
    ) : null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Input
        type="date"
        value={periodEnd}
        onChange={(e) => setPeriodEnd(e.target.value)}
        className="w-36"
        aria-label="Active until"
      />
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await activateSubscription(id, periodEnd);
              toast.success("Marked active");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to activate");
            }
          })
        }
      >
        Mark active
      </Button>
    </div>
  );
}
