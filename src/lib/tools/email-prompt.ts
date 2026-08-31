import {
  emailTypeLabels,
  emailToneLabels,
  type EmailFormValues,
  type EmailTone,
} from "@/lib/validations/tools";

// Description de chaque ton pour le modèle — au-delà du simple nom, sinon
// "Ferme" ou "Chaleureux" restent trop abstraits pour produire une vraie
// différence de rédaction (vérifié à l'Étape 4 : un simple label ne suffit
// pas, il faut expliciter ce que chaque registre implique concrètement).
const TONE_INSTRUCTIONS: Record<EmailTone, string> = {
  formel: "registre très soutenu et protocolaire, vouvoiement appuyé, formules classiques (« Je vous prie de bien vouloir... », « J'ai l'honneur de... »).",
  neutre: "registre professionnel standard, poli et direct, sans effet de style particulier ni familiarité.",
  chaleureux: "ton bienveillant et humain tout en restant professionnel — chaleureux sans jamais devenir familier.",
  ferme: "ton direct et sans ambiguïté qui exprime clairement l'attente ou le mécontentement, tout en restant courtois et jamais agressif ni menaçant.",
};

// Construction du prompt IA de l'outil e-mail — fonction pure, aucun appel
// réseau ici (l'appel OpenAI réel arrive à l'Étape 3, dans
// src/server/tools/email.ts). Vit dans src/lib/tools/ plutôt que
// src/server/tools/ pour rester testable isolément avec un simple script,
// même principe que src/lib/tools/facture-calc.ts.
//
// Règles calquées sur src/server/tools/cv.ts / letter.ts : ne jamais
// inventer un fait absent de la situation décrite par l'utilisateur, la
// réponse doit être un JSON strict correspondant à emailContentSchema.
export function buildEmailPrompt(values: EmailFormValues): { system: string; user: string } {
  const typeLabel = emailTypeLabels[values.emailType];
  const toneLabel = emailToneLabels[values.tone];
  const toneInstruction = TONE_INSTRUCTIONS[values.tone];

  const system = `Tu es un rédacteur professionnel spécialisé dans la correspondance en français, pour des salariés et indépendants d'Afrique francophone.
Tu rédiges un e-mail professionnel clair et efficace, à partir de la situation décrite par la personne.
Règles strictes :
- N'invente jamais un fait, un montant, une date ou un détail qui n'est pas mentionné dans la situation décrite. Par exemple, si aucune date de relance précédente n'est donnée, n'en invente pas une.
- Reformule et structure ce qui est décrit, tu ne remplaces jamais le contenu par autre chose.
- Le type d'e-mail est "${typeLabel}" — adapte la structure en conséquence (une réclamation expose le problème puis la demande, un remerciement reste bref, une demande reste directe et respectueuse).
- Le ton à adopter est "${toneLabel}" : ${toneInstruction} Ce ton doit se sentir nettement dans le choix des mots et des formules, pas seulement dans la formule d'appel ou de politesse — il doit imprégner tout le corps du message.
- Le corps ("body") va à l'essentiel, jamais un roman — quelques phrases claires suffisent pour la plupart des e-mails professionnels.
- La formule d'appel ("greeting") utilise le nom du destinataire si fourni, sinon une formule générique ("Madame, Monsieur,").
- La formule de politesse ("closing") est adaptée au ton demandé (ex : "Cordialement," en registre neutre, "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées," en registre formel).
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "subject": string,
  "greeting": string,
  "body": string,
  "closing": string,
  "signatureName": string,
  "signatureRole"?: string
}`;

  const user = `Type d'e-mail : ${typeLabel}
Ton souhaité : ${toneLabel}
Expéditeur : ${values.senderName}${values.senderRole ? ` (${values.senderRole})` : ""}
Destinataire : ${values.recipientName ?? "non précisé"}${
    values.recipientCompany ? ` — ${values.recipientCompany}` : ""
  }

Situation décrite par l'expéditeur :
"""
${values.context}
"""`;

  return { system, user };
}
