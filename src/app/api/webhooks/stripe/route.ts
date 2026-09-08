import { NextResponse } from "next/server";
import { getStripeClient, STRIPE_ENABLED } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/checkout/notify";

// Confirms a Stripe demo checkout: marks the order confirmed, decrements
// stock, and clears the cart — mirroring what the COD path does inline at
// order-creation time, but only once payment actually succeeds here.
export async function POST(request: Request) {
  if (!STRIPE_ENABLED || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as { metadata?: { orderId?: string; cartId?: string } };
  const orderId = session.metadata?.orderId;
  const cartId = session.metadata?.cartId;
  if (!orderId) return NextResponse.json({ error: "Missing orderId in metadata" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status, user_id, total_bdt")
    .eq("id", orderId)
    .single();
  if (order?.status !== "pending") {
    // Already processed (Stripe retries webhooks) or not in a confirmable state.
    return NextResponse.json({ received: true });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, quantity, unit_price_bdt, product_variants(name, products(name))")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();
    if (variant) {
      await supabase
        .from("product_variants")
        .update({ stock: Math.max(0, variant.stock - item.quantity) })
        .eq("id", item.variant_id);
    }
  }

  await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId);
  if (cartId) {
    await supabase.from("cart_items").delete().eq("cart_id", cartId);
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
  if (authUser?.user?.email) {
    await sendOrderConfirmationEmail({
      email: authUser.user.email,
      orderId,
      lines: (items ?? []).map((item) => {
        const variant = item.product_variants as unknown as {
          name: string;
          products: { name: string } | null;
        } | null;
        return {
          variantId: item.variant_id,
          productId: "",
          quantity: item.quantity,
          variantName: variant?.name ?? "",
          sku: "",
          priceBdt: item.unit_price_bdt,
          stock: 0,
          productName: variant?.products?.name ?? "",
          productSlug: "",
          imageUrl: null,
          // sendOrderConfirmationEmail's template never reads serviceType —
          // this placeholder only exists to satisfy CartLine's shape.
          serviceType: "physical" as const,
        };
      }),
      totalBdt: order.total_bdt,
      paymentMethod: "stripe_demo",
    });
  }

  return NextResponse.json({ received: true });
}
