import Stripe from "stripe";

export const STRIPE_ENABLED = Boolean(process.env.STRIPE_SECRET_KEY);

// Stripe doesn't support BDT as a presentment currency, so the demo
// checkout path converts to USD at a fixed illustrative rate purely so the
// online-payment UX can be demoed end to end — this is not a real FX rate
// and this path never represents a live charge (see MASTER_PROMPT.md §7).
export const DEMO_BDT_TO_USD_RATE = 110;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!STRIPE_ENABLED) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY is empty)");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}
