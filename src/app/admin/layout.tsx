import { redirect } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(site)/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarNav } from "./sidebar-nav";

const STAFF_ROLES = ["admin", "editor", "author", "contributor"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proxy (src/proxy.ts) already redirects unauthenticated/unauthorized
  // requests before render, but Server Actions bypass proxy matchers, so
  // this route guard is re-checked here as the actual security boundary.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/");
  }

  const initials = (profile.display_name || user.email || "?")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-1 bg-muted/20">
      <aside className="w-60 shrink-0 border-r bg-background p-4">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            R
          </span>
          Admin
        </Link>
        <SidebarNav />
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
          <form action="/search" className="max-w-sm flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search the site…"
                className="pl-8"
                aria-label="Search the site"
              />
            </div>
          </form>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                {initials}
              </span>
              <span className="text-muted-foreground">
                {profile.display_name} · {profile.role}
              </span>
            </div>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
