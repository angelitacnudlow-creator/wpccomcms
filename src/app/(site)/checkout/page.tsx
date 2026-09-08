import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart/get-cart";
import { formatBdt } from "@/lib/money";
import { STRIPE_ENABLED } from "@/lib/stripe";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const { lines } = await getCart(user.id);
  if (lines.length === 0) redirect("/cart");

  const total = lines.reduce((sum, l) => sum + l.priceBdt * l.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold">Checkout</h1>
      <div className="grid gap-10 sm:grid-cols-2">
        <CheckoutForm stripeEnabled={STRIPE_ENABLED} />
        <div>
          <h2 className="mb-4 text-lg font-medium">Order summary</h2>
          <div className="space-y-2">
            {lines.map((line) => (
              <div key={line.variantId} className="flex justify-between text-sm">
                <span>
                  {line.productName} ({line.variantName}) × {line.quantity}
                </span>
                <span>{formatBdt(line.priceBdt * line.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t pt-4 font-medium">
            <span>Total</span>
            <span>{formatBdt(total)}</span>
          </div>
          <Link href="/cart" className="mt-4 inline-block text-sm text-muted-foreground underline">
            Edit cart
          </Link>
        </div>
      </div>
    </div>
  );
}
