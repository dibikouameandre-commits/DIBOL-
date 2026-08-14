"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        Une erreur est survenue
      </h1>
      <p className="max-w-sm text-muted-foreground">
        Quelque chose s&apos;est mal passé. Tu peux réessayer ou revenir à
        l&apos;accueil.
      </p>
      <div className="mt-2 flex gap-3">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
