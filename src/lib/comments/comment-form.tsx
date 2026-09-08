"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitComment, type CommentFormState } from "./actions";

const initialState: CommentFormState = {};

export function CommentForm({
  postId,
  postSlug,
  parentId,
  isLoggedIn,
}: {
  postId: string;
  postSlug: string;
  parentId: string | null;
  isLoggedIn: boolean;
}) {
  const boundAction = submitComment.bind(null, postId, postSlug, parentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href={`/login?next=/blog/${postSlug}`} className="underline">
          Log in
        </Link>{" "}
        to leave a comment.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <Textarea name="body" rows={3} placeholder="Write a comment…" required />
      {state.fieldErrors?.body && (
        <p className="text-sm text-destructive">{state.fieldErrors.body[0]}</p>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Posting…" : "Post comment"}
      </Button>
    </form>
  );
}
