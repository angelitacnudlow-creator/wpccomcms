import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEditorContext } from "@/lib/admin/editor-context";
import type { Block } from "@/lib/blocks/types";
import { poyshaToBdt } from "@/lib/money";
import { ProductForm } from "../product-form";
import { updateProduct } from "../actions";
import type { VariantRow } from "../variants-editor";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { role, mediaOptions }, { data: variants }, { data: images }, { data: hostingSpecsRow }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, slug, description, base_price_bdt, status, featured_image_id, seo_title, seo_description, seo_og_image_id, service_type",
        )
        .eq("id", id)
        .single(),
      getEditorContext(),
      supabase
        .from("product_variants")
        .select("id, sku, name, price_bdt, stock, attributes")
        .eq("product_id", id),
      supabase.from("product_images").select("media_id").eq("product_id", id).order("sort_order"),
      supabase
        .from("hosting_plan_specs")
        .select("disk_gb, bandwidth_gb, mailboxes, databases, hosted_domains, feature_bullets")
        .eq("product_id", id)
        .maybeSingle(),
    ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);

  const variantRows: VariantRow[] = (variants ?? []).map((v) => {
    const attrs = (v.attributes as Record<string, string>) ?? {};
    return {
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: poyshaToBdt(v.price_bdt),
      stock: v.stock,
      size: attrs.size ?? "",
      color: attrs.color ?? "",
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        action={boundUpdate}
        submitLabel="Save changes"
        role={role}
        mediaOptions={mediaOptions}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          description: (product.description as Block[]) ?? [],
          basePriceBdt: product.base_price_bdt,
          status: product.status,
          featuredImageId: product.featured_image_id,
          imageIds: (images ?? []).map((i) => i.media_id),
          variants: variantRows,
          seoTitle: product.seo_title,
          seoDescription: product.seo_description,
          seoOgImageId: product.seo_og_image_id,
          serviceType: product.service_type as "physical" | "hosting",
          hostingSpecs: hostingSpecsRow
            ? {
                diskGb: hostingSpecsRow.disk_gb,
                bandwidthGb: hostingSpecsRow.bandwidth_gb,
                mailboxes: hostingSpecsRow.mailboxes,
                databases: hostingSpecsRow.databases,
                hostedDomains: hostingSpecsRow.hosted_domains,
                featureBullets: (hostingSpecsRow.feature_bullets as string[]) ?? [],
              }
            : null,
        }}
      />
    </div>
  );
}
