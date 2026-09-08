import { createClient } from "@/lib/supabase/server";
import { SiteIdentityForm } from "./site-identity-form";
import { RedirectsManager } from "./redirects-manager";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: media }, { data: redirects }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("site_name, tagline, primary_color, logo_media_id, favicon_media_id, social_links")
      .eq("id", 1)
      .single(),
    supabase.from("media").select("id, url, alt_text").order("created_at", { ascending: false }),
    supabase.from("redirects").select("id, from_path, to_path, status_code").order("from_path"),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
        <SiteIdentityForm
          mediaOptions={media ?? []}
          defaultValues={{
            siteName: settings?.site_name ?? "My Site",
            tagline: settings?.tagline ?? null,
            primaryColor: settings?.primary_color ?? "#111111",
            logoMediaId: settings?.logo_media_id ?? null,
            faviconMediaId: settings?.favicon_media_id ?? null,
            socialLinks: (settings?.social_links as Record<string, string>) ?? {},
          }}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium">Redirects</h2>
        <RedirectsManager redirects={redirects ?? []} />
      </div>
    </div>
  );
}
