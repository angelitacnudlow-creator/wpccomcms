import { z } from "zod";
import { blocksSchema } from "@/lib/blocks/schema";

const slugField = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

const descriptionField = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: "Description is not valid" });
      return z.NEVER;
    }
  })
  .pipe(blocksSchema);

export const variantSchema = z.object({
  // Present for a variant already saved to the DB, absent for one the admin
  // just added in this editing session — see syncProductVariants, which
  // updates by id, inserts rows with no id, and only deletes ids that
  // disappeared from the submitted list (never a blind delete-all/reinsert,
  // since order_items references variant_id and would break).
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Variant name is required"),
  priceBdt: z.number().int().min(0),
  stock: z.number().int().min(0),
  attributes: z.record(z.string(), z.string()).default({}),
});

const hostingSpecsField = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: "Hosting specs are not valid" });
      return z.NEVER;
    }
  })
  .pipe(
    z.object({
      diskGb: z.number().int().min(0).nullable(),
      bandwidthGb: z.number().int().min(0).nullable(),
      mailboxes: z.number().int().min(0).nullable(),
      databases: z.number().int().min(0).nullable(),
      hostedDomains: z.number().int().min(0).nullable(),
      featureBullets: z.array(z.string()),
    }),
  )
  .optional();

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: slugField,
  description: descriptionField,
  basePriceBdt: z.number().int().min(0),
  status: z.enum(["draft", "published"]),
  featuredImageId: z.string().trim().optional(),
  seoTitle: z.string().trim().max(70, "Keep under 70 characters").optional(),
  seoDescription: z.string().trim().max(160, "Keep under 160 characters").optional(),
  seoOgImageId: z.string().trim().optional(),
  serviceType: z.enum(["physical", "hosting"]).default("physical"),
  hostingSpecs: hostingSpecsField,
  variants: z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: "custom", message: "Variants are not valid" });
        return z.NEVER;
      }
    })
    .pipe(z.array(variantSchema).min(1, "Add at least one variant")),
  imageIds: z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: "custom", message: "Images are not valid" });
        return z.NEVER;
      }
    })
    .pipe(z.array(z.string())),
});
