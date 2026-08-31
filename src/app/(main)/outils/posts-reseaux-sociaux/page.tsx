import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { SocialPostForm } from "./social-post-form";

export const metadata: Metadata = {
  title: "Créer des posts pour réseaux sociaux gratuitement",
  description:
    "Génère 3 variantes de post pour Facebook, Instagram, LinkedIn ou WhatsApp en quelques minutes grâce à l'IA. Gratuit, en français.",
};

export default async function PostsReseauxSociauxPage() {
  const quota = await getToolQuotaStatus("posts-reseaux-sociaux");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/posts-reseaux-sociaux/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes posts précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Générateur de posts réseaux sociaux
        </h1>
        <p className="text-lg text-muted-foreground">
          Décris ton produit ou ton actualité, l&apos;IA rédige 3 variantes de post adaptées au
          réseau choisi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tes informations</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialPostForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
