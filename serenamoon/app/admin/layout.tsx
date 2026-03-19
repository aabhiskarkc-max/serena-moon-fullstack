"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/views", label: "Views" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/likes", label: "Likes" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/ebooks", label: "Ebooks" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r bg-muted/40">
        <div className="px-4 py-4 border-b">
          <h1 className="text-lg font-semibold tracking-tight">Admin</h1>
          <p className="text-xs text-muted-foreground">
            SerenaMoon control panel
          </p>
        </div>
        <nav className="mt-4 space-y-1 px-2">
          {sidebarItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
