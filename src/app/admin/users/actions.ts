"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ROLES = ["admin", "editor", "author", "contributor", "customer"];

export async function updateUserRole(userId: string, role: string) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Matches the DB trigger (prevent_role_self_escalation): only admins can
  // change roles. Non-admins would hit that trigger anyway — this check
  // just gives a clean error instead of a raw Postgres exception.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
