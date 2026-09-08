import { createClient } from "@/lib/supabase/server";

type HostingSpecs = {
  disk_gb: number | null;
  bandwidth_gb: number | null;
  mailboxes: number | null;
  databases: number | null;
  hosted_domains: number | null;
  feature_bullets: string[];
};

type Variant = { id: string; name: string; price_bdt: number; stock: number };

export type HostingPlan = {
  id: string;
  name: string;
  slug: string;
  base_price_bdt: number;
  variants: Variant[];
  specs: HostingSpecs | null;
};

export async function getHostingPlans(limit?: number): Promise<HostingPlan[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, name, slug, base_price_bdt, product_variants(id, name, price_bdt, stock), hosting_plan_specs(disk_gb, bandwidth_gb, mailboxes, databases, hosted_domains, feature_bullets)",
    )
    .eq("service_type", "hosting")
    .eq("status", "published")
    .order("base_price_bdt");

  if (limit) query = query.limit(limit);

  const { data } = await query;

  return (data ?? []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    base_price_bdt: plan.base_price_bdt,
    variants: (plan.product_variants as unknown as Variant[]) ?? [],
    specs: (plan.hosting_plan_specs as unknown as HostingSpecs | null) ?? null,
  }));
}

export function hostingPlanFeatureLines(specs: HostingSpecs | null): string[] {
  const lines = [
    specs?.disk_gb != null ? `${specs.disk_gb} GB disk space` : "Unlimited disk space",
    specs?.bandwidth_gb != null ? `${specs.bandwidth_gb} GB bandwidth` : "Unlimited bandwidth",
    specs?.mailboxes != null ? `${specs.mailboxes} mailboxes` : "Unlimited mailboxes",
    specs?.databases != null ? `${specs.databases} databases` : "Unlimited databases",
    specs?.hosted_domains != null
      ? `${specs.hosted_domains} hosted domain${specs.hosted_domains === 1 ? "" : "s"}`
      : "Unlimited hosted domains",
  ];
  return [...lines, ...(specs?.feature_bullets ?? [])];
}
