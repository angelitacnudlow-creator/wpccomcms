"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  message: z.string().trim().min(1, "Message is required"),
});

export type ContactFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Public form — no auth required. Honeypot field catches simple bots.
  if (String(formData.get("company") ?? "").length > 0) {
    return { ok: true };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("form_submissions").insert({
    form_key: "contact",
    data: parsed.data,
  });
  if (error) {
    return { error: "Something went wrong. Please try again." };
  }

  await notifyAdminsOfSubmission(parsed.data);

  return { ok: true };
}

// Best-effort — a failure here should never surface as a failed form
// submission, since the submission itself already saved successfully.
async function notifyAdminsOfSubmission(data: z.infer<typeof contactSchema>) {
  try {
    const admin = createAdminClient();
    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin").limit(1);
    const adminId = admins?.[0]?.id;
    if (!adminId) return;

    const { data: authUser } = await admin.auth.admin.getUserById(adminId);
    if (!authUser?.user?.email) return;

    await sendEmail({
      to: authUser.user.email,
      subject: "New contact form submission",
      html: `<p><strong>${data.name}</strong> (${data.email}) wrote:</p><p>${data.message}</p>`,
    });
  } catch (err) {
    console.error("notifyAdminsOfSubmission failed:", err);
  }
}
