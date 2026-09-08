"use client";

import { useTransition } from "react";
import Image from "next/image";
import { formatBdt } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateCartItemQuantity, removeCartItem } from "@/lib/cart/actions";
import type { CartLine } from "@/lib/cart/get-cart";

export function CartItemRow({ line }: { line: CartLine }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4 border-b py-4">
      <div className="size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
        {line.imageUrl && (
          <Image src={line.imageUrl} alt={line.productName} width={64} height={64} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium">{line.productName}</p>
        <p className="text-sm text-muted-foreground">{line.variantName}</p>
        <p className="text-sm">{formatBdt(line.priceBdt)}</p>
      </div>
      <Input
        type="number"
        aria-label={`Quantity for ${line.productName}`}
        min={0}
        max={line.stock}
        defaultValue={line.quantity}
        disabled={isPending}
        className="w-20"
        onBlur={(e) => {
          const qty = Math.max(0, Number(e.target.value) || 0);
          startTransition(() => updateCartItemQuantity(line.variantId, qty));
        }}
      />
      <p className="w-24 text-right font-medium">{formatBdt(line.priceBdt * line.quantity)}</p>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => removeCartItem(line.variantId))}
      >
        Remove
      </Button>
    </div>
  );
}
