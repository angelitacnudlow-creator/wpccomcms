"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBdt } from "@/lib/money";
import {
  createDomainTld,
  deleteDomainTld,
  toggleDomainTldStatus,
  type DomainTldFormState,
} from "./actions";

type TldRow = {
  id: string;
  tld: string;
  register_price_bdt: number;
  renewal_price_bdt: number;
  status: string;
};

const initialState: DomainTldFormState = {};

export function TldManager({ tlds }: { tlds: TldRow[] }) {
  const [state, formAction, pending] = useActionState(createDomainTld, initialState);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="max-w-2xl space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TLD</TableHead>
            <TableHead>Register (৳/yr)</TableHead>
            <TableHead>Renew (৳/yr)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tlds.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-mono">{t.tld}</TableCell>
              <TableCell>{formatBdt(t.register_price_bdt)}</TableCell>
              <TableCell>{formatBdt(t.renewal_price_bdt)}</TableCell>
              <TableCell>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() =>
                      toggleDomainTldStatus(t.id, t.status === "published" ? "draft" : "published"),
                    )
                  }
                >
                  <Badge variant={t.status === "published" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                </button>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    if (!confirm(`Delete ${t.tld}?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteDomainTld(t.id);
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
          {tlds.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No TLDs yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="tld">TLD</Label>
          <Input id="tld" name="tld" placeholder=".com" className="w-28" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="registerPrice">Register price (৳/yr)</Label>
          <Input
            id="registerPrice"
            name="registerPrice"
            type="number"
            min={0}
            step="0.01"
            className="w-36"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="renewalPrice">Renewal price (৳/yr)</Label>
          <Input
            id="renewalPrice"
            name="renewalPrice"
            type="number"
            min={0}
            step="0.01"
            className="w-36"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          Add TLD
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.fieldErrors?.tld && (
        <p className="text-sm text-destructive">{state.fieldErrors.tld[0]}</p>
      )}
    </div>
  );
}
