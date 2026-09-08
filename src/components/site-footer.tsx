import Link from "next/link";
import { Cloud } from "lucide-react";

type NavItem = { id: string; label: string; url: string };

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Hosting & Domains",
    links: [
      { label: "Hosting plans", href: "/hosting" },
      { label: "Register a domain", href: "/domains" },
    ],
  },
  {
    title: "Content",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My account", href: "/account" },
      { label: "Log in", href: "/login" },
    ],
  },
];

export function SiteFooter({
  siteName,
  footerItems,
}: {
  siteName: string;
  footerItems: NavItem[];
}) {
  return (
    <footer className="border-t bg-brand-navy text-brand-navy-foreground">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-teal text-brand-teal-foreground">
                <Cloud className="size-5" />
              </span>
              {siteName}
            </Link>
            <p className="mt-3 text-sm text-brand-navy-foreground/70">
              Blogs, shops, and hosting &amp; domains — one platform, one dashboard.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold text-brand-teal">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-navy-foreground/70 hover:text-brand-navy-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {footerItems.length > 0 && (
            <div>
              <h3 className="font-display text-sm font-semibold text-brand-teal">More</h3>
              <ul className="mt-3 space-y-2">
                {footerItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.url}
                      className="text-sm text-brand-navy-foreground/70 hover:text-brand-navy-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-brand-navy-foreground/10 pt-6 text-sm text-brand-navy-foreground/60">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
