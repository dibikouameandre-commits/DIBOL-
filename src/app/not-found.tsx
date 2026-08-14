import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-6" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Page introuvable</h1>
      <p className="max-w-sm text-muted-foreground">
        La page que tu cherches n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-2 flex gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Retour à l&apos;accueil
        </Link>
        <Link href="/boutique" className={cn(buttonVariants({ variant: "outline" }))}>
          Voir la boutique
        </Link>
      </div>
    </div>
  );
}
