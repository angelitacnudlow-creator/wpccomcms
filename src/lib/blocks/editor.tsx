"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Block, BlockType } from "./types";
import { createDefaultBlock } from "./types";
import { addableBlocksForRole } from "./registry";

export type MediaOption = { id: string; url: string; alt_text: string | null };

export function BlockEditor({
  value,
  onChange,
  role,
  mediaOptions,
}: {
  value: Block[];
  onChange: (blocks: Block[]) => void;
  role: string;
  mediaOptions: MediaOption[];
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function updateBlock(id: string, block: Block) {
    onChange(value.map((b) => (b.id === id ? block : b)));
  }

  function removeBlock(id: string) {
    onChange(value.filter((b) => b.id !== id));
  }

  function addBlock(type: BlockType) {
    onChange([...value, createDefaultBlock(type)]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((b) => b.id === active.id);
    const newIndex = value.findIndex((b) => b.id === over.id);
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  const addable = addableBlocksForRole(role);

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {value.map((block) => (
            <SortableBlockCard
              key={block.id}
              block={block}
              onChange={(b) => updateBlock(block.id, b)}
              onRemove={() => removeBlock(block.id)}
              mediaOptions={mediaOptions}
            />
          ))}
        </SortableContext>
      </DndContext>

      {value.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No blocks yet — add one below.
        </p>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline">
              <Plus className="size-4" /> Add block
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {addable.map((b) => (
            <DropdownMenuItem key={b.type} onClick={() => addBlock(b.type)}>
              {b.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SortableBlockCard({
  block,
  onChange,
  onRemove,
  mediaOptions,
}: {
  block: Block;
  onChange: (block: Block) => void;
  onRemove: () => void;
  mediaOptions: MediaOption[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border bg-card p-4",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </button>
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {block.type}
          </span>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Delete block">
          <Trash2 className="size-4" />
        </Button>
      </div>
      <BlockFields block={block} onChange={onChange} mediaOptions={mediaOptions} />
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  mediaOptions,
}: {
  block: Block;
  onChange: (block: Block) => void;
  mediaOptions: MediaOption[];
}) {
  switch (block.type) {
    case "richtext":
    case "paragraph":
      return (
        <Textarea
          rows={4}
          value={block.props.text}
          onChange={(e) => onChange({ ...block, props: { ...block.props, text: e.target.value } })}
          placeholder="Paragraph text"
        />
      );

    case "heading":
      return (
        <div className="flex gap-3">
          <Input
            className="flex-1"
            value={block.props.text}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, text: e.target.value } })
            }
            placeholder="Heading text"
          />
          <Select
            value={String(block.props.level)}
            onValueChange={(v) =>
              onChange({ ...block, props: { ...block.props, level: Number(v) as 1 | 2 | 3 | 4 } })
            }
            items={[1, 2, 3, 4].map((l) => ({ value: String(l), label: `H${l}` }))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((l) => (
                <SelectItem key={l} value={String(l)}>
                  H{l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <MediaPicker
            mediaOptions={mediaOptions}
            value={block.props.mediaId}
            onSelect={(media) =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  mediaId: media.id,
                  url: media.url,
                  alt: block.props.alt || media.alt_text || "",
                },
              })
            }
          />
          {block.props.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.props.url} alt="" className="h-32 rounded-md border object-cover" />
          )}
          <Input
            value={block.props.alt}
            onChange={(e) => onChange({ ...block, props: { ...block.props, alt: e.target.value } })}
            placeholder="Alt text (required for accessibility)"
          />
          <Input
            value={block.props.caption}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, caption: e.target.value } })
            }
            placeholder="Caption (optional)"
          />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {block.props.images.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="size-16 rounded-md border object-cover" />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  onClick={() =>
                    onChange({
                      ...block,
                      props: {
                        images: block.props.images.filter((_, idx) => idx !== i),
                      },
                    })
                  }
                  aria-label="Remove image"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <MediaPicker
            mediaOptions={mediaOptions}
            value={null}
            onSelect={(media) =>
              onChange({
                ...block,
                props: {
                  images: [
                    ...block.props.images,
                    { mediaId: media.id, url: media.url, alt: media.alt_text ?? "" },
                  ],
                },
              })
            }
          />
        </div>
      );

    case "button":
      return (
        <div className="grid grid-cols-3 gap-3">
          <Input
            value={block.props.text}
            onChange={(e) => onChange({ ...block, props: { ...block.props, text: e.target.value } })}
            placeholder="Button text"
          />
          <Input
            value={block.props.href}
            onChange={(e) => onChange({ ...block, props: { ...block.props, href: e.target.value } })}
            placeholder="Link (e.g. /shop)"
          />
          <Select
            value={block.props.style}
            onValueChange={(v) =>
              onChange({ ...block, props: { ...block.props, style: v as "primary" | "outline" } })
            }
            items={[
              { value: "primary", label: "Primary" },
              { value: "outline", label: "Outline" },
            ]}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case "columns":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Left column</Label>
            <Textarea
              rows={4}
              value={block.props.left}
              onChange={(e) =>
                onChange({ ...block, props: { ...block.props, left: e.target.value } })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Right column</Label>
            <Textarea
              rows={4}
              value={block.props.right}
              onChange={(e) =>
                onChange({ ...block, props: { ...block.props, right: e.target.value } })
              }
            />
          </div>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2">
          <Textarea
            rows={3}
            value={block.props.text}
            onChange={(e) => onChange({ ...block, props: { ...block.props, text: e.target.value } })}
            placeholder="Quote text"
          />
          <Input
            value={block.props.cite}
            onChange={(e) => onChange({ ...block, props: { ...block.props, cite: e.target.value } })}
            placeholder="Attribution (optional)"
          />
        </div>
      );

    case "embed":
      return (
        <Input
          value={block.props.url}
          onChange={(e) => onChange({ ...block, props: { url: e.target.value } })}
          placeholder="https://youtube.com/watch?v=…"
        />
      );

    case "spacer":
      return (
        <Select
          value={block.props.size}
          onValueChange={(v) => onChange({ ...block, props: { size: v as "sm" | "md" | "lg" } })}
          items={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ]}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      );

    case "html":
      return (
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={block.props.html}
          onChange={(e) => onChange({ ...block, props: { html: e.target.value } })}
          placeholder="<div>Raw HTML — renders unescaped on the public site</div>"
        />
      );

    case "contactForm":
      return <p className="text-sm text-muted-foreground">Renders the built-in contact form.</p>;

    case "productGrid":
      return (
        <div className="w-32 space-y-1">
          <Label>Product count</Label>
          <Input
            type="number"
            min={1}
            max={24}
            value={block.props.limit}
            onChange={(e) =>
              onChange({ ...block, props: { limit: Number(e.target.value) || 1 } })
            }
          />
        </div>
      );
  }
}

export function MediaPicker({
  mediaOptions,
  value,
  onSelect,
}: {
  mediaOptions: MediaOption[];
  value: string | null;
  onSelect: (media: MediaOption) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={value ?? ""}
      onValueChange={(id) => {
        const media = mediaOptions.find((m) => m.id === id);
        if (media) onSelect(media);
      }}
      items={mediaOptions.map((m) => ({
        value: m.id,
        label: m.alt_text || m.url.split("/").pop() || m.id,
      }))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Choose from media library…" />
      </SelectTrigger>
      <SelectContent>
        {mediaOptions.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No media uploaded yet — visit Media first.
          </div>
        )}
        {mediaOptions.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.alt_text || m.url.split("/").pop()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
