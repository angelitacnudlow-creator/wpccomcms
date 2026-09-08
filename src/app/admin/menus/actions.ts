"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MenuFormState = { error?: string; ok?: boolean };

const itemsSchema = z.array(
  z.object({ label: z.string().trim().min(1), url: z.string().trim().min(1) }),
);

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

export async function saveMenu(
  menuKey: "header" | "footer",
  _prevState: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const { supabase } = await requireStaff();

  let items: { label: string; url: string }[];
  try {
    items = itemsSchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { error: "Invalid menu data" };
  }

  const { data: menu } = await supabase.from("menus").select("id").eq("key", menuKey).single();
  if (!menu) return { error: `Unknown menu "${menuKey}"` };

  await supabase.from("menu_items").delete().eq("menu_id", menu.id);
  if (items.length > 0) {
    const { error } = await supabase.from("menu_items").insert(
      items.map((item, i) => ({
        menu_id: menu.id,
        label: item.label,
        url: item.url,
        sort_order: i,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
  return { ok: true };
}
