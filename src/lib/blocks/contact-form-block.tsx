"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm, type ContactFormState } from "./contact-form-actions";

const initialState: ContactFormState = {};

export function ContactFormBlockView() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);

  if (state.ok) {
    return <p className="rounded-md border bg-muted p-4 text-sm">Thanks — we&apos;ll be in touch.</p>;
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {/* Honeypot: hidden from real users, bots tend to fill every field. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="space-y-2">
        <Label htmlFor="cf-name">Name</Label>
        <Input id="cf-name" name="name" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-email">Email</Label>
        <Input id="cf-email" name="email" type="email" required />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf-message">Message</Label>
        <Textarea id="cf-message" name="message" rows={4} required />
        {state.fieldErrors?.message && (
          <p className="text-sm text-destructive">{state.fieldErrors.message[0]}</p>
        )}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
