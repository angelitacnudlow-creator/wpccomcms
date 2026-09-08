import { z } from "zod";
import { blocksSchema } from "@/lib/blocks/schema";

const slugField = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

// `content` arrives as a JSON string (serialized by the block editor into a
// hidden form field) — parse before validating shape.
const contentField = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: "Content is not valid" });
      return z.NEVER;
    }
  })
  .pipe(blocksSchema)
  .refine((blocks) => blocks.length > 0, "Add at least one block");

const seoFields = {
  seoTitle: z.string().trim().max(70, "Keep under 70 characters").optional(),
  seoDescription: z.string().trim().max(160, "Keep under 160 characters").optional(),
  seoOgImageId: z.string().trim().optional(),
};

export const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: slugField,
  excerpt: z.string().trim().optional(),
  content: contentField,
  status: z.enum(["draft", "published"]),
  ...seoFields,
});

export const pageSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: slugField,
  content: contentField,
  status: z.enum(["draft", "published"]),
  ...seoFields,
});
