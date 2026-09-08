import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusSelect } from "../status-select";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, status, payment_method, currency, subtotal_bdt, total_bdt, shipping_address, phone, created_at, profiles(display_name)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("order_items")
      .select("quantity, unit_price_bdt, description, product_variants(name, sku, products(name))")
      .eq("order_id", id),
  ]);

  if (!order) notFound();

  const customer = order.profiles as unknown as { display_name: string } | null;
  // Domain orders/renewals store just { phone } or {} (no delivery address —
  // there's nothing to ship), so every field here is optional.
  const shipping = order.shipping_address as {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order</h1>
        <StatusSelect orderId={order.id} status={order.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{customer?.display_name}</p>
          <p>{order.phone}</p>
          {shipping.line1 && (
            <p>
              {shipping.line1}
              {shipping.line2 ? `, ${shipping.line2}` : ""}, {shipping.city}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {items?.map((item, i) => {
            const variant = item.product_variants as unknown as {
              name: string;
              sku: string;
              products: { name: string } | null;
            } | null;
            const label = variant
              ? `${variant.products?.name} (${variant.name})`
              : item.description;
            return (
              <div key={i} className="flex justify-between">
                <span>
                  {label} × {item.quantity}
                </span>
                <span>{formatBdt(item.unit_price_bdt * item.quantity)}</span>
              </div>
            );
          })}
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatBdt(order.total_bdt)}</span>
          </div>
          <p className="text-muted-foreground">
            Payment: {order.payment_method === "cod" ? "Cash on Delivery" : "Stripe demo"} ·{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
