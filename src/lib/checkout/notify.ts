import { sendEmail } from "@/lib/email";
import { formatBdt } from "@/lib/money";
import type { CartLine } from "@/lib/cart/get-cart";

export async function sendOrderConfirmationEmail(params: {
  email: string;
  orderId: string;
  lines: CartLine[];
  totalBdt: number;
  paymentMethod: "cod" | "stripe_demo";
}) {
  const itemsHtml = params.lines
    .map(
      (l) =>
        `<li>${l.productName} (${l.variantName}) × ${l.quantity} — ${formatBdt(l.priceBdt * l.quantity)}</li>`,
    )
    .join("");

  await sendEmail({
    to: params.email,
    subject: "Order confirmation",
    html: `
      <p>Thanks for your order!</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: ${formatBdt(params.totalBdt)}</strong></p>
      <p>Payment method: ${params.paymentMethod === "cod" ? "Cash on Delivery" : "Card (Stripe demo)"}</p>
      <p>Order ID: ${params.orderId}</p>
    `,
  });
}
