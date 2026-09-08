"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePost } from "./actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this post? This cannot be undone.")) return;
        startTransition(async () => {
          try {
            await deletePost(postId);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete post");
          }
        });
      }}
    >
      Delete
    </Button>
  );
}
