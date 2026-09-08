import { createClient } from "@/lib/supabase/server";

export type CartLine = {
  variantId: string;
  productId: string;
  quantity: number;
  variantName: string;
  sku: string;
  priceBdt: number;
  stock: number;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  serviceType: "physical" | "hosting";
};

export async function getCart(userId: string): Promise<{ cartId: string | null; lines: CartLine[] }> {
  const supabase = await createClient();

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!cart) return { cartId: null, lines: [] };

  const { data: items } = await supabase
    .from("cart_items")
    .select(
      "quantity, variant_id, product_variants(id, sku, name, price_bdt, stock, products(id, name, slug, service_type, featured_image:featured_image_id(url)))",
    )
    .eq("cart_id", cart.id);

  const lines: CartLine[] = (items ?? [])
    .map((item) => {
      const variant = item.product_variants as unknown as {
        id: string;
        sku: string;
        name: string;
        price_bdt: number;
        stock: number;
        products: {
          id: string;
          name: string;
          slug: string;
          service_type: "physical" | "hosting";
          featured_image: { url: string } | null;
        } | null;
      } | null;
      if (!variant || !variant.products) return null;
      return {
        variantId: variant.id,
        productId: variant.products.id,
        quantity: item.quantity,
        variantName: variant.name,
        sku: variant.sku,
        priceBdt: variant.price_bdt,
        stock: variant.stock,
        productName: variant.products.name,
        productSlug: variant.products.slug,
        imageUrl: variant.products.featured_image?.url ?? null,
        serviceType: variant.products.service_type,
      };
    })
    .filter((l): l is CartLine => l !== null);

  return { cartId: cart.id, lines };
}
