import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEmailResult } from "@/server/tools/email";
import { EmailPreview } from "../../email-preview";
import { CopyEmailButton } from "./copy-button";

export const metadata: Metadata = {
  title: "Ton e-mail est prêt",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter un e-mail déjà généré (même principe que le CV/la lettre/la
// facture-devis). Utile pour retrouver son e-mail depuis un autre appareil,
// ou le partager pour relecture avant envoi.
export default async function EmailResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getEmailResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ton e-mail est prêt</h1>
        <p className="text-lg text-muted-foreground">
          Copie-le et colle-le dans ton client mail habituel (Gmail, Outlook...).
        </p>
      </div>

      <div className="mb-8">
        <CopyEmailButton content={result.content} />
      </div>

      <EmailPreview content={result.content} />
    </div>
  );
}
