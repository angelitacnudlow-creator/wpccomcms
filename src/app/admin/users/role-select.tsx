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
import { updateUserRole } from "./actions";

const ROLES = ["admin", "editor", "author", "contributor", "customer"];

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={role}
      disabled={isPending}
      items={ROLES.map((r) => ({ value: r, label: r }))}
      onValueChange={(value) =>
        startTransition(async () => {
          if (!value) return;
          try {
            await updateUserRole(userId, value);
            toast.success("Role updated");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update role");
          }
        })
      }
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
