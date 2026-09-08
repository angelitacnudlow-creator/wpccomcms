import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/lib/blocks/render";
import { getPublishedPageBySlug } from "@/lib/content/get-page";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return {};

  const title = page.seo_title || page.title;
  const description = page.seo_description || undefined;
  const ogImage = (page.seo_og_image as unknown as { url: string } | null)?.url;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/${slug}`) },
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: ogImage ? "summary_large_image" : "summary" },
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold">{page.title}</h1>
      <div className="mt-8">
        <RenderBlocks blocks={page.content} />
      </div>
    </article>
  );
}
