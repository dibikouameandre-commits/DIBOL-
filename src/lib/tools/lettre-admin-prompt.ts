import {
  lettreAdminTypeLabels,
  type LettreAdminFormValues,
} from "@/lib/validations/tools";

// Description de chaque type de lettre pour le modèle — au-delà du simple
// nom, même principe que TONE_INSTRUCTIONS dans email-prompt.ts : un label
// seul ("Démission") ne suffit pas à produire la bonne structure de lettre.
const TYPE_INSTRUCTIONS: Record<string, string> = {
  "demande-attestation":
    "la lettre demande la délivrance d'une attestation ou d'un document officiel — elle précise clairement le document demandé et l'usage prévu si mentionné, sur un ton respectueux et direct.",
  "demande-conge":
    "la lettre demande un congé — elle précise les dates concernées si elles sont données, la raison si elle est mentionnée, et reste courtoise et concise.",
  demission:
    "la lettre notifie une démission — elle est ferme et sans ambiguïté sur la décision, reste courtoise, et mentionne le préavis uniquement s'il est précisé dans la situation décrite.",
  resiliation:
    "la lettre notifie la résiliation d'un contrat, abonnement ou engagement — elle identifie clairement ce qui est résilié et la date d'effet si elle est donnée, sur un ton factuel et sans détour.",
  reclamation:
    "la lettre expose un problème ou un désaccord puis formule une demande claire (remboursement, correction, réponse...) — ferme mais toujours courtoise, jamais agressive.",
  "demande-rdv":
    "la lettre sollicite un rendez-vous — elle précise le motif et une disponibilité si elle est mentionnée, sur un ton respectueux.",
  autre:
    "la lettre s'adapte fidèlement à la situation décrite, sans forcer une structure qui ne correspondrait pas au motif réel.",
};

// Construction du prompt IA de l'outil lettre administrative — fonction
// pure, aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/lettre-admin.ts). Même emplacement/principe que
// src/lib/tools/email-prompt.ts et src/lib/tools/facture-calc.ts.
//
// Contrairement à l'e-mail, pas de sélecteur de ton : une lettre
// administrative reste uniformément formelle quel que soit son motif — le
// "type" est le seul levier structurel, exactement comme décidé et
// documenté pour cet outil.
export function buildLettreAdminPrompt(
  values: LettreAdminFormValues
): { system: string; user: string } {
  const typeLabel = lettreAdminTypeLabels[values.lettreType];
  const typeInstruction = TYPE_INSTRUCTIONS[values.lettreType] ?? TYPE_INSTRUCTIONS.autre;

  const system = `Tu es un rédacteur professionnel spécialisé dans la correspondance administrative en français, pour des particuliers et salariés d'Afrique francophone.
Tu rédiges une lettre administrative formelle, à partir de la situation décrite par la personne.
Règles strictes :
- N'invente jamais un fait, une date, un montant ou un détail qui n'est pas mentionné dans la situation décrite.
- Reformule et structure ce qui est décrit, tu ne remplaces jamais le contenu par autre chose.
- Le type de lettre est "${typeLabel}" — ${typeInstruction}
- Le registre est TOUJOURS soutenu et formel, quel que soit le type de lettre : vouvoiement, formules administratives classiques. Il n'y a pas de ton "au choix" ici.
- "paragraphs" contient entre 2 et 6 paragraphes courts et clairs (jamais un seul bloc de texte, jamais un roman) : le premier expose le motif, les suivants développent les faits utiles, le dernier formule la demande ou la conclusion.
- La formule d'appel ("greeting") utilise le nom du destinataire fourni (avec son titre s'il est mentionné), sinon une formule générique ("Madame, Monsieur,").
- L'objet ("subject") résume la lettre en une courte phrase (ex : "Objet : Demande d'attestation de travail").
- La formule de politesse ("closing") est une formule administrative classique adaptée au contexte (ex : "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.").
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "subject": string,
  "greeting": string,
  "paragraphs": string[],
  "closing": string,
  "signatureName": string
}`;

  const user = `Type de lettre : ${typeLabel}
Expéditeur : ${values.senderName}
Ville (pour la date) : ${values.city}
Destinataire : ${values.recipientName}

Situation décrite par l'expéditeur :
"""
${values.context}
"""`;

  return { system, user };
}
