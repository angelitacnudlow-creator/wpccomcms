import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Search" };

type Result = { title: string; href: string; type: "Post" | "Page" | "Product"; extra?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  let results: Result[] = [];

  if (query) {
    const supabase = await createClient();
    const like = `%${query}%`;

    const [{ data: posts }, { data: pages }, { data: products }] = await Promise.all([
      supabase
        .from("posts")
        .select("title, slug")
        .eq("status", "published")
        .or(`title.ilike.${like},excerpt.ilike.${like}`)
        .limit(10),
      supabase
        .from("pages")
        .select("title, slug")
        .eq("status", "published")
        .ilike("title", like)
        .limit(10),
      supabase
        .from("products")
        .select("name, slug, base_price_bdt")
        .eq("status", "published")
        .ilike("name", like)
        .limit(10),
    ]);

    results = [
      ...(posts ?? []).map((p) => ({
        title: p.title,
        href: `/blog/${p.slug}`,
        type: "Post" as const,
      })),
      ...(pages ?? []).map((p) => ({
        title: p.title,
        href: `/${p.slug}`,
        type: "Page" as const,
      })),
      ...(products ?? []).map((p) => ({
        title: p.name,
        href: `/shop/${p.slug}`,
        type: "Product" as const,
        extra: formatBdt(p.base_price_bdt),
      })),
    ];
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Search</h1>
      <form className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Search posts, pages, products…" />
        <Button type="submit">Search</Button>
      </form>

      {query && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
          {results.map((r) => (
            <Link key={r.href} href={r.href} className="block rounded-md border p-3 hover:bg-muted">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.title}</span>
                <Badge variant="secondary">{r.type}</Badge>
              </div>
              {r.extra && <p className="mt-1 text-sm text-muted-foreground">{r.extra}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
