import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/lib/blocks/render";
import { CommentsSection } from "@/lib/comments/comments-section";
import { Badge } from "@/components/ui/badge";
import { getPublishedPostBySlug } from "@/lib/content/get-post";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || undefined;
  const ogImage = (post.seo_og_image as unknown as { url: string } | null)?.url;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/blog/${slug}`) },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: ogImage ? "summary_large_image" : "summary" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const terms =
    (post.post_terms as unknown as {
      terms: { name: string; slug: string; taxonomies: { key: string } | null } | null;
    }[]) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description || post.excerpt || undefined,
    datePublished: post.published_at ?? undefined,
    image: (post.seo_og_image as unknown as { url: string } | null)?.url ?? undefined,
    mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
  };

  return (
    <article className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-3xl font-semibold">{post.title}</h1>
      {post.published_at && (
        <p className="mt-2 text-sm text-muted-foreground">
          {new Date(post.published_at).toLocaleDateString()}
        </p>
      )}
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
      <div className="mt-8">
        <RenderBlocks blocks={post.content} />
      </div>
      <CommentsSection postId={post.id} postSlug={slug} />
    </article>
  );
}
