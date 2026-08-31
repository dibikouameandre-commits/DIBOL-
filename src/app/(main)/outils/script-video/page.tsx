import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { VideoScriptForm } from "./video-script-form";

export const metadata: Metadata = {
  title: "Créer un script vidéo pour TikTok, Reels ou Shorts gratuitement",
  description:
    "Décris le sujet de ta vidéo et reçois un script séquencé (texte + indications visuelles) pour TikTok, Instagram Reels ou YouTube Shorts. Gratuit, en français.",
};

export default async function ScriptVideoPage() {
  const quota = await getToolQuotaStatus("script-video");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/script-video/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes scripts précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Script vidéo réseaux sociaux</h1>
        <p className="text-lg text-muted-foreground">
          Décris ton sujet, l&apos;IA rédige un script séquencé (texte à dire + indication visuelle)
          pour TikTok, Reels ou Shorts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ta vidéo</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoScriptForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
