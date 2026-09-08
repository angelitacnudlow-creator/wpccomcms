"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CREATOR_ROLES = ["admin", "editor", "author", "contributor"];
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024;

export type MediaFormState = { error?: string };

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
  return { supabase, user };
}

export async function uploadMedia(
  _prevState: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  const { supabase, user } = await requireCreator();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only PNG, JPEG, WebP, GIF, or SVG images are allowed" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "File is larger than 10MB" };
  }

  const altText = String(formData.get("altText") ?? "").trim();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  // Storage writes go through the service-role client rather than
  // storage.objects RLS policies — the role check above is the actual
  // authorization boundary, kept in one place instead of duplicated in SQL.
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from("media").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("media").getPublicUrl(path);

  const { error: insertError } = await supabase.from("media").insert({
    storage_path: path,
    url: publicUrl,
    alt_text: altText || null,
    mime_type: file.type,
    uploaded_by: user.id,
  });

  if (insertError) {
    await admin.storage.from("media").remove([path]);
    return { error: insertError.message };
  }

  revalidatePath("/admin/media");
  return {};
}

export async function deleteMedia(mediaId: string) {
  const { supabase } = await requireCreator();

  const { data: existing } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();
  if (!existing) throw new Error("Not found");

  const { error } = await supabase
    .from("media")
    .delete()
    .eq("id", mediaId)
    .select("id")
    .single();
  if (error) throw new Error(error.code === "PGRST116" ? "Forbidden" : error.message);

  const admin = createAdminClient();
  await admin.storage.from("media").remove([existing.storage_path]);

  revalidatePath("/admin/media");
}
