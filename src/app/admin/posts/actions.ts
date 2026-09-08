"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postSchema } from "@/lib/validations/content";

const CREATOR_ROLES = ["admin", "editor", "author", "contributor"];

async function syncPostTerms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  formData: FormData,
) {
  const termIds = formData.getAll("termIds").map(String).filter(Boolean);
  await supabase.from("post_terms").delete().eq("post_id", postId);
  if (termIds.length > 0) {
    await supabase
      .from("post_terms")
      .insert(termIds.map((termId) => ({ post_id: postId, term_id: termId })));
  }
}

export type PostFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireCreator() {
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
  if (!profile || !CREATOR_ROLES.includes(profile.role)) {
    throw new Error("Forbidden");
  }
  return { supabase, user, role: profile.role };
}

export async function createPost(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { supabase, user } = await requireCreator();

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    seoOgImageId: formData.get("seoOgImageId") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data: created, error } = await supabase
    .from("posts")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content,
      status: parsed.data.status,
      author_id: user.id,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
      seo_og_image_id: parsed.data.seoOgImageId || null,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      return { fieldErrors: { slug: ["That slug is already taken"] } };
    }
    return { error: error?.message ?? "Failed to create post" };
  }

  await syncPostTerms(supabase, created.id, formData);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}

export async function updatePost(
  postId: string,
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { supabase } = await requireCreator();

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    seoOgImageId: formData.get("seoOgImageId") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Fetch current row first so we only stamp published_at on the
  // draft -> published transition, not on every save while published.
  const { data: existing } = await supabase
    .from("posts")
    .select("status, published_at, slug")
    .eq("id", postId)
    .single();

  const nowPublishing = parsed.data.status === "published" && existing?.status !== "published";

  const { error } = await supabase
    .from("posts")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content,
      status: parsed.data.status,
      published_at: nowPublishing ? new Date().toISOString() : existing?.published_at,
      updated_at: new Date().toISOString(),
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
      seo_og_image_id: parsed.data.seoOgImageId || null,
    })
    .eq("id", postId)
    // RLS silently filters rows an UPDATE isn't allowed to touch rather than
    // erroring, so without .select().single() a blocked update would look
    // like a no-op success. This makes the "0 rows" case throw instead.
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["That slug is already taken"] } };
    }
    if (error.code === "PGRST116") {
      return { error: "You don't have permission to edit this post." };
    }
    return { error: error.message };
  }

  await syncPostTerms(supabase, postId, formData);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
  if (parsed.data.slug !== existing?.slug) revalidatePath(`/blog/${parsed.data.slug}`);
  redirect("/admin/posts");
}

export async function deletePost(postId: string) {
  const { supabase } = await requireCreator();

  const { data: existing } = await supabase
    .from("posts")
    .select("slug, author_id")
    .eq("id", postId)
    .single();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .select("id")
    .single();
  if (error) throw new Error(error.code === "PGRST116" ? "Forbidden" : error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
}
