"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export type TermFormState = { error?: string };

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

async function taxonomyId(supabase: Awaited<ReturnType<typeof createClient>>, key: string) {
  const { data } = await supabase.from("taxonomies").select("id").eq("key", key).single();
  if (!data) throw new Error(`Unknown taxonomy "${key}"`);
  return data.id;
}

export async function createTerm(
  taxonomyKey: "category" | "tag",
  _prevState: TermFormState,
  formData: FormData,
): Promise<TermFormState> {
  const { supabase } = await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const taxId = await taxonomyId(supabase, taxonomyKey);
  const { error } = await supabase
    .from("terms")
    .insert({ taxonomy_id: taxId, name, slug: slugify(name) });

  if (error) {
    if (error.code === "23505") return { error: "That term already exists" };
    return { error: error.message };
  }

  revalidatePath("/admin/taxonomies");
  return {};
}

export async function deleteTerm(termId: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("terms").delete().eq("id", termId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/taxonomies");
}
