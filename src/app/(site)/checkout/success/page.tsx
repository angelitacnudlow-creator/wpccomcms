import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_method, order_kind, total_bdt, created_at")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) redirect("/");

  const codNote =
    order.order_kind === "one_time"
      ? "Pay in cash when it arrives."
      : "Pay in cash — we'll confirm and set this up shortly.";

  return (
    <div className="mx-auto max-w-md flex-1 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Thanks for your order!</h1>
      <p className="mt-2 text-muted-foreground">
        Order placed {new Date(order.created_at).toLocaleDateString()} — total{" "}
        {formatBdt(order.total_bdt)}.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {order.payment_method === "cod" ? codNote : "Paid via Stripe demo checkout."} Status:{" "}
        {order.status}.
      </p>
      <Link href="/account" className={`${buttonVariants()} mt-6`}>
        View my orders
      </Link>
    </div>
  );
}
