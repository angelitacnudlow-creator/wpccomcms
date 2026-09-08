import { createClient } from "@/lib/supabase/server";
import { getMenuItems } from "@/lib/menus";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    headerItems,
    footerItems,
    settings,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getMenuItems("header"),
    getMenuItems("footer"),
    getSiteSettings(),
  ]);

  return (
    <>
      <SiteHeader siteName={settings.siteName} headerItems={headerItems} isLoggedIn={Boolean(user)} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter siteName={settings.siteName} footerItems={footerItems} />
    </>
  );
}
