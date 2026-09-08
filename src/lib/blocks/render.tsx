import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Block } from "./types";
import { ContactFormBlockView } from "./contact-form-block";

function embedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      const id = u.hostname === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return url;
  } catch {
    return null;
  }
}

const SPACER_HEIGHT: Record<string, string> = { sm: "h-4", md: "h-8", lg: "h-16" };
const HEADING_CLASS: Record<number, string> = {
  1: "text-4xl font-semibold",
  2: "text-3xl font-semibold",
  3: "text-2xl font-semibold",
  4: "text-xl font-semibold",
};

async function ProductGridBlockView({ limit }: { limit: number }) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, base_price_bdt, featured_image_id, media:featured_image_id(url)")
    .eq("status", "published")
    .limit(limit);

  if (!products || products.length === 0) {
    return <p className="text-sm text-muted-foreground">No products to show yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {products.map((product) => (
        <Link key={product.id} href={`/shop/${product.slug}`} className="group">
          <div className="aspect-square overflow-hidden rounded-md border bg-muted">
            {(product.media as unknown as { url: string } | null)?.url && (
              <Image
                src={(product.media as unknown as { url: string }).url}
                alt={product.name}
                width={300}
                height={300}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            )}
          </div>
          <p className="mt-2 text-sm font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">৳{(product.base_price_bdt / 100).toFixed(2)}</p>
        </Link>
      ))}
    </div>
  );
}

// Server Component — public block renderer. Content is authored only by
// admin/editor/author/contributor through the block editor (see
// registry.ts for the "html" block's admin-only gate), so this is a
// trusted-author, not a trusted-visitor, rendering surface.
export async function RenderBlocks({ blocks }: { blocks: unknown }) {
  if (!Array.isArray(blocks)) return null;

  const rendered = await Promise.all(
    (blocks as Block[]).map(async (block) => {
      switch (block.type) {
        case "richtext":
        case "paragraph": {
          const paragraphs = block.props.text.split(/\n\s*\n/).filter(Boolean);
          return (
            <div key={block.id} className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          );
        }
        case "heading":
          return (
            <p key={block.id} className={HEADING_CLASS[block.props.level]}>
              {block.props.text}
            </p>
          );
        case "image":
          if (!block.props.url) return null;
          return (
            <figure key={block.id}>
              <Image
                src={block.props.url}
                alt={block.props.alt}
                width={1200}
                height={800}
                className="w-full rounded-md"
              />
              {block.props.caption && (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {block.props.caption}
                </figcaption>
              )}
            </figure>
          );
        case "gallery":
          if (block.props.images.length === 0) return null;
          return (
            <div key={block.id} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {block.props.images.map((img, i) => (
                <Image
                  key={i}
                  src={img.url}
                  alt={img.alt}
                  width={400}
                  height={400}
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          );
        case "button":
          return (
            <Link
              key={block.id}
              href={block.props.href}
              className={cn(
                buttonVariants({ variant: block.props.style === "outline" ? "outline" : "default" }),
              )}
            >
              {block.props.text}
            </Link>
          );
        case "columns":
          return (
            <div key={block.id} className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                {block.props.left.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="space-y-4">
                {block.props.right.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          );
        case "quote":
          return (
            <blockquote key={block.id} className="border-l-2 pl-4 italic text-muted-foreground">
              <p>{block.props.text}</p>
              {block.props.cite && <cite className="mt-1 block text-sm not-italic">— {block.props.cite}</cite>}
            </blockquote>
          );
        case "embed": {
          const src = embedSrc(block.props.url);
          if (!src) return null;
          return (
            <div key={block.id} className="aspect-video w-full overflow-hidden rounded-md">
              <iframe src={src} className="h-full w-full" allowFullScreen />
            </div>
          );
        }
        case "spacer":
          return <div key={block.id} className={SPACER_HEIGHT[block.props.size]} />;
        case "html":
          return <div key={block.id} dangerouslySetInnerHTML={{ __html: block.props.html }} />;
        case "contactForm":
          return <ContactFormBlockView key={block.id} />;
        case "productGrid":
          return <ProductGridBlockView key={block.id} limit={block.props.limit} />;
        default:
          return null;
      }
    }),
  );

  return <div className="max-w-none space-y-6 leading-relaxed text-foreground">{rendered}</div>;
}
