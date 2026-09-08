import { z } from "zod";

const richTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("richtext"),
  props: z.object({ text: z.string() }),
});

const headingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  props: z.object({
    text: z.string().min(1),
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  }),
});

const paragraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  props: z.object({ text: z.string().min(1) }),
});

const imageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  props: z.object({
    mediaId: z.string().nullable(),
    url: z.string(),
    alt: z.string(),
    caption: z.string(),
  }),
});

const galleryBlockSchema = z.object({
  id: z.string(),
  type: z.literal("gallery"),
  props: z.object({
    images: z.array(
      z.object({ mediaId: z.string().nullable(), url: z.string(), alt: z.string() }),
    ),
  }),
});

const buttonBlockSchema = z.object({
  id: z.string(),
  type: z.literal("button"),
  props: z.object({
    text: z.string().min(1),
    href: z.string().min(1),
    style: z.union([z.literal("primary"), z.literal("outline")]),
  }),
});

const columnsBlockSchema = z.object({
  id: z.string(),
  type: z.literal("columns"),
  props: z.object({ left: z.string(), right: z.string() }),
});

const quoteBlockSchema = z.object({
  id: z.string(),
  type: z.literal("quote"),
  props: z.object({ text: z.string().min(1), cite: z.string() }),
});

const embedBlockSchema = z.object({
  id: z.string(),
  type: z.literal("embed"),
  props: z.object({ url: z.string().min(1) }),
});

const spacerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("spacer"),
  props: z.object({ size: z.union([z.literal("sm"), z.literal("md"), z.literal("lg")]) }),
});

const htmlBlockSchema = z.object({
  id: z.string(),
  type: z.literal("html"),
  props: z.object({ html: z.string() }),
});

const contactFormBlockSchema = z.object({
  id: z.string(),
  type: z.literal("contactForm"),
  props: z.object({}),
});

const productGridBlockSchema = z.object({
  id: z.string(),
  type: z.literal("productGrid"),
  props: z.object({ limit: z.number().int().min(1).max(24) }),
});

export const blockSchema = z.discriminatedUnion("type", [
  richTextBlockSchema,
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  galleryBlockSchema,
  buttonBlockSchema,
  columnsBlockSchema,
  quoteBlockSchema,
  embedBlockSchema,
  spacerBlockSchema,
  htmlBlockSchema,
  contactFormBlockSchema,
  productGridBlockSchema,
]);

export const blocksSchema = z.array(blockSchema);
