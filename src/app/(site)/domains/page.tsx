import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { absoluteUrl } from "@/lib/site-url";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { DomainOrderForm } from "./domain-order-form";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Domain registration",
  alternates: { canonical: absoluteUrl("/domains") },
};

const FAQ_ITEMS = [
  {
    question: "Is there a live availability checker?",
    answer:
      "Not yet — orders land as pending registration and our team confirms availability and registers the domain manually.",
  },
  {
    question: "What free add-ons come with a domain?",
    answer: "Full DNS management is included free with every domain you register.",
  },
];

export default async function DomainsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tlds } = await supabase
    .from("domain_tlds")
    .select("id, tld, register_price_bdt, renewal_price_bdt")
    .eq("status", "published")
    .order("register_price_bdt");

  return (
    <div className="flex-1">
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-brand-navy sm:text-5xl">
          Register a <span className="text-brand-teal">Domain</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Enter the name you want below. We confirm availability and register it for you.
        </p>
      </section>

      <section className="bg-muted py-12">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading title="TLD" accent="Pricing" align="center" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(tlds ?? []).map((t) => (
              <div key={t.id} className="rounded-xl border bg-card p-4 text-center shadow-sm">
                <p className="font-display text-lg font-bold text-brand-navy">{t.tld}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBdt(t.register_price_bdt)}/yr
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Renew {formatBdt(t.renewal_price_bdt)}/yr
                </p>
              </div>
            ))}
            {(tlds ?? []).length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                No TLDs available yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <DomainOrderForm tlds={tlds ?? []} isLoggedIn={Boolean(user)} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked" accent="Questions" />
        <div className="mt-10">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}
