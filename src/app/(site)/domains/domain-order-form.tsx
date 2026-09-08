"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orderDomainCod, type DomainOrderState } from "@/lib/checkout/domain-actions";
import { formatBdt } from "@/lib/money";

type Tld = { id: string; tld: string; register_price_bdt: number };

const initialState: DomainOrderState = {};

export function DomainOrderForm({ tlds, isLoggedIn }: { tlds: Tld[]; isLoggedIn: boolean }) {
  const [state, formAction, pending] = useActionState(orderDomainCod, initialState);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login?next=/domains" className="underline">
          Log in
        </Link>{" "}
        to register a domain.
      </p>
    );
  }

  if (tlds.length === 0) {
    return <p className="text-sm text-muted-foreground">No TLDs available yet.</p>;
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domainName">Domain name</Label>
        <div className="flex items-center gap-2">
          <Input id="domainName" name="domainName" placeholder="mybusiness" required />
          <Select
            name="tldId"
            defaultValue={tlds[0].id}
            items={tlds.map((t) => ({
              value: t.id,
              label: `${t.tld} — ${formatBdt(t.register_price_bdt)}/yr`,
            }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tlds.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.tld} — {formatBdt(t.register_price_bdt)}/yr
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {state.fieldErrors?.domainName && (
          <p className="text-sm text-destructive">{state.fieldErrors.domainName[0]}</p>
        )}
        {state.fieldErrors?.tldId && (
          <p className="text-sm text-destructive">{state.fieldErrors.tldId[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="termYears">Registration length</Label>
        <Select
          name="termYears"
          defaultValue="1"
          items={[1, 2, 3, 5, 10].map((y) => ({
            value: String(y),
            label: `${y} year${y > 1 ? "s" : ""}`,
          }))}
        >
          <SelectTrigger id="termYears" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 5, 10].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y} year{y > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required />
        {state.fieldErrors?.phone && (
          <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        We&apos;ll confirm availability and register it for you — Cash on Delivery, pay once it&apos;s
        set up.
      </p>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-teal text-brand-teal-foreground hover:bg-brand-teal/90"
      >
        {pending ? "Submitting…" : "Order domain (Cash on Delivery)"}
      </Button>
    </form>
  );
}
