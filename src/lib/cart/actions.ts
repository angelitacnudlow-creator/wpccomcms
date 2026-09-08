"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CartActionState = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// One cart per user by convention (not DB-enforced) — reuse the first one
// found, or create it on first add-to-cart.
async function getOrCreateCartId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Failed to create cart");
  return created.id;
}

export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<CartActionState> {
  try {
    const { supabase, user } = await requireUser();
    const cartId = await getOrCreateCartId(supabase, user.id);

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", cartId)
      .eq("variant_id", variantId)
      .maybeSingle();

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("cart_id", cartId)
        .eq("variant_id", variantId);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cartId, variant_id: variantId, quantity });
      if (error) return { error: error.message };
    }

    revalidatePath("/cart");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add to cart" };
  }
}

export async function updateCartItemQuantity(variantId: string, quantity: number) {
  const { supabase, user } = await requireUser();
  const cartId = await getOrCreateCartId(supabase, user.id);

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("variant_id", variantId);
  } else {
    await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("cart_id", cartId)
      .eq("variant_id", variantId);
  }
  revalidatePath("/cart");
}

export async function removeCartItem(variantId: string) {
  const { supabase, user } = await requireUser();
  const cartId = await getOrCreateCartId(supabase, user.id);
  await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("variant_id", variantId);
  revalidatePath("/cart");
}
