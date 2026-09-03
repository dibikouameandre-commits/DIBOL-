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
import { siteConfig } from "@/config/site";

export function MobileNav({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const [open, setOpen] = useState(false);

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
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              D
            </span>
            {siteConfig.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {siteConfig.nav.map((item) => (
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
              href="/connexion"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full"
              )}
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
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
