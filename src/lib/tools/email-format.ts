import type { EmailContent } from "@/lib/validations/tools";

// Assemble l'e-mail généré en texte brut prêt à coller dans un client mail
// (Gmail, Outlook) ou une messagerie (WhatsApp Business...). Contrairement
// au CV/à la lettre/à la facture, cet outil ne produit pas de PDF — un
// e-mail se colle, il ne se télécharge pas. Utilisé à la fois pour le bouton
// "Copier l'e-mail" et pour l'aperçu.
export function formatEmailAsText(content: EmailContent): string {
  const signatureLines = [content.signatureName, content.signatureRole]
    .filter(Boolean)
    .join("\n");

  return [
    `Objet : ${content.subject}`,
    "",
    content.greeting,
    "",
    content.body,
    "",
    content.closing,
    signatureLines,
  ].join("\n");
}
