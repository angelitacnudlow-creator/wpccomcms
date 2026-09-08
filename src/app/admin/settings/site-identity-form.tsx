"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker, type MediaOption } from "@/lib/blocks/editor";
import { updateSiteSettings, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = {};

export function SiteIdentityForm({
  mediaOptions,
  defaultValues,
}: {
  mediaOptions: MediaOption[];
  defaultValues: {
    siteName: string;
    tagline: string | null;
    primaryColor: string;
    logoMediaId: string | null;
    faviconMediaId: string | null;
    socialLinks: Record<string, string>;
  };
}) {
  const [state, formAction, pending] = useActionState(updateSiteSettings, initialState);
  const [logoMediaId, setLogoMediaId] = useState(defaultValues.logoMediaId);
  const [faviconMediaId, setFaviconMediaId] = useState(defaultValues.faviconMediaId);

  return (
    // Saving doesn't redirect, so the Server Action's revalidation re-render
    // hands this already-mounted form fresh `defaultValues` — remount the
    // uncontrolled fields via key instead of leaving stale text in them.
    <form
      key={JSON.stringify(defaultValues)}
      action={formAction}
      className="max-w-lg space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="siteName">Site name</Label>
        <Input id="siteName" name="siteName" defaultValue={defaultValues.siteName} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Textarea
          id="tagline"
          name="tagline"
          defaultValue={defaultValues.tagline ?? ""}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Used as the fallback meta description sitewide.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryColor">Primary color</Label>
        <Input
          id="primaryColor"
          name="primaryColor"
          type="color"
          defaultValue={defaultValues.primaryColor}
          className="h-9 w-16 p-1"
        />
      </div>

      <div className="space-y-2">
        <Label>Logo</Label>
        <MediaPicker mediaOptions={mediaOptions} value={logoMediaId} onSelect={(m) => setLogoMediaId(m.id)} />
        <input type="hidden" name="logoMediaId" value={logoMediaId ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Favicon</Label>
        <MediaPicker
          mediaOptions={mediaOptions}
          value={faviconMediaId}
          onSelect={(m) => setFaviconMediaId(m.id)}
        />
        <input type="hidden" name="faviconMediaId" value={faviconMediaId ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="twitter">Twitter/X URL</Label>
        <Input id="twitter" name="twitter" defaultValue={defaultValues.socialLinks.twitter ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="facebook">Facebook URL</Label>
        <Input
          id="facebook"
          name="facebook"
          defaultValue={defaultValues.socialLinks.facebook ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram URL</Label>
        <Input
          id="instagram"
          name="instagram"
          defaultValue={defaultValues.socialLinks.instagram ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-muted-foreground">Saved.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
