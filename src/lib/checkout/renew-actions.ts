"use server";

import { createClient } from "@/lib/supabase/server";

// Renewals are invoice-based, not auto-charged (see MASTER_PROMPT.md §17) —
// this creates a new order for the next cycle, exactly like placing a fresh
// order, and (COD-trust, matching how a physical COD order immediately
// decrements stock rather than waiting for delivery) extends the service's
// period right away. Returns the new order id rather than calling
// `redirect()` itself — this is invoked from a plain onClick handler, not a
// `<form action>`, and redirect()'s special throw is only proven safe in
// this codebase for the form-action path.
export async function renewSubscription(subscriptionId: string): Promise<{ orderId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, service_type, product_id, domain_tld_id, domain_name, billing_cycle, term_years, current_period_end",
    )
    .eq("id", subscriptionId)
    .single();
  if (!sub) throw new Error("Subscription not found");

  let totalBdt: number;
  let description: string | null = null;
  let variantId: string | null = null;

  if (sub.service_type === "domain") {
    const { data: tld } = await supabase
      .from("domain_tlds")
      .select("tld, renewal_price_bdt")
      .eq("id", sub.domain_tld_id)
      .single();
    if (!tld) throw new Error("Domain TLD no longer exists");
    const years = sub.term_years ?? 1;
    totalBdt = tld.renewal_price_bdt * years;
    description = `${sub.domain_name}${tld.tld} — ${years} year renewal`;
  } else {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, name, price_bdt")
      .eq("product_id", sub.product_id);
    const match = (variants ?? []).find((v) =>
      sub.billing_cycle === "yearly" ? /year/i.test(v.name) : /month/i.test(v.name),
    );
    if (!match) throw new Error("That plan's billing cycle is no longer available");
    totalBdt = match.price_bdt;
    variantId = match.id;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      payment_method: "cod",
      currency: "BDT",
      subtotal_bdt: totalBdt,
      total_bdt: totalBdt,
      shipping_address: {},
      order_kind: "renewal",
      subscription_id: sub.id,
    })
    .select("id")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create renewal order");

  const { error: itemError } = await supabase.from("order_items").insert(
    variantId
      ? { order_id: order.id, variant_id: variantId, quantity: 1, unit_price_bdt: totalBdt }
      : { order_id: order.id, description, quantity: 1, unit_price_bdt: totalBdt },
  );
  if (itemError) throw new Error(itemError.message);

  const base = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
  if (sub.service_type === "domain") {
    base.setFullYear(base.getFullYear() + (sub.term_years ?? 1));
  } else if (sub.billing_cycle === "yearly") {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    base.setMonth(base.getMonth() + 1);
  }

  await supabase
    .from("subscriptions")
    .update({ current_period_end: base.toISOString().slice(0, 10), status: "active" })
    .eq("id", sub.id);

  return { orderId: order.id as string };
}
