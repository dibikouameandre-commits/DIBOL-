import type { EmailContent } from "@/lib/validations/tools";

// Premier gabarit de sortie (Étape 3) — une carte sobre imitant une fenêtre
// de composition d'e-mail, pas un document PDF : le résultat de cet outil
// est fait pour être copié dans un vrai client mail, pas téléchargé.
export function EmailPreview({ content }: { content: EmailContent }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
      <div className="border-b bg-neutral-50 px-5 py-3">
        <p className="text-xs text-neutral-500">Objet</p>
        <p className="font-semibold">{content.subject}</p>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5 text-sm leading-relaxed">
        <p>{content.greeting}</p>
        <p className="whitespace-pre-line">{content.body}</p>
        <div>
          <p>{content.closing}</p>
          <p className="font-semibold">{content.signatureName}</p>
          {content.signatureRole && (
            <p className="text-neutral-500">{content.signatureRole}</p>
          )}
        </div>
      </div>
    </div>
  );
}
