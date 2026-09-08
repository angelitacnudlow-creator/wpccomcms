"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart/get-cart";
import { getStripeClient, DEMO_BDT_TO_USD_RATE, STRIPE_ENABLED } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site-url";
import { sendOrderConfirmationEmail } from "./notify";

export type CheckoutFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const shippingSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(6, "Phone number is required"),
  line1: z.string().trim().min(1, "Address is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
});

async function requireCartWithStock() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { cartId, lines } = await getCart(user.id);
  if (!cartId || lines.length === 0) throw new Error("Your cart is empty");

  const outOfStock = lines.find((l) => l.quantity > l.stock);
  if (outOfStock) {
    throw new Error(`Not enough stock for ${outOfStock.productName} (${outOfStock.variantName})`);
  }

  return { supabase, user, cartId, lines };
}

async function createOrderRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  shipping: z.infer<typeof shippingSchema>,
  lines: Awaited<ReturnType<typeof getCart>>["lines"],
  paymentMethod: "cod" | "stripe_demo",
) {
  const subtotal = lines.reduce((sum, l) => sum + l.priceBdt * l.quantity, 0);
  const hasHosting = lines.some((l) => l.serviceType === "hosting");

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      phone: shipping.phone,
      status: "pending",
      payment_method: paymentMethod,
      currency: "BDT",
      subtotal_bdt: subtotal,
      total_bdt: subtotal,
      shipping_address: shipping,
      order_kind: hasHosting ? "new_service" : "one_time",
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message ?? "Failed to create order");

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      variant_id: l.variantId,
      quantity: l.quantity,
      unit_price_bdt: l.priceBdt,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  // A hosting-plan line becomes an ongoing, renewable subscription — see
  // MASTER_PROMPT.md §17. `orders.subscription_id` only points at the first
  // one created (a convenience link for the common single-plan order); a
  // cart with multiple hosting plans still gets a correct subscription row
  // per plan, `/account` just reads from `subscriptions` directly rather
  // than through the order for that reason.
  let firstSubscriptionId: string | null = null;
  for (const line of lines) {
    if (line.serviceType !== "hosting") continue;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        service_type: "hosting",
        product_id: line.productId,
        billing_cycle: /year/i.test(line.variantName) ? "yearly" : "monthly",
        status: "pending_provisioning",
      })
      .select("id")
      .single();
    if (subError) throw new Error(subError.message);
    firstSubscriptionId = firstSubscriptionId ?? sub.id;
  }
  if (firstSubscriptionId) {
    await supabase.from("orders").update({ subscription_id: firstSubscriptionId }).eq("id", order.id);
  }

  return order.id as string;
}

async function decrementStockAndClearCart(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cartId: string,
  lines: Awaited<ReturnType<typeof getCart>>["lines"],
) {
  for (const line of lines) {
    // Hosting "stock" is a meaningless sentinel (see variants-editor.tsx) —
    // only physical goods actually track inventory.
    if (line.serviceType !== "physical") continue;
    await supabase
      .from("product_variants")
      .update({ stock: line.stock - line.quantity })
      .eq("id", line.variantId);
  }
  await supabase.from("cart_items").delete().eq("cart_id", cartId);
}

export async function placeOrderCod(
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const parsed = shippingSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let orderId: string;
  try {
    const { supabase, user, cartId, lines } = await requireCartWithStock();
    orderId = await createOrderRow(supabase, user.id, parsed.data, lines, "cod");
    await decrementStockAndClearCart(supabase, cartId, lines);

    if (user.email) {
      const totalBdt = lines.reduce((sum, l) => sum + l.priceBdt * l.quantity, 0);
      await sendOrderConfirmationEmail({
        email: user.email,
        orderId,
        lines,
        totalBdt,
        paymentMethod: "cod",
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Checkout failed" };
  }

  redirect(`/checkout/success?order=${orderId}`);
}

export async function createStripeDemoSession(
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  if (!STRIPE_ENABLED) {
    return { error: "Stripe demo checkout isn't configured yet." };
  }

  const parsed = shippingSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let checkoutUrl: string;
  try {
    const { supabase, user, cartId, lines } = await requireCartWithStock();
    const orderId = await createOrderRow(supabase, user.id, parsed.data, lines, "stripe_demo");

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lines.map((l) => ({
        price_data: {
          currency: "usd",
          product_data: { name: `${l.productName} — ${l.variantName}` },
          // l.priceBdt is poysha (BDT * 100); Stripe's unit_amount for USD
          // is cents (USD * 100). Both already carry a *100, so converting
          // poysha -> USD cents is just one division by the demo FX rate:
          // (priceBdt/100 Taka) / RATE = USD, * 100 for cents = priceBdt/RATE.
          unit_amount: Math.round(l.priceBdt / DEMO_BDT_TO_USD_RATE),
        },
        quantity: l.quantity,
      })),
      success_url: absoluteUrl(`/checkout/success?order=${orderId}`),
      cancel_url: absoluteUrl("/checkout"),
      metadata: { orderId, cartId },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    checkoutUrl = session.url;

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", orderId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stripe checkout failed" };
  }

  redirect(checkoutUrl);
}
