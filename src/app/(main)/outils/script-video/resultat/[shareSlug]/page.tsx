import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getVideoScriptResult } from "@/server/tools/video-script";
import { videoPlatformLabels } from "@/lib/validations/tools";
import { VideoScriptPreview } from "../../video-script-preview";

export const metadata: Metadata = {
  title: "Ton script vidéo est prêt",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter un script déjà généré (même principe que les autres outils).
export default async function VideoScriptResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getVideoScriptResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt · {videoPlatformLabels[result.form.platform]}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ton script vidéo est prêt</h1>
        <p className="text-lg text-muted-foreground">
          Copie-le pour préparer ton tournage.
        </p>
      </div>

      <VideoScriptPreview content={result.content} />
    </div>
  );
}
