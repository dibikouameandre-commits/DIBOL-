import {
  contratTypeLabels,
  CONTRAT_PARTY_ROLES,
  type ContratFormValues,
} from "@/lib/validations/tools";
import { formatFactureAmount } from "@/lib/tools/facture-calc";

// Instructions par type de contrat — le vocabulaire et les obligations de
// base diffèrent entre une prestation de service et une location.
const TYPE_INSTRUCTIONS: Record<string, string> = {
  "prestation-service":
    "Contrat de prestation de service : le Prestataire s'engage à réaliser la prestation décrite pour le Client, contre le prix convenu. Les obligations de base couvrent la réalisation de la prestation dans les règles de l'art, et le paiement par le Client selon les modalités convenues.",
  location:
    "Contrat de location : le Bailleur met à disposition le bien décrit au Locataire, contre le loyer convenu. Les obligations de base couvrent la mise à disposition du bien en bon état, son usage normal par le Locataire, et le paiement du loyer selon les modalités convenues.",
};

// Construction du prompt IA de l'outil "contrat simple" — fonction pure,
// aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/contrat.ts). Même emplacement/principe que les autres
// outils.
//
// Périmètre volontairement restreint et non négociable par le prompt :
// uniquement les 5 clauses de base validées, jamais de clause juridique
// complexe (pénalités, propriété intellectuelle, non-concurrence,
// arbitrage...) — le disclaimer juridique est ajouté séparément, de façon
// déterministe, dans le template PDF (voir contrat-pdf.tsx), jamais généré
// par l'IA elle-même.
export function buildContratPrompt(values: ContratFormValues): { system: string; user: string } {
  const typeLabel = contratTypeLabels[values.contratType];
  const typeInstruction = TYPE_INSTRUCTIONS[values.contratType];
  const roles = CONTRAT_PARTY_ROLES[values.contratType];
  const formattedAmount = formatFactureAmount(values.amount, values.currency);

  const system = `Tu rédiges le corps d'un contrat simple et générique en français, pour des indépendants et particuliers d'Afrique francophone.
Règles strictes et non négociables :
- N'invente JAMAIS un fait, un montant, une date ou une obligation qui n'est pas mentionné dans les informations fournies.
- Rédige UNIQUEMENT les clauses de base suivantes, dans cet ordre : Objet, Durée, Prix et modalités de paiement, Obligations des parties, Résiliation. N'ajoute JAMAIS d'autre clause (pas de pénalités, pas de clause de non-concurrence, pas de propriété intellectuelle, pas d'arbitrage, pas de clause pénale) — ce contrat doit rester volontairement simple.
- Type de contrat : "${typeLabel}" — ${typeInstruction}
- Utilise "${roles.partyA}" et "${roles.partyB}" pour désigner les parties dans le texte des clauses, jamais leurs noms propres (déjà indiqués ailleurs dans le document).
- Reprends le montant EXACTEMENT tel qu'il est écrit ci-dessous (« ${formattedAmount} ») dans la clause "Prix et modalités de paiement", sans le reformater ni le réécrire différemment.
- Le ton est neutre, formel, juridique simple — sans jargon excessif.
- "preamble" est une phrase d'introduction courte rappelant l'objet général du contrat.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "preamble": string,
  "clauses": [
    { "title": "Objet", "text": string },
    { "title": "Durée", "text": string },
    { "title": "Prix et modalités de paiement", "text": string },
    { "title": "Obligations des parties", "text": string },
    { "title": "Résiliation", "text": string }
  ]
}`;

  const user = `Type de contrat : ${typeLabel}
${roles.partyA} : ${values.partyAName}
${roles.partyB} : ${values.partyBName}
Montant : ${formattedAmount}
Durée : ${values.duration}

Objet du contrat décrit par l'utilisateur :
"""
${values.objet}
"""`;

  return { system, user };
}
