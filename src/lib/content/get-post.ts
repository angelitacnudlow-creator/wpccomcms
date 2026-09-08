import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Wrapped in React's cache() so generateMetadata and the page body share one
// query per request instead of hitting Supabase twice for the same post.
export const getPublishedPostBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, excerpt, content, published_at, status, seo_title, seo_description, seo_og_image:seo_og_image_id(url), post_terms(terms(name, slug, taxonomies(key)))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
});
