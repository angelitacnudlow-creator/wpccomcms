import { createClient } from "@/lib/supabase/server";
import { TermList } from "./term-list";

export default async function AdminTaxonomiesPage() {
  const supabase = await createClient();
  const { data: terms } = await supabase
    .from("terms")
    .select("id, name, slug, taxonomies(key)")
    .order("name");

  const categories =
    terms?.filter(
      (t) => (t.taxonomies as unknown as { key: string } | null)?.key === "category",
    ) ?? [];
  const tags =
    terms?.filter((t) => (t.taxonomies as unknown as { key: string } | null)?.key === "tag") ??
    [];

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Categories & Tags</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Categories</h2>
        <TermList taxonomyKey="category" terms={categories} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Tags</h2>
        <TermList taxonomyKey="tag" terms={tags} />
      </section>
    </div>
  );
}
