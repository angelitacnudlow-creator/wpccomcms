import Link from "next/link";
import { Cloud, Search } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { SiteMobileNav } from "@/components/site-mobile-nav";
import { logout } from "@/app/(site)/(auth)/actions";

type NavItem = { id: string; label: string; url: string };

export function SiteHeader({
  siteName,
  headerItems,
  isLoggedIn,
}: {
  siteName: string;
  headerItems: NavItem[];
  isLoggedIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-brand-navy">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-teal text-brand-teal-foreground">
            <Cloud className="size-5" />
          </span>
          {siteName}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium md:flex">
          {headerItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="text-muted-foreground transition-colors hover:text-brand-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hidden md:inline-flex")}
          >
            <Search className="size-4" />
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <>
                <Link href="/account" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  My account
                </Link>
                <form action={logout}>
                  <Button variant="ghost" size="sm" type="submit">
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-brand-teal text-brand-teal-foreground hover:bg-brand-teal/90",
                )}
              >
                Log in
              </Link>
            )}
            <Link href="/hosting" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View Plans
            </Link>
          </div>

          <SiteMobileNav navItems={headerItems} isLoggedIn={isLoggedIn} logoutAction={logout} />
        </div>
      </div>
    </header>
  );
}
