"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { bdtToPoysha } from "@/lib/money";

// `price` here is whole/decimal Taka, as the admin types it — converted to
// integer poysha only at the form boundary (variantRowsToJson), matching
// how product-form.tsx handles the base price. Never store `price` itself.
export type VariantRow = {
  id?: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  size: string;
  color: string;
};

// Hosting plans have no real stock concept — variants there represent
// billing cycles (Monthly/Yearly), not physical inventory. Submit a large
// stock value transparently rather than exposing a meaningless field.
const UNLIMITED_STOCK = 999_999;

export function variantRowsToJson(rows: VariantRow[], mode: "physical" | "hosting" = "physical") {
  return JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      priceBdt: bdtToPoysha(r.price),
      stock: mode === "hosting" ? UNLIMITED_STOCK : r.stock,
      attributes: {
        ...(r.size ? { size: r.size } : {}),
        ...(r.color ? { color: r.color } : {}),
      },
    })),
  );
}

export function VariantsEditor({
  value,
  onChange,
  mode = "physical",
}: {
  value: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  mode?: "physical" | "hosting";
}) {
  const [rows, setRows] = useState<VariantRow[]>(value);
  const hosting = mode === "hosting";

  function update(index: number, patch: Partial<VariantRow>) {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    setRows(next);
    onChange(next);
  }

  function remove(index: number) {
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    onChange(next);
  }

  function add() {
    const next = [
      ...rows,
      {
        sku: "",
        name: hosting ? "Monthly" : "Default",
        price: 0,
        stock: 0,
        size: "",
        color: "",
      },
    ];
    setRows(next);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const fieldId = (name: string) => `variant-${row.id ?? `new-${i}`}-${name}`;
        return (
        <div key={row.id ?? `new-${i}`} className="rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={fieldId("sku")}>SKU</Label>
              <Input
                id={fieldId("sku")}
                value={row.sku}
                onChange={(e) => update(i, { sku: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={fieldId("name")}>{hosting ? "Billing cycle" : "Variant name"}</Label>
              <Input
                id={fieldId("name")}
                value={row.name}
                placeholder={hosting ? "Monthly or Yearly" : undefined}
                onChange={(e) => update(i, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={fieldId("price")}>
                Price (৳{hosting ? " per cycle" : ""})
              </Label>
              <Input
                id={fieldId("price")}
                type="number"
                min={0}
                step="0.01"
                value={row.price}
                onChange={(e) => update(i, { price: Number(e.target.value) || 0 })}
              />
            </div>
            {!hosting && (
              <>
                <div className="space-y-1">
                  <Label htmlFor={fieldId("stock")}>Stock</Label>
                  <Input
                    id={fieldId("stock")}
                    type="number"
                    min={0}
                    value={row.stock}
                    onChange={(e) => update(i, { stock: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={fieldId("size")}>Size (optional)</Label>
                  <Input
                    id={fieldId("size")}
                    value={row.size}
                    onChange={(e) => update(i, { size: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={fieldId("color")}>Color (optional)</Label>
                  <Input
                    id={fieldId("color")}
                    value={row.color}
                    onChange={(e) => update(i, { color: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => remove(i)}
          >
            <Trash2 className="size-4" /> Remove variant
          </Button>
        </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" /> Add {hosting ? "billing cycle" : "variant"}
      </Button>
    </div>
  );
}
