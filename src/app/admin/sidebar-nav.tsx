"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  File,
  Image as ImageIcon,
  MessageSquare,
  Menu as MenuIcon,
  Tags,
  Package,
  ShoppingCart,
  Users,
  Inbox,
  Settings,
  Globe,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/pages", label: "Pages", icon: File },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
      { href: "/admin/menus", label: "Menus", icon: MenuIcon },
      { href: "/admin/taxonomies", label: "Categories & Tags", icon: Tags },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/domains", label: "Domain TLDs", icon: Globe },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/forms", label: "Form submissions", icon: Inbox },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="space-y-5">
      {NAV_GROUPS.map((group, i) => (
        <div key={group.title ?? i}>
          {group.title && (
            <p className="mb-1.5 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group.title}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              // Dashboard ("/admin") must match exactly; every other item
              // should also highlight on its own sub-routes (e.g. /admin/posts/new).
              const active =
                item.href === "/admin" ? pathname === item.href : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "border-l-primary bg-primary/8 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
