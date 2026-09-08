import type { Metadata } from "next";
import { Cpu, ShieldCheck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { absoluteUrl } from "@/lib/site-url";
import { AddToCartForm } from "@/app/(site)/shop/[slug]/add-to-cart-form";
import { getHostingPlans, hostingPlanFeatureLines } from "@/lib/hosting-plans";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureIconCard } from "@/components/marketing/feature-icon-card";
import { PricingCard } from "@/components/marketing/pricing-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SupportCtaBand } from "@/components/marketing/support-cta-band";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hosting plans",
  alternates: { canonical: absoluteUrl("/hosting") },
};

const FAQ_ITEMS = [
  {
    question: "What happens right after I order a plan?",
    answer:
      "Your order lands as pending — we set the hosting account up manually and mark your subscription active once it's ready.",
  },
  {
    question: "Can I upgrade to a higher plan later?",
    answer: "Yes, order the higher plan any time and let us know — we'll migrate your data across.",
  },
  {
    question: "How do renewals work?",
    answer:
      "Active plans show up under My Account with a Renew button that creates a new order for the next billing cycle.",
  },
];

export default async function HostingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plans = await getHostingPlans();

  return (
    <div className="flex-1">
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-brand-navy sm:text-5xl">
          High-performance Hosting for Faster <span className="text-brand-teal">Websites</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          High-speed storage, free SSL, and full DNS management on every plan.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureIconCard
            tone="teal"
            icon={Zap}
            title="Lightning-fast hosting"
            description="SSD-backed storage keeps your site fast under real traffic."
          />
          <FeatureIconCard
            tone="navy"
            icon={ShieldCheck}
            title="Free SSL, every plan"
            description="Every plan ships with a free SSL certificate, no add-on required."
          />
          <FeatureIconCard
            tone="teal"
            icon={Cpu}
            title="Full control, zero hassle"
            description="Manage domains, email, and databases from one control panel."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12" id="plans">
        <SectionHeading title="Get your business" accent="online today" subtitle="99% uptime for rock-solid performance." />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              name={plan.name}
              priceLabel={formatBdt(plan.base_price_bdt)}
              priceSuffix="starting"
              features={hostingPlanFeatureLines(plan.specs)}
            >
              <AddToCartForm
                variants={plan.variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  priceBdt: v.price_bdt,
                  stock: v.stock,
                }))}
                isLoggedIn={Boolean(user)}
                productSlug={plan.slug}
              />
            </PricingCard>
          ))}
          {plans.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No hosting plans published yet.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <SupportCtaBand
          title="Our team is here to help"
          description="Reach out any time — support is included with every hosting plan."
          primaryHref="/search"
          primaryLabel="Search help"
        />
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked" accent="Questions" />
        <div className="mt-10">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}
