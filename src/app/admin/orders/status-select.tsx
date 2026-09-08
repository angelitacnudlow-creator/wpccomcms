"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "./actions";

const STATUSES = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];

export function StatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      items={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
      onValueChange={(value) =>
        startTransition(async () => {
          if (!value) return;
          try {
            await updateOrderStatus(orderId, value);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update status");
          }
        })
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
