"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { bdtToPoysha } from "@/lib/money";

export type DomainTldFormState = { error?: string; fieldErrors?: Record<string, string[]> };

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

const tldSchema = z.object({
  tld: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^\.[a-z0-9.]+$/, 'Must start with a dot, e.g. ".com"'),
  registerPrice: z.number().min(0),
  renewalPrice: z.number().min(0),
});

export async function createDomainTld(
  _prevState: DomainTldFormState,
  formData: FormData,
): Promise<DomainTldFormState> {
  const { supabase } = await requireStaff();

  const parsed = tldSchema.safeParse({
    tld: formData.get("tld"),
    registerPrice: Number(formData.get("registerPrice") ?? 0),
    renewalPrice: Number(formData.get("renewalPrice") ?? 0),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("domain_tlds").insert({
    tld: parsed.data.tld,
    register_price_bdt: bdtToPoysha(parsed.data.registerPrice),
    renewal_price_bdt: bdtToPoysha(parsed.data.renewalPrice),
  });
  if (error) {
    if (error.code === "23505") return { fieldErrors: { tld: ["That TLD already exists"] } };
    return { error: error.message };
  }

  revalidatePath("/admin/domains");
  revalidatePath("/domains");
  return {};
}

export async function deleteDomainTld(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("domain_tlds").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/domains");
  revalidatePath("/domains");
}

export async function toggleDomainTldStatus(id: string, status: "draft" | "published") {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("domain_tlds").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/domains");
  revalidatePath("/domains");
}
