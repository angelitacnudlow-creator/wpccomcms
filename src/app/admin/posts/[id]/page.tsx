import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEditorContext } from "@/lib/admin/editor-context";
import type { Block } from "@/lib/blocks/types";
import { PostForm } from "../post-form";
import { updatePost } from "../actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: post }, { role, mediaOptions, termOptions }, { data: postTerms }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, slug, excerpt, content, status, seo_title, seo_description, seo_og_image_id")
        .eq("id", id)
        .single(),
      getEditorContext(),
      supabase.from("post_terms").select("term_id").eq("post_id", id),
    ]);

  if (!post) notFound();

  const boundUpdate = updatePost.bind(null, post.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit post</h1>
      <PostForm
        action={boundUpdate}
        submitLabel="Save changes"
        role={role}
        mediaOptions={mediaOptions}
        termOptions={termOptions}
        selectedTermIds={postTerms?.map((t) => t.term_id) ?? []}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: (post.content as Block[]) ?? [],
          status: post.status,
          seoTitle: post.seo_title,
          seoDescription: post.seo_description,
          seoOgImageId: post.seo_og_image_id,
        }}
      />
    </div>
  );
}
