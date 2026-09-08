import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEditorContext } from "@/lib/admin/editor-context";
import type { Block } from "@/lib/blocks/types";
import { PageForm } from "../page-form";
import { updatePage } from "../actions";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: page }, { role, mediaOptions }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, title, slug, content, status, seo_title, seo_description, seo_og_image_id")
      .eq("id", id)
      .single(),
    getEditorContext(),
  ]);

  if (!page) notFound();

  const boundUpdate = updatePage.bind(null, page.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit page</h1>
      <PageForm
        action={boundUpdate}
        submitLabel="Save changes"
        role={role}
        mediaOptions={mediaOptions}
        defaultValues={{
          title: page.title,
          slug: page.slug,
          content: (page.content as Block[]) ?? [],
          status: page.status,
          seoTitle: page.seo_title,
          seoDescription: page.seo_description,
          seoOgImageId: page.seo_og_image_id,
        }}
      />
    </div>
  );
}
