import { createClient } from "@/lib/supabase/server";
import { TldManager } from "./tld-manager";

export default async function AdminDomainsPage() {
  const supabase = await createClient();
  const { data: tlds } = await supabase
    .from("domain_tlds")
    .select("id, tld, register_price_bdt, renewal_price_bdt, status")
    .order("tld");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Domain TLDs</h1>
      <p className="text-sm text-muted-foreground">
        Price list shown on the public <code>/domains</code> page. No live availability
        checking — orders land as &quot;pending registration&quot; for manual fulfillment.
      </p>
      <TldManager tlds={tlds ?? []} />
    </div>
  );
}
