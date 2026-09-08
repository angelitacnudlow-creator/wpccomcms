import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Service-role client: sitemap generation isn't tied to a request's auth
  // cookies, and only ever needs published rows anyway.
  const supabase = createAdminClient();

  const [{ data: posts }, { data: pages }, { data: products }] = await Promise.all([
    supabase.from("posts").select("slug, updated_at").eq("status", "published"),
    supabase.from("pages").select("slug, updated_at").eq("status", "published"),
    supabase.from("products").select("slug, updated_at").eq("status", "published"),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/hosting`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/domains`, changeFrequency: "weekly", priority: 0.8 },
    ...(posts ?? []).map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(pages ?? []).map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...(products ?? []).map((p) => ({
      url: `${SITE_URL}/shop/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
