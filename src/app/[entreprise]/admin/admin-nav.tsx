"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function CompanyAdminNav({ entreprise }: { entreprise: string }) {
  const pathname = usePathname();
  const base = `/${entreprise}/admin`;

  const items = [
    { href: base, label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
    { href: `${base}/produits`, label: "Produits", icon: Package },
    { href: `${base}/categories`, label: "Catégories", icon: FolderTree },
    { href: `${base}/commandes`, label: "Commandes", icon: ShoppingCart },
    { href: `${base}/utilisateurs`, label: "Utilisateurs", icon: Users },
    { href: `${base}/statistiques`, label: "Statistiques", icon: BarChart3 },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
