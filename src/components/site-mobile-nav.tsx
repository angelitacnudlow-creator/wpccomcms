"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";

type NavItem = { id: string; label: string; url: string };

export function SiteMobileNav({
  navItems,
  isLoggedIn,
  logoutAction,
}: {
  navItems: NavItem[];
  isLoggedIn: boolean;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />
        }
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-brand-navy/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 top-0 z-50 origin-top rounded-b-2xl bg-background p-6 shadow-xl duration-150",
            "data-open:animate-in data-open:slide-in-from-top-4 data-open:fade-in-0",
            "data-closed:animate-out data-closed:slide-out-to-top-4 data-closed:fade-out-0",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-brand-navy">Menu</span>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon" aria-label="Close menu" />}
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-2 border-t pt-6">
            {isLoggedIn ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  My account
                </Link>
                <form action={logoutAction}>
                  <Button variant="ghost" type="submit" className="w-full">
                    Log out
                  </Button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants(),
                  "w-full bg-brand-teal text-brand-teal-foreground hover:bg-brand-teal/90",
                )}
              >
                Log in
              </Link>
            )}
            <Link
              href="/hosting"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              View Plans
            </Link>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
