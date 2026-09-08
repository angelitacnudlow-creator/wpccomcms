// posts.content / pages.content are always Block[] JSONB. Phase 2 stored
// exactly one "richtext" block per post/page; "richtext" stays supported
// here purely so that already-published content keeps rendering — the
// block editor (Phase 3) never adds new richtext blocks, it uses the
// typed block set below instead.

export type RichTextBlock = { id: string; type: "richtext"; props: { text: string } };
export type HeadingBlock = {
  id: string;
  type: "heading";
  props: { text: string; level: 1 | 2 | 3 | 4 };
};
export type ParagraphBlock = { id: string; type: "paragraph"; props: { text: string } };
export type ImageBlock = {
  id: string;
  type: "image";
  props: { mediaId: string | null; url: string; alt: string; caption: string };
};
export type GalleryImage = { mediaId: string | null; url: string; alt: string };
export type GalleryBlock = { id: string; type: "gallery"; props: { images: GalleryImage[] } };
export type ButtonBlock = {
  id: string;
  type: "button";
  props: { text: string; href: string; style: "primary" | "outline" };
};
export type ColumnsBlock = {
  id: string;
  type: "columns";
  props: { left: string; right: string };
};
export type QuoteBlock = { id: string; type: "quote"; props: { text: string; cite: string } };
export type EmbedBlock = { id: string; type: "embed"; props: { url: string } };
export type SpacerBlock = { id: string; type: "spacer"; props: { size: "sm" | "md" | "lg" } };
// Renders raw HTML on the public site — restricted to admin/editor in the
// editor UI (see registry.ts ADMIN_ONLY_TYPES) since it's an XSS vector if
// any lower-trust role could add one.
export type HtmlBlock = { id: string; type: "html"; props: { html: string } };
export type ContactFormBlock = { id: string; type: "contactForm"; props: Record<string, never> };
export type ProductGridBlock = {
  id: string;
  type: "productGrid";
  props: { limit: number };
};

export type Block =
  | RichTextBlock
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | GalleryBlock
  | ButtonBlock
  | ColumnsBlock
  | QuoteBlock
  | EmbedBlock
  | SpacerBlock
  | HtmlBlock
  | ContactFormBlock
  | ProductGridBlock;

export type BlockType = Block["type"];

export function newBlockId(): string {
  return crypto.randomUUID();
}

export function createDefaultBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "richtext":
      return { id, type, props: { text: "" } };
    case "heading":
      return { id, type, props: { text: "Heading", level: 2 } };
    case "paragraph":
      return { id, type, props: { text: "" } };
    case "image":
      return { id, type, props: { mediaId: null, url: "", alt: "", caption: "" } };
    case "gallery":
      return { id, type, props: { images: [] } };
    case "button":
      return { id, type, props: { text: "Learn more", href: "/", style: "primary" } };
    case "columns":
      return { id, type, props: { left: "", right: "" } };
    case "quote":
      return { id, type, props: { text: "", cite: "" } };
    case "embed":
      return { id, type, props: { url: "" } };
    case "spacer":
      return { id, type, props: { size: "md" } };
    case "html":
      return { id, type, props: { html: "" } };
    case "contactForm":
      return { id, type, props: {} };
    case "productGrid":
      return { id, type, props: { limit: 6 } };
  }
}
