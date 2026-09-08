"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteMedia } from "./actions";

export function DeleteMediaButton({ mediaId }: { mediaId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this file? This cannot be undone.")) return;
        startTransition(async () => {
          try {
            await deleteMedia(mediaId);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete file");
          }
        });
      }}
    >
      Delete
    </Button>
  );
}
