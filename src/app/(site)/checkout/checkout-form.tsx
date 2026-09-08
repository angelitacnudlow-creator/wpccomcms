"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeOrderCod, createStripeDemoSession, type CheckoutFormState } from "@/lib/checkout/actions";

const initialState: CheckoutFormState = {};

export function CheckoutForm({ stripeEnabled }: { stripeEnabled: boolean }) {
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe_demo">("cod");
  const action = paymentMethod === "cod" ? placeOrderCod : createStripeDemoSession;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required />
        {state.fieldErrors?.phone && (
          <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="line1">Address</Label>
        <Input id="line1" name="line1" required />
        {state.fieldErrors?.line1 && (
          <p className="text-sm text-destructive">{state.fieldErrors.line1[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input id="line2" name="line2" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" required />
        {state.fieldErrors?.city && (
          <p className="text-sm text-destructive">{state.fieldErrors.city[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Payment method</Label>
        <div className="space-y-2 rounded-lg border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="_paymentMethodPicker"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            Cash on Delivery
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="_paymentMethodPicker"
              checked={paymentMethod === "stripe_demo"}
              onChange={() => setPaymentMethod("stripe_demo")}
              disabled={!stripeEnabled}
            />
            Card (Stripe demo — test mode, not a real charge)
            {!stripeEnabled && " — not configured yet"}
          </label>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Placing order…"
          : paymentMethod === "cod"
            ? "Place order (Cash on Delivery)"
            : "Continue to Stripe (demo)"}
      </Button>
    </form>
  );
}
