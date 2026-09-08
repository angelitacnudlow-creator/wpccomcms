import { Resend } from "resend";

export const EMAIL_ENABLED = Boolean(process.env.RESEND_API_KEY);

// No real domain is verified with Resend yet (local-first — see
// MASTER_PROMPT.md §12), so this stays the sandbox "onboarding" sender
// until a real FROM address is configured alongside a verified domain.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
}

// Every caller already works fully without email (orders/comments/forms all
// save to the DB regardless) — sendEmail silently no-ops when unconfigured
// rather than failing the request it's called from.
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!EMAIL_ENABLED) return { skipped: true as const };

  try {
    await getClient().emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { skipped: false as const };
  } catch (err) {
    console.error("sendEmail failed:", err);
    return { skipped: false as const, error: err };
  }
}
