import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getPublishedPageBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select(
      "id, title, content, status, seo_title, seo_description, seo_og_image:seo_og_image_id(url)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
});
