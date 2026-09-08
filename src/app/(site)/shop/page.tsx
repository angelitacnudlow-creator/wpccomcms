import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop",
  alternates: { canonical: absoluteUrl("/shop") },
};

export default async function ShopIndexPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, base_price_bdt, featured_image:featured_image_id(url)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl flex-1 px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold">Shop</h1>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {products?.map((product) => {
          const image = product.featured_image as unknown as { url: string } | null;
          return (
            <Link key={product.id} href={`/shop/${product.slug}`} className="group">
              <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                {image?.url && (
                  <Image
                    src={image.url}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-2 text-sm font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{formatBdt(product.base_price_bdt)}</p>
            </Link>
          );
        })}
        {products?.length === 0 && (
          <p className="col-span-full text-muted-foreground">No products yet.</p>
        )}
      </div>
    </div>
  );
}
