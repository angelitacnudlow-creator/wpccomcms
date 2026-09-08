"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createRedirect, deleteRedirect, type RedirectFormState } from "./actions";

const initialState: RedirectFormState = {};

export function RedirectsManager({
  redirects,
}: {
  redirects: { id: string; from_path: string; to_path: string; status_code: number }[];
}) {
  const [state, formAction, pending] = useActionState(createRedirect, initialState);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="max-w-2xl space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {redirects.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm">{r.from_path}</TableCell>
              <TableCell className="font-mono text-sm">{r.to_path}</TableCell>
              <TableCell>{r.status_code}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    if (!confirm(`Delete redirect from ${r.from_path}?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteRedirect(r.id);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to delete");
                      }
                    });
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {redirects.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No redirects yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label htmlFor="fromPath" className="text-xs text-muted-foreground">
            From
          </label>
          <Input id="fromPath" name="fromPath" placeholder="/old-page" className="w-40" required />
        </div>
        <div className="space-y-1">
          <label htmlFor="toPath" className="text-xs text-muted-foreground">
            To
          </label>
          <Input id="toPath" name="toPath" placeholder="/new-page" className="w-40" required />
        </div>
        <input type="hidden" name="statusCode" value="301" />
        <Button type="submit" disabled={pending}>
          Add redirect
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
