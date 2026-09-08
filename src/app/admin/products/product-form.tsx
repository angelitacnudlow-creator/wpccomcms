"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";
import { BlockEditor, MediaPicker, type MediaOption } from "@/lib/blocks/editor";
import type { Block } from "@/lib/blocks/types";
import { VariantsEditor, variantRowsToJson, type VariantRow } from "./variants-editor";
import { ProductImagesEditor } from "./product-images-editor";
import { HostingSpecsEditor, emptyHostingSpecs, type HostingSpecs } from "./hosting-specs-editor";
import type { ProductFormState } from "./actions";
import { poyshaToBdt } from "@/lib/money";

type ProductFormAction = (
  state: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

const initialState: ProductFormState = {};

export function ProductForm({
  action,
  role,
  mediaOptions,
  submitLabel,
  defaultValues,
}: {
  action: ProductFormAction;
  role: string;
  mediaOptions: MediaOption[];
  submitLabel: string;
  defaultValues?: {
    name: string;
    slug: string;
    description: Block[];
    basePriceBdt: number;
    status: "draft" | "scheduled" | "published";
    featuredImageId: string | null;
    imageIds: string[];
    variants: VariantRow[];
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoOgImageId?: string | null;
    serviceType?: "physical" | "hosting";
    hostingSpecs?: HostingSpecs | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));
  const [description, setDescription] = useState<Block[]>(defaultValues?.description ?? []);
  const [featuredImageId, setFeaturedImageId] = useState(defaultValues?.featuredImageId ?? null);
  const [imageIds, setImageIds] = useState<string[]>(defaultValues?.imageIds ?? []);
  const [seoOgImageId, setSeoOgImageId] = useState(defaultValues?.seoOgImageId ?? null);
  const [serviceType, setServiceType] = useState<"physical" | "hosting">(
    defaultValues?.serviceType ?? "physical",
  );
  const [hostingSpecs, setHostingSpecs] = useState<HostingSpecs>(
    defaultValues?.hostingSpecs ?? emptyHostingSpecs,
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    defaultValues?.variants ?? [
      {
        sku: "",
        name: "Default",
        price: defaultValues ? poyshaToBdt(defaultValues.basePriceBdt) : 0,
        stock: 0,
        size: "",
        color: "",
      },
    ],
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          required
        />
        <p className="text-xs text-muted-foreground">/shop/{slug || "…"}</p>
        {state.fieldErrors?.slug && (
          <p className="text-sm text-destructive">{state.fieldErrors.slug[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceType">Product type</Label>
        <Select
          name="serviceType"
          value={serviceType}
          onValueChange={(v) => v && setServiceType(v as "physical" | "hosting")}
          items={[
            { value: "physical", label: "Physical product" },
            { value: "hosting", label: "Hosting plan" },
          ]}
        >
          <SelectTrigger id="serviceType" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="physical">Physical product</SelectItem>
            <SelectItem value="hosting">Hosting plan</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Hosting plans use billing cycles instead of stock, and show resource specs on the
          public plan card.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="basePrice">
          {serviceType === "hosting" ? "Starting price (৳)" : "Base price (৳)"}
        </Label>
        <Input
          id="basePrice"
          name="basePrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaultValues ? poyshaToBdt(defaultValues.basePriceBdt) : 0}
          required
        />
        <p className="text-xs text-muted-foreground">
          {serviceType === "hosting"
            ? "Shown on the plan card — the actual charged price comes from the selected billing cycle."
            : "Shown on the shop listing — the actual charged price comes from the selected variant."}
        </p>
        {state.fieldErrors?.basePriceBdt && (
          <p className="text-sm text-destructive">{state.fieldErrors.basePriceBdt[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <BlockEditor
          value={description}
          onChange={setDescription}
          role={role}
          mediaOptions={mediaOptions}
        />
        <input type="hidden" name="description" value={JSON.stringify(description)} />
        {state.fieldErrors?.description && (
          <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Featured image</Label>
        <MediaPicker
          mediaOptions={mediaOptions}
          value={featuredImageId}
          onSelect={(m) => setFeaturedImageId(m.id)}
        />
        <input type="hidden" name="featuredImageId" value={featuredImageId ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Gallery images</Label>
        <ProductImagesEditor mediaOptions={mediaOptions} value={imageIds} onChange={setImageIds} />
        <input type="hidden" name="imageIds" value={JSON.stringify(imageIds)} />
      </div>

      {serviceType === "hosting" && (
        <div className="space-y-2">
          <Label>Hosting specs</Label>
          <HostingSpecsEditor value={hostingSpecs} onChange={setHostingSpecs} />
          <input type="hidden" name="hostingSpecs" value={JSON.stringify(hostingSpecs)} />
          {state.fieldErrors?.hostingSpecs && (
            <p className="text-sm text-destructive">{state.fieldErrors.hostingSpecs[0]}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>{serviceType === "hosting" ? "Billing cycles" : "Variants"}</Label>
        <VariantsEditor value={variants} onChange={setVariants} mode={serviceType} />
        <input type="hidden" name="variants" value={variantRowsToJson(variants, serviceType)} />
        {state.fieldErrors?.variants && (
          <p className="text-sm text-destructive">{state.fieldErrors.variants[0]}</p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">SEO</h3>
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input
            id="seoTitle"
            name="seoTitle"
            defaultValue={defaultValues?.seoTitle ?? ""}
            placeholder={name || "Falls back to the product name"}
          />
          {state.fieldErrors?.seoTitle && (
            <p className="text-sm text-destructive">{state.fieldErrors.seoTitle[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO description</Label>
          <Textarea
            id="seoDescription"
            name="seoDescription"
            defaultValue={defaultValues?.seoDescription ?? ""}
            rows={2}
          />
          {state.fieldErrors?.seoDescription && (
            <p className="text-sm text-destructive">{state.fieldErrors.seoDescription[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Social share image</Label>
          <MediaPicker
            mediaOptions={mediaOptions}
            value={seoOgImageId}
            onSelect={(m) => setSeoOgImageId(m.id)}
          />
          <p className="text-xs text-muted-foreground">Falls back to the featured image.</p>
          <input type="hidden" name="seoOgImageId" value={seoOgImageId ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          defaultValue={defaultValues?.status ?? "draft"}
          items={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        >
          <SelectTrigger id="status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
