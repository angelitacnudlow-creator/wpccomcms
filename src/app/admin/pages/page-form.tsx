"use client";

import { useActionState, useState } from "react";
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
import { slugify } from "@/lib/slugify";
import { BlockEditor, MediaPicker, type MediaOption } from "@/lib/blocks/editor";
import type { Block } from "@/lib/blocks/types";
import type { PageFormState } from "./actions";

type PageFormAction = (
  state: PageFormState,
  formData: FormData,
) => Promise<PageFormState>;

const initialState: PageFormState = {};

export function PageForm({
  action,
  defaultValues,
  submitLabel,
  role,
  mediaOptions,
}: {
  action: PageFormAction;
  defaultValues?: {
    title: string;
    slug: string;
    content: Block[];
    status: "draft" | "scheduled" | "published";
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoOgImageId?: string | null;
  };
  submitLabel: string;
  role: string;
  mediaOptions: MediaOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));
  const [blocks, setBlocks] = useState<Block[]>(defaultValues?.content ?? []);
  const [seoOgImageId, setSeoOgImageId] = useState(defaultValues?.seoOgImageId ?? null);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>
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
        <p className="text-xs text-muted-foreground">/{slug || "…"}</p>
        {state.fieldErrors?.slug && (
          <p className="text-sm text-destructive">{state.fieldErrors.slug[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <BlockEditor value={blocks} onChange={setBlocks} role={role} mediaOptions={mediaOptions} />
        <input type="hidden" name="content" value={JSON.stringify(blocks)} />
        {state.fieldErrors?.content && (
          <p className="text-sm text-destructive">{state.fieldErrors.content[0]}</p>
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
            placeholder={title || "Falls back to the page title"}
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
