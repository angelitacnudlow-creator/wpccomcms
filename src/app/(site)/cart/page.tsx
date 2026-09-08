import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart/get-cart";
import { formatBdt } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { CartItemRow } from "./cart-item-row";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/cart");

  const { lines } = await getCart(user.id);
  const total = lines.reduce((sum, l) => sum + l.priceBdt * l.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold">Your cart</h1>

      {lines.length === 0 ? (
        <p className="text-muted-foreground">
          Your cart is empty.{" "}
          <Link href="/shop" className="underline">
            Browse the shop
          </Link>
          .
        </p>
      ) : (
        <>
          <div>
            {lines.map((line) => (
              <CartItemRow key={line.variantId} line={line} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-lg font-medium">Total: {formatBdt(total)}</span>
            <Link href="/checkout" className={buttonVariants()}>
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
