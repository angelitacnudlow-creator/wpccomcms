import { createClient } from "@/lib/supabase/server";

export async function getSiteSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name, tagline, logo_media_id, favicon_media_id, primary_color, social_links, logo:logo_media_id(url), favicon:favicon_media_id(url)")
    .eq("id", 1)
    .single();

  return {
    siteName: data?.site_name ?? "My Site",
    tagline: data?.tagline ?? null,
    logoUrl: (data?.logo as unknown as { url: string } | null)?.url ?? null,
    faviconUrl: (data?.favicon as unknown as { url: string } | null)?.url ?? null,
    primaryColor: data?.primary_color ?? "#111111",
    socialLinks: (data?.social_links as Record<string, string> | null) ?? {},
  };
}
