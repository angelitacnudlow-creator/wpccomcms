"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { renewSubscription } from "@/lib/checkout/renew-actions";

export function RenewButton({ subscriptionId }: { subscriptionId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            const { orderId } = await renewSubscription(subscriptionId);
            router.push(`/checkout/success?order=${orderId}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to renew");
          }
        })
      }
    >
      {isPending ? "Renewing…" : "Renew"}
    </Button>
  );
}
