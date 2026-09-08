import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscriptionRowActions } from "./subscription-row-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending_payment: "secondary",
  pending_provisioning: "secondary",
  active: "default",
  expiring_soon: "secondary",
  expired: "destructive",
  cancelled: "destructive",
};

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(
      "id, service_type, domain_name, billing_cycle, term_years, status, current_period_end, created_at, profiles(display_name), products(name), domain_tlds(tld)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Domains and hosting plans are provisioned manually — see MASTER_PROMPT.md §17. Register
          or set up the service for real via your own registrar/host, then mark it active here.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active until</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions?.map((sub) => {
            const customer = sub.profiles as unknown as { display_name: string } | null;
            const plan = sub.products as unknown as { name: string } | null;
            const tld = sub.domain_tlds as unknown as { tld: string } | null;
            const label =
              sub.service_type === "domain"
                ? `${sub.domain_name}${tld?.tld ?? ""}`
                : (plan?.name ?? "Hosting plan");
            return (
              <TableRow key={sub.id}>
                <TableCell>{customer?.display_name}</TableCell>
                <TableCell>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    {sub.service_type === "domain"
                      ? `${sub.term_years ?? 1} year registration`
                      : sub.billing_cycle}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[sub.status] ?? "secondary"}>
                    {sub.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <SubscriptionRowActions
                    id={sub.id}
                    status={sub.status}
                    billingCycle={sub.billing_cycle}
                    termYears={sub.term_years}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {subscriptions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No subscriptions yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
