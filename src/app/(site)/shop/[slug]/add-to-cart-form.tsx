"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBdt } from "@/lib/money";
import { addToCart } from "@/lib/cart/actions";

type Variant = {
  id: string;
  name: string;
  priceBdt: number;
  stock: number;
};

export function AddToCartForm({
  variants,
  isLoggedIn,
  productSlug,
}: {
  variants: Variant[];
  isLoggedIn: boolean;
  productSlug: string;
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const selected = variants.find((v) => v.id === variantId) ?? variants[0];

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <p className="text-lg font-medium">{selected ? formatBdt(selected.priceBdt) : null}</p>
        <p className="text-sm text-muted-foreground">
          <Link href={`/login?next=/shop/${productSlug}`} className="underline">
            Log in
          </Link>{" "}
          to add this to your cart.
        </p>
      </div>
    );
  }

  const outOfStock = selected ? selected.stock <= 0 : true;

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium">{selected ? formatBdt(selected.priceBdt) : null}</p>

      {variants.length > 1 && (
        <Select
          value={variantId}
          onValueChange={(v) => v && setVariantId(v)}
          items={variants.map((v) => ({ value: v.id, label: v.name }))}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variants.map((v) => (
              <SelectItem key={v.id} value={v.id} disabled={v.stock <= 0}>
                {v.name} {v.stock <= 0 ? "(out of stock)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-3">
        <Input
          type="number"
          aria-label="Quantity"
          min={1}
          max={selected?.stock ?? 1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="w-20"
        />
        <Button
          disabled={isPending || outOfStock}
          onClick={() => {
            startTransition(async () => {
              const result = await addToCart(variantId, quantity);
              if (result.error) {
                toast.error(result.error);
              } else {
                toast.success("Added to cart");
              }
            });
          }}
        >
          {outOfStock ? "Out of stock" : isPending ? "Adding…" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
