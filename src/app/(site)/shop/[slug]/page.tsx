import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RenderBlocks } from "@/lib/blocks/render";
import { absoluteUrl } from "@/lib/site-url";
import { poyshaToBdt } from "@/lib/money";
import { AddToCartForm } from "./add-to-cart-form";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, base_price_bdt, status, featured_image:featured_image_id(url), seo_title, seo_description, seo_og_image:seo_og_image_id(url), product_variants(id, name, price_bdt, stock), product_images(media_id, sort_order, media:media_id(url, alt_text))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
});

// Products have no separate excerpt field — fall back to the first block of
// text in the description (same idea as posts falling back to `excerpt`).
function firstBlockText(blocks: unknown): string | undefined {
  if (!Array.isArray(blocks)) return undefined;
  const withText = blocks.find(
    (b) => b && typeof b === "object" && typeof (b as { props?: { text?: string } }).props?.text === "string",
  ) as { props: { text: string } } | undefined;
  return withText?.props.text.slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const title = product.seo_title || product.name;
  const description = product.seo_description || firstBlockText(product.description);
  const ogImage =
    (product.seo_og_image as unknown as { url: string } | null)?.url ??
    (product.featured_image as unknown as { url: string } | null)?.url;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/shop/${slug}`) },
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: ogImage ? "summary_large_image" : "summary" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const featuredImage = (product.featured_image as unknown as { url: string } | null)?.url;
  const galleryImages = ((product.product_images as unknown as {
    sort_order: number;
    media: { url: string; alt_text: string | null } | null;
  }[]) ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.media)
    .filter((m): m is { url: string; alt_text: string | null } => Boolean(m));

  const variants = (
    (product.product_variants as unknown as {
      id: string;
      name: string;
      price_bdt: number;
      stock: number;
    }[]) ?? []
  ).map((v) => ({ id: v.id, name: v.name, priceBdt: v.price_bdt, stock: v.stock }));

  const ogImage =
    (product.seo_og_image as unknown as { url: string } | null)?.url ?? featuredImage;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo_description || firstBlockText(product.description),
    image: ogImage ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: poyshaToBdt(product.base_price_bdt).toFixed(2),
      availability: variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/shop/${slug}`),
    },
  };

  return (
    <div className="mx-auto max-w-5xl flex-1 px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-md border bg-muted">
            {featuredImage && (
              <Image
                src={featuredImage}
                alt={product.name}
                width={600}
                height={600}
                className="h-full w-full object-cover"
                priority
              />
            )}
          </div>
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {galleryImages.map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md border bg-muted">
                  <Image
                    src={img.url}
                    alt={img.alt_text ?? ""}
                    width={150}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="mt-4">
            <AddToCartForm variants={variants} isLoggedIn={Boolean(user)} productSlug={slug} />
          </div>
          <div className="mt-8">
            <RenderBlocks blocks={product.description} />
          </div>
        </div>
      </div>
    </div>
  );
}
