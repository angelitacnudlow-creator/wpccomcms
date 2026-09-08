import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusSelect } from "./status-select";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, order_kind, total_bdt, created_at, phone, profiles(display_name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => {
            const customer = order.profiles as unknown as { display_name: string } | null;
            return (
              <TableRow key={order.id}>
                <TableCell>
                  {customer?.display_name}
                  {order.order_kind !== "one_time" && (
                    <Badge variant="secondary" className="ml-2">
                      {order.order_kind === "new_service" ? "new service" : "renewal"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatBdt(order.total_bdt)}</TableCell>
                <TableCell>{order.payment_method === "cod" ? "COD" : "Stripe demo"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <StatusSelect orderId={order.id} status={order.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
          {orders?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No orders yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
