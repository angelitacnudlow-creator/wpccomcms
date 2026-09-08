"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia, type MediaFormState } from "./actions";

const initialState: MediaFormState = {};

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadMedia, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="file">Image</Label>
        <Input id="file" name="file" type="file" accept="image/*" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="altText">Alt text</Label>
        <Input id="altText" name="altText" placeholder="Describes the image" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
