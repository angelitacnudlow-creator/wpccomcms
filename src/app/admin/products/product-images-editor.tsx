"use client";

import { X } from "lucide-react";
import { MediaPicker, type MediaOption } from "@/lib/blocks/editor";

export function ProductImagesEditor({
  mediaOptions,
  value,
  onChange,
}: {
  mediaOptions: MediaOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = value
    .map((id) => mediaOptions.find((m) => m.id === id))
    .filter((m): m is MediaOption => Boolean(m));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((media) => (
          <div key={media.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.url} alt="" className="size-16 rounded-md border object-cover" />
            <button
              type="button"
              className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              onClick={() => onChange(value.filter((id) => id !== media.id))}
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
        onSelect={(m) => {
          if (!value.includes(m.id)) onChange([...value, m.id]);
        }}
      />
    </div>
  );
}
