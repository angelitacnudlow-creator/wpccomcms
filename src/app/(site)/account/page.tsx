import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBdt } from "@/lib/money";
import { RenewButton } from "./renew-button";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending_payment: "secondary",
  pending_provisioning: "secondary",
  active: "default",
  expiring_soon: "secondary",
  expired: "destructive",
  cancelled: "destructive",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [{ data: profile }, { data: orders }, { data: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", user.id).single(),
    supabase
      .from("orders")
      .select("id, status, payment_method, total_bdt, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select(
        "id, service_type, domain_name, billing_cycle, term_years, status, current_period_end, products(name), domain_tlds(tld)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My account</h1>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Log out
          </Button>
        </form>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{profile?.display_name}</p>
          <p>{user.email}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">My services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {subscriptions?.map((sub) => {
            const plan = sub.products as unknown as { name: string } | null;
            const tld = sub.domain_tlds as unknown as { tld: string } | null;
            const label =
              sub.service_type === "domain" ? `${sub.domain_name}${tld?.tld ?? ""}` : plan?.name;
            const canRenew = sub.status === "active" || sub.status === "expiring_soon";
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    {sub.service_type === "domain"
                      ? `${sub.term_years ?? 1} year registration`
                      : sub.billing_cycle}
                    {sub.current_period_end &&
                      ` · until ${new Date(sub.current_period_end).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[sub.status] ?? "secondary"}>
                    {sub.status.replace(/_/g, " ")}
                  </Badge>
                  {canRenew && <RenewButton subscriptionId={sub.id} />}
                </div>
              </div>
            );
          })}
          {subscriptions?.length === 0 && (
            <p className="text-muted-foreground">No hosting or domains yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {orders?.map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div>
                <p className="font-medium">{formatBdt(order.total_bdt)}</p>
                <p className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {order.payment_method === "cod" ? "Cash on Delivery" : "Stripe demo"}
                </p>
              </div>
              <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                {order.status}
              </Badge>
            </div>
          ))}
          {orders?.length === 0 && (
            <p className="text-muted-foreground">No orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
