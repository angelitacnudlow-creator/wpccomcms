"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState = { error?: string; ok?: boolean };

async function requireAdmin() {
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
  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  return { supabase };
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

export async function updateSiteSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { supabase } = await requireAdmin();

  const siteName = String(formData.get("siteName") ?? "").trim();
  if (!siteName) return { error: "Site name is required" };

  const tagline = String(formData.get("tagline") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#111111").trim();
  const logoMediaId = String(formData.get("logoMediaId") ?? "") || null;
  const faviconMediaId = String(formData.get("faviconMediaId") ?? "") || null;
  const twitter = String(formData.get("twitter") ?? "").trim();
  const facebook = String(formData.get("facebook") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();

  const { error } = await supabase
    .from("site_settings")
    .update({
      site_name: siteName,
      tagline: tagline || null,
      primary_color: primaryColor || null,
      logo_media_id: logoMediaId,
      favicon_media_id: faviconMediaId,
      social_links: { twitter, facebook, instagram },
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}

const redirectSchema = z.object({
  fromPath: z.string().trim().min(1).startsWith("/", "Must start with /"),
  toPath: z.string().trim().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]),
});

export type RedirectFormState = { error?: string };

export async function createRedirect(
  _prevState: RedirectFormState,
  formData: FormData,
): Promise<RedirectFormState> {
  const { supabase } = await requireStaff();

  const parsed = redirectSchema.safeParse({
    fromPath: formData.get("fromPath"),
    toPath: formData.get("toPath"),
    statusCode: Number(formData.get("statusCode") ?? 301),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid redirect" };
  }

  const { error } = await supabase.from("redirects").insert({
    from_path: parsed.data.fromPath,
    to_path: parsed.data.toPath,
    status_code: parsed.data.statusCode,
  });
  if (error) {
    if (error.code === "23505") return { error: "That path already has a redirect" };
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return {};
}

export async function deleteRedirect(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("redirects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}
