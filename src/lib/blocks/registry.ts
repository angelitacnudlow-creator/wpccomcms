import type { BlockType } from "./types";

export const ADDABLE_BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "image", label: "Image" },
  { type: "gallery", label: "Gallery" },
  { type: "button", label: "Button" },
  { type: "columns", label: "Columns (2-up)" },
  { type: "quote", label: "Quote" },
  { type: "embed", label: "Embed (YouTube/Vimeo)" },
  { type: "spacer", label: "Spacer" },
  { type: "contactForm", label: "Contact form" },
  { type: "productGrid", label: "Product grid" },
  { type: "html", label: "Custom HTML" },
];

// Renders unescaped — restrict to roles trusted with arbitrary markup.
export const ADMIN_ONLY_BLOCK_TYPES: BlockType[] = ["html"];

export function addableBlocksForRole(role: string) {
  const isStaff = role === "admin" || role === "editor";
  return ADDABLE_BLOCK_TYPES.filter(
    (b) => isStaff || !ADMIN_ONLY_BLOCK_TYPES.includes(b.type),
  );
}
