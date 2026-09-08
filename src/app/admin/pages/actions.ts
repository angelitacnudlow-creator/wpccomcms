"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pageSchema } from "@/lib/validations/content";
import { RESERVED_SLUGS } from "@/lib/validations/reserved-slugs";

export type PageFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

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
  return { supabase, user, role: profile.role };
}

function validate(formData: FormData) {
  const parsed = pageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    content: formData.get("content"),
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    seoOgImageId: formData.get("seoOgImageId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (RESERVED_SLUGS.includes(parsed.data.slug)) {
    return {
      ok: false as const,
      fieldErrors: { slug: [`"${parsed.data.slug}" is a reserved route and can't be used`] },
    };
  }
  return { ok: true as const, data: parsed.data };
}

export async function createPage(
  _prevState: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const { supabase } = await requireStaff();

  const result = validate(formData);
  if (!result.ok) return { fieldErrors: result.fieldErrors };

  const { error } = await supabase.from("pages").insert({
    title: result.data.title,
    slug: result.data.slug,
    content: result.data.content,
    status: result.data.status,
    published_at: result.data.status === "published" ? new Date().toISOString() : null,
    seo_title: result.data.seoTitle || null,
    seo_description: result.data.seoDescription || null,
    seo_og_image_id: result.data.seoOgImageId || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["That slug is already taken"] } };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export async function updatePage(
  pageId: string,
  _prevState: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const { supabase } = await requireStaff();

  const result = validate(formData);
  if (!result.ok) return { fieldErrors: result.fieldErrors };

  const { data: existing } = await supabase
    .from("pages")
    .select("status, published_at, slug")
    .eq("id", pageId)
    .single();

  const nowPublishing = result.data.status === "published" && existing?.status !== "published";

  const { error } = await supabase
    .from("pages")
    .update({
      title: result.data.title,
      slug: result.data.slug,
      content: result.data.content,
      status: result.data.status,
      published_at: nowPublishing ? new Date().toISOString() : existing?.published_at,
      updated_at: new Date().toISOString(),
      seo_title: result.data.seoTitle || null,
      seo_description: result.data.seoDescription || null,
      seo_og_image_id: result.data.seoOgImageId || null,
    })
    .eq("id", pageId)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["That slug is already taken"] } };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/pages");
  if (existing?.slug) revalidatePath(`/${existing.slug}`);
  if (result.data.slug !== existing?.slug) revalidatePath(`/${result.data.slug}`);
  redirect("/admin/pages");
}

export async function deletePage(pageId: string) {
  const { supabase } = await requireStaff();

  const { data: existing } = await supabase
    .from("pages")
    .select("slug")
    .eq("id", pageId)
    .single();

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/pages");
  if (existing?.slug) revalidatePath(`/${existing.slug}`);
}
