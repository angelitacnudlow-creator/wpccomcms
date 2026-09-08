import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Rocket, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/money";
import { absoluteUrl } from "@/lib/site-url";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureIconCard } from "@/components/marketing/feature-icon-card";
import { PricingCard } from "@/components/marketing/pricing-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SupportCtaBand } from "@/components/marketing/support-cta-band";
import { AddToCartForm } from "@/app/(site)/shop/[slug]/add-to-cart-form";
import { getHostingPlans, hostingPlanFeatureLines } from "@/lib/hosting-plans";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

const FAQ_ITEMS = [
  {
    question: "How do I pay?",
    answer:
      "Cash on Delivery is the primary payment method for every order, including hosting and domains. A Stripe test-mode option is also available for demo purposes.",
  },
  {
    question: "How fast is a domain or hosting plan set up?",
    answer:
      "Orders land as pending — there's no instant automated provisioning yet, so our team registers the domain or sets up hosting manually and confirms with you once it's ready.",
  },
  {
    question: "Can I renew my hosting or domain later?",
    answer:
      "Yes — active services show up under My Account, where a Renew button generates a new order for the next billing cycle.",
  },
  {
    question: "Can I run a blog, a shop, and hosting on one account?",
    answer:
      "Yes, all three live under the same login: publish blog posts, sell physical products, and manage hosting/domain subscriptions from one dashboard.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tlds }, hostingPlans] = await Promise.all([
    supabase
      .from("domain_tlds")
      .select("id, tld, register_price_bdt")
      .eq("status", "published")
      .order("register_price_bdt")
      .limit(4),
    getHostingPlans(3),
  ]);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="font-display text-4xl font-bold text-brand-navy sm:text-5xl">
            Blogs, Shops &amp; <span className="text-brand-teal">Hosting</span> — One Platform
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Publish content, sell products, and run your own domain &amp; hosting business — all
            from a single dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/hosting"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-teal text-brand-teal-foreground hover:bg-brand-teal/90",
              )}
            >
              View Plans
            </Link>
            <Link href="/shop" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Shop products
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <HeroIllustration />
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureIconCard
            index={1}
            tone="teal"
            icon={ShieldCheck}
            title="Free SSL, every plan"
            description="Every hosting plan and domain ships with a free SSL certificate — no add-on required."
          />
          <FeatureIconCard
            index={2}
            tone="navy"
            icon={Globe}
            title="Full DNS management"
            description="Manage DNS records for every domain you register, right from your account."
          />
          <FeatureIconCard
            index={3}
            tone="teal"
            icon={Rocket}
            title="One dashboard for everything"
            description="Blog posts, shop orders, and hosting subscriptions all live under one login."
          />
        </div>
      </section>

      {/* Domain teaser */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading title="Domain Name" accent="Registration" subtitle="Real prices, no live checker — order and we confirm availability for you." />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(tlds ?? []).map((t) => (
              <div key={t.id} className="rounded-xl border bg-card p-4 text-center shadow-sm">
                <p className="font-display text-lg font-bold text-brand-navy">{t.tld}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatBdt(t.register_price_bdt)}/yr</p>
              </div>
            ))}
            {(tlds ?? []).length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                No TLDs published yet.
              </p>
            )}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/domains"
              className={cn(buttonVariants(), "bg-brand-teal text-brand-teal-foreground hover:bg-brand-teal/90")}
            >
              Register a domain
            </Link>
          </div>
        </div>
      </section>

      {/* Hosting plans preview */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeading eyebrow="Hosting" title="Get your business" accent="online today" subtitle="99% uptime, free SSL, and support on every plan." />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hostingPlans.map((plan, i) => (
            <PricingCard
              key={plan.id}
              name={plan.name}
              priceLabel={formatBdt(plan.base_price_bdt)}
              priceSuffix="starting"
              features={hostingPlanFeatureLines(plan.specs)}
              featured={i === 1 && hostingPlans.length > 1}
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
          {hostingPlans.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No hosting plans published yet.
            </p>
          )}
        </div>
        <div className="mt-8 text-center">
          <Link href="/hosting" className={buttonVariants({ variant: "outline" })}>
            View all plans
          </Link>
        </div>
      </section>

      {/* Support CTA */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <SupportCtaBand
          title="Questions before you order?"
          description="Reach out any time — we'll help you pick the right plan or troubleshoot an issue with your account."
          primaryHref="/search"
          primaryLabel="Search help"
          secondaryHref="/shop"
          secondaryLabel="Browse shop"
        />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked" accent="Questions" />
        <div className="mt-10">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 360 320" className="w-full max-w-sm" aria-hidden="true">
      <ellipse cx="180" cy="290" rx="140" ry="14" fill="var(--color-muted)" />
      <path
        d="M70 150c-22 0-40 17-40 39 0 21 18 39 40 39h200c24 0 44-20 44-44s-20-44-44-44c-4 0-8 .4-12 1.2C251 116 224 96 192 96c-38 0-70 26-79 62-4-1-8-1.5-13-1.5-1.4 0-2.7 0-4 .1z"
        fill="var(--color-brand-teal)"
        opacity="0.18"
      />
      <rect x="130" y="70" width="100" height="180" rx="10" fill="var(--color-brand-navy)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="142" y={84 + i * 40} width="76" height="28" rx="5" fill="var(--color-brand-teal)" />
          <circle cx="154" cy={98 + i * 40} r="3.5" fill="var(--color-brand-navy)" />
          <circle cx="164" cy={98 + i * 40} r="3.5" fill="var(--color-brand-navy)" opacity="0.5" />
          <rect x="178" y={95 + i * 40} width="28" height="6" rx="3" fill="var(--color-brand-navy)" opacity="0.5" />
        </g>
      ))}
      <path
        d="M60 100c8-14 26-14 34 0M280 90c8-14 26-14 34 0"
        stroke="var(--color-brand-navy)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
