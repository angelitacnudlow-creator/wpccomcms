"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productSchema, type variantSchema } from "@/lib/validations/product";
import { bdtToPoysha } from "@/lib/money";
import type { z } from "zod";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

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

function parse(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    basePriceBdt: bdtToPoysha(Number(formData.get("basePrice") ?? 0)),
    status: formData.get("status"),
    featuredImageId: formData.get("featuredImageId") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    seoOgImageId: formData.get("seoOgImageId") || undefined,
    serviceType: formData.get("serviceType") || "physical",
    hostingSpecs: formData.get("hostingSpecs") || undefined,
    variants: formData.get("variants"),
    imageIds: formData.get("imageIds"),
  });
}

async function syncHostingSpecs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  serviceType: "physical" | "hosting",
  specs: {
    diskGb: number | null;
    bandwidthGb: number | null;
    mailboxes: number | null;
    databases: number | null;
    hostedDomains: number | null;
    featureBullets: string[];
  } | undefined,
) {
  if (serviceType !== "hosting" || !specs) {
    await supabase.from("hosting_plan_specs").delete().eq("product_id", productId);
    return;
  }
  await supabase.from("hosting_plan_specs").upsert({
    product_id: productId,
    disk_gb: specs.diskGb,
    bandwidth_gb: specs.bandwidthGb,
    mailboxes: specs.mailboxes,
    databases: specs.databases,
    hosted_domains: specs.hostedDomains,
    feature_bullets: specs.featureBullets,
  });
}

// Updates variants that already exist (matched by id), inserts ones the
// admin just added (no id yet), and deletes ids that were removed from the
// submitted list. A variant that has been ordered can't be deleted (FK from
// order_items) — that's surfaced as a field error instead of a crash.
async function syncProductVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  variants: z.infer<typeof variantSchema>[],
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const submittedIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const toDelete = (existing ?? []).filter((v) => !submittedIds.has(v.id)).map((v) => v.id);

  if (toDelete.length > 0) {
    const { error } = await supabase.from("product_variants").delete().in("id", toDelete);
    if (error) {
      return {
        error:
          "Couldn't remove a variant that has existing orders — set its stock to 0 instead of deleting it.",
      };
    }
  }

  for (const variant of variants) {
    const row = {
      product_id: productId,
      sku: variant.sku,
      name: variant.name,
      price_bdt: variant.priceBdt,
      stock: variant.stock,
      attributes: variant.attributes,
    };
    if (variant.id) {
      const { error } = await supabase
        .from("product_variants")
        .update(row)
        .eq("id", variant.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("product_variants").insert(row);
      if (error) return { error: error.message };
    }
  }

  return {};
}

async function syncProductImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  imageIds: string[],
) {
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (imageIds.length > 0) {
    await supabase.from("product_images").insert(
      imageIds.map((mediaId, i) => ({ product_id: productId, media_id: mediaId, sort_order: i })),
    );
  }
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { supabase } = await requireStaff();

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      base_price_bdt: parsed.data.basePriceBdt,
      status: parsed.data.status,
      featured_image_id: parsed.data.featuredImageId || null,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
      seo_og_image_id: parsed.data.seoOgImageId || null,
      service_type: parsed.data.serviceType,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      return { fieldErrors: { slug: ["That slug is already taken"] } };
    }
    return { error: error?.message ?? "Failed to create product" };
  }

  const variantResult = await syncProductVariants(supabase, created.id, parsed.data.variants);
  if (variantResult.error) return { error: variantResult.error };
  await syncProductImages(supabase, created.id, parsed.data.imageIds);
  await syncHostingSpecs(supabase, created.id, parsed.data.serviceType, parsed.data.hostingSpecs);

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { supabase } = await requireStaff();

  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      base_price_bdt: parsed.data.basePriceBdt,
      status: parsed.data.status,
      featured_image_id: parsed.data.featuredImageId || null,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
      seo_og_image_id: parsed.data.seoOgImageId || null,
      service_type: parsed.data.serviceType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["That slug is already taken"] } };
    }
    return { error: error.message };
  }

  const variantResult = await syncProductVariants(supabase, productId, parsed.data.variants);
  if (variantResult.error) return { error: variantResult.error };
  await syncProductImages(supabase, productId, parsed.data.imageIds);
  await syncHostingSpecs(supabase, productId, parsed.data.serviceType, parsed.data.hostingSpecs);

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  if (existing?.slug) revalidatePath(`/shop/${existing.slug}`);
  if (parsed.data.slug !== existing?.slug) revalidatePath(`/shop/${parsed.data.slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireStaff();

  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .select("id")
    .single();
  if (error) {
    throw new Error(
      error.code === "23503"
        ? "Can't delete a product that has existing orders."
        : error.message,
    );
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  if (existing?.slug) revalidatePath(`/shop/${existing.slug}`);
}
