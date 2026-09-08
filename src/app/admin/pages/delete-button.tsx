"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePage } from "./actions";

export function DeletePageButton({ pageId }: { pageId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this page? This cannot be undone.")) return;
        startTransition(async () => {
          try {
            await deletePage(pageId);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete page");
          }
        });
      }}
    >
      Delete
    </Button>
  );
}
