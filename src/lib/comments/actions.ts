"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CommentFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment can't be empty").max(5000),
});

export async function submitComment(
  postId: string,
  postSlug: string,
  parentId: string | null,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to comment." };

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    parent_id: parentId,
    user_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath(`/blog/${postSlug}`);
  return {};
}

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    throw new Error("Forbidden");
  }
  return { supabase };
}

export async function moderateComment(commentId: string, status: "approved" | "spam") {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("comments").update({ status }).eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/comments");
  revalidatePath("/blog", "layout");
}

export async function deleteComment(commentId: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/comments");
  revalidatePath("/blog", "layout");
}
