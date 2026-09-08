import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;
  const supabase = await createClient();

  let postIdFilter: string[] | null = null;
  const activeFilter = category
    ? { taxonomy: "category" as const, slug: category }
    : tag
      ? { taxonomy: "tag" as const, slug: tag }
      : null;

  if (activeFilter) {
    const { data: term } = await supabase
      .from("terms")
      .select("id, taxonomies!inner(key)")
      .eq("slug", activeFilter.slug)
      .eq("taxonomies.key", activeFilter.taxonomy)
      .single();

    if (term) {
      const { data: links } = await supabase
        .from("post_terms")
        .select("post_id")
        .eq("term_id", term.id);
      postIdFilter = links?.map((l) => l.post_id) ?? [];
    } else {
      postIdFilter = [];
    }
  }

  let query = supabase
    .from("posts")
    .select("id, title, slug, excerpt, published_at, post_terms(terms(name, slug, taxonomies(key)))")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (postIdFilter) query = query.in("id", postIdFilter);

  const { data: posts } = await query;

  return (
    <div className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Blog</h1>
        {activeFilter && (
          <Link href="/blog" className="text-sm text-muted-foreground hover:underline">
            Clear filter
          </Link>
        )}
      </div>
      <div className="space-y-8">
        {posts?.map((post) => {
          const terms = (post.post_terms as unknown as {
            terms: { name: string; slug: string; taxonomies: { key: string } | null } | null;
          }[]) ?? [];

          return (
            <article key={post.id}>
              <h2 className="text-xl font-semibold">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              {post.published_at && (
                <p className="text-sm text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString()}
                </p>
              )}
              {post.excerpt && <p className="mt-2 text-muted-foreground">{post.excerpt}</p>}
              {terms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {terms.map(
                    (t) =>
                      t.terms && (
                        <Link
                          key={t.terms.slug}
                          href={`/blog?${t.terms.taxonomies?.key === "tag" ? "tag" : "category"}=${t.terms.slug}`}
                        >
                          <Badge variant="secondary">{t.terms.name}</Badge>
                        </Link>
                      ),
                  )}
                </div>
              )}
            </article>
          );
        })}
        {posts?.length === 0 && (
          <p className="text-muted-foreground">Nothing published yet.</p>
        )}
      </div>
    </div>
  );
}
