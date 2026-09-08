"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

// Called once the admin has actually registered the domain / provisioned
// the hosting account for real, through their own registrar/host dashboard
// — see MASTER_PROMPT.md §17. This app has no automated provisioning.
export async function activateSubscription(id: string, periodEndDate: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "active", current_period_end: periodEndDate })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/subscriptions");
}

export async function cancelSubscription(id: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/subscriptions");
}
