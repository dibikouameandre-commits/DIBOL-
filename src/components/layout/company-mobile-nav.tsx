"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function CompanyMobileNav({
  entreprise,
  isAuthenticated = false,
}: {
  entreprise: string;
  isAuthenticated?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const base = `/${entreprise}`;

  const nav = [
    { title: "Accueil", href: base },
    { title: "Boutique", href: `${base}/boutique` },
    { title: "Catégories", href: `${base}/categories` },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu />
        <span className="sr-only">Ouvrir le menu</span>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        {!isAuthenticated && (
          <div className="mt-4 flex flex-col gap-2 border-t px-4 pt-4">
            <Link
              href={`${base}/connexion`}
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full"
              )}
            >
              Connexion
            </Link>
            <Link
              href={`${base}/inscription`}
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Créer un compte
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
