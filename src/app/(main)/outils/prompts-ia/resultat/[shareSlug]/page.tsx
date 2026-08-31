import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPromptIaResult } from "@/server/tools/prompt-ia";
import { promptTaskTypeLabels } from "@/lib/validations/tools";
import { PromptIaPreview } from "../../prompt-ia-preview";

export const metadata: Metadata = {
  title: "Tes prompts sont prêts",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter des prompts déjà générés (même principe que le CV/la lettre/la
// facture-devis/l'e-mail/les posts réseaux sociaux).
export default async function PromptIaResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getPromptIaResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt · {promptTaskTypeLabels[result.form.taskType]}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tes prompts sont prêts</h1>
        <p className="text-lg text-muted-foreground">
          Copie la version de ton choix et colle-la directement dans ton assistant IA.
        </p>
      </div>

      <PromptIaPreview content={result.content} />
    </div>
  );
}
