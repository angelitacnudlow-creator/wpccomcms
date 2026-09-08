"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { formatBdt } from "@/lib/money";

export type DomainOrderState = { error?: string; fieldErrors?: Record<string, string[]> };

const domainOrderSchema = z.object({
  domainName: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter the domain name you want")
    .regex(/^[a-z0-9-]+$/, "Letters, numbers, and hyphens only — no spaces or dots"),
  tldId: z.string().trim().min(1, "Choose a TLD"),
  termYears: z.coerce.number().int().min(1).max(10),
  phone: z.string().trim().min(6, "Phone number is required"),
});

// Domains bypass the shared cart entirely — a domain purchase is a single
// dynamic item (whatever name the customer typed), not a catalog SKU, so it
// doesn't fit cart_items' variant_id shape the way hosting plans do. See
// MASTER_PROMPT.md §17. COD-only for v1 (no Stripe-demo path for domains yet).
export async function orderDomainCod(
  _prevState: DomainOrderState,
  formData: FormData,
): Promise<DomainOrderState> {
  const parsed = domainOrderSchema.safeParse({
    domainName: formData.get("domainName"),
    tldId: formData.get("tldId"),
    termYears: formData.get("termYears"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to order a domain." };

  const { data: tld } = await supabase
    .from("domain_tlds")
    .select("tld, register_price_bdt")
    .eq("id", parsed.data.tldId)
    .single();
  if (!tld) return { fieldErrors: { tldId: ["Choose a valid TLD"] } };

  const totalBdt = tld.register_price_bdt * parsed.data.termYears;
  const fullDomain = `${parsed.data.domainName}${tld.tld}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      phone: parsed.data.phone,
      status: "pending",
      payment_method: "cod",
      currency: "BDT",
      subtotal_bdt: totalBdt,
      total_bdt: totalBdt,
      shipping_address: { phone: parsed.data.phone },
      order_kind: "new_service",
    })
    .select("id")
    .single();
  if (orderError || !order) return { error: orderError?.message ?? "Failed to create order" };

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    description: `${fullDomain} — ${parsed.data.termYears} year registration`,
    quantity: 1,
    unit_price_bdt: totalBdt,
  });
  if (itemError) return { error: itemError.message };

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      service_type: "domain",
      domain_tld_id: parsed.data.tldId,
      domain_name: parsed.data.domainName,
      term_years: parsed.data.termYears,
      status: "pending_provisioning",
    })
    .select("id")
    .single();
  if (subError) return { error: subError.message };

  await supabase.from("orders").update({ subscription_id: subscription.id }).eq("id", order.id);

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: "Domain order received",
      html: `<p>We received your order for <strong>${fullDomain}</strong> (${parsed.data.termYears} year${parsed.data.termYears > 1 ? "s" : ""}) — ${formatBdt(totalBdt)}.</p><p>We'll confirm availability and register it shortly.</p>`,
    });
  }

  redirect(`/checkout/success?order=${order.id}`);
}
