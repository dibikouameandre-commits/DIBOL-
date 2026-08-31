import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getResumeDocumentResult } from "@/server/tools/resume-document";
import { resumeModeLabels } from "@/lib/validations/tools";
import { ResumeDocumentPreview } from "../../resume-document-preview";

export const metadata: Metadata = {
  title: "Ton résultat est prêt",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter un résultat déjà généré (même principe que les autres outils).
export default async function ResumeDocumentResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getResumeDocumentResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt · {resumeModeLabels[result.form.mode]}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ton résultat est prêt</h1>
        <p className="text-lg text-muted-foreground">Copie-le pour le réutiliser où tu veux.</p>
      </div>

      <ResumeDocumentPreview content={result.content} />
    </div>
  );
}
