import { createClient } from "@/lib/supabase/server";

export async function getMenuItems(key: "header" | "footer") {
  const supabase = await createClient();
  const { data: menu } = await supabase.from("menus").select("id").eq("key", key).single();
  if (!menu) return [];
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, label, url")
    .eq("menu_id", menu.id)
    .order("sort_order");
  return items ?? [];
}
