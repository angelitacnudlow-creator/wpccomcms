"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { createTerm, deleteTerm, type TermFormState } from "./actions";

const initialState: TermFormState = {};

export function TermList({
  taxonomyKey,
  terms,
}: {
  taxonomyKey: "category" | "tag";
  terms: { id: string; name: string; slug: string }[];
}) {
  const boundCreate = createTerm.bind(null, taxonomyKey);
  const [state, formAction, pending] = useActionState(boundCreate, initialState);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <Badge key={term.id} variant="secondary" className="gap-1 pr-1">
            {term.name}
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete "${term.name}"?`)) return;
                startTransition(async () => {
                  try {
                    await deleteTerm(term.id);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to delete");
                  }
                });
              }}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
              aria-label={`Delete ${term.name}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {terms.length === 0 && (
          <p className="text-sm text-muted-foreground">None yet.</p>
        )}
      </div>
      <form action={formAction} className="flex max-w-sm gap-2">
        <Input name="name" placeholder={`New ${taxonomyKey}`} required />
        <Button type="submit" disabled={pending}>
          Add
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
