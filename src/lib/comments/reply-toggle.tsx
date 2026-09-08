"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";

export function ReplyToggle({
  postId,
  postSlug,
  parentId,
  isLoggedIn,
}: {
  postId: string;
  postSlug: string;
  parentId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Reply
      </Button>
    );
  }

  return (
    <div className="mt-2">
      <CommentForm
        postId={postId}
        postSlug={postSlug}
        parentId={parentId}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
