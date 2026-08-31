import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getN8nWorkflowResult } from "@/server/tools/n8n-workflow";
import { n8nTriggerTypeLabels } from "@/lib/validations/tools";
import { N8nWorkflowPreview } from "../../n8n-workflow-preview";

export const metadata: Metadata = {
  title: "Ton workflow n8n est prêt",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter un workflow déjà généré (même principe que les autres outils).
export default async function N8nWorkflowResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getN8nWorkflowResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt · {n8nTriggerTypeLabels[result.form.triggerType]}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ton workflow n8n est prêt</h1>
        <p className="text-lg text-muted-foreground">
          Télécharge le fichier .json et importe-le dans ton instance n8n.
        </p>
      </div>

      <N8nWorkflowPreview content={result.content} />
    </div>
  );
}
