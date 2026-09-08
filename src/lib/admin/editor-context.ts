import { createClient } from "@/lib/supabase/server";
import type { TermOption } from "@/app/admin/posts/post-form";

export async function getEditorContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: media }, { data: terms }] = await Promise.all([
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("media")
      .select("id, url, alt_text")
      .order("created_at", { ascending: false }),
    supabase.from("terms").select("id, name, taxonomies(key)").order("name"),
  ]);

  const termOptions: TermOption[] = (terms ?? [])
    .map((t) => ({
      id: t.id as string,
      name: t.name as string,
      taxonomyKey: (t.taxonomies as unknown as { key: string } | null)?.key as
        | "category"
        | "tag"
        | undefined,
    }))
    .filter((t): t is TermOption => t.taxonomyKey === "category" || t.taxonomyKey === "tag");

  return { role: profile?.role ?? "customer", mediaOptions: media ?? [], termOptions };
}
