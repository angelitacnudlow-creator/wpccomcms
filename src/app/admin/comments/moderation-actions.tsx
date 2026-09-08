"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateComment, deleteComment } from "@/lib/comments/actions";

export function ModerationActions({ commentId, status }: { commentId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => moderateComment(commentId, "approved"))}
        >
          Approve
        </Button>
      )}
      {status !== "spam" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => moderateComment(commentId, "spam"))}
        >
          Mark spam
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Delete this comment permanently?")) return;
          run(() => deleteComment(commentId));
        }}
      >
        Delete
      </Button>
    </div>
  );
}
