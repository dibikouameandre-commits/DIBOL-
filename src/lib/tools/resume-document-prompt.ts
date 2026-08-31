import {
  resumeModeLabels,
  type ResumeDocumentFormValues,
  type ResumeMode,
} from "@/lib/validations/tools";

// Instructions par mode — au-delà du simple nom, même principe que
// TASK_TYPE_INSTRUCTIONS (prompt-ia-prompt.ts) : un label seul ("Résumé
// court") ne suffit pas à produire le bon niveau de condensation.
const MODE_INSTRUCTIONS: Record<ResumeMode, string> = {
  "resume-court":
    "Résumé COURT : 3 à 5 phrases maximum, uniquement les points essentiels — l'idée centrale et les conclusions ou décisions clés, rien d'accessoire.",
  "resume-detaille":
    "Résumé DÉTAILLÉ : plus long qu'un résumé court, conserve tous les points importants et la structure logique du texte d'origine, mais reste nettement plus court que le texte source.",
  reformulation:
    "Reformulation : garde une longueur et un niveau de détail équivalents au texte d'origine — aucune information n'est supprimée ni ajoutée, seule la formulation change (plus clair, mieux structuré, sans jargon inutile).",
};

// Construction du prompt IA de l'outil "résumé / reformulation" — fonction
// pure, aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/resume-document.ts). Même emplacement/principe que les
// autres outils.
export function buildResumeDocumentPrompt(
  values: ResumeDocumentFormValues
): { system: string; user: string } {
  const modeLabel = resumeModeLabels[values.mode];
  const modeInstruction = MODE_INSTRUCTIONS[values.mode];

  const system = `Tu es un assistant de rédaction qui aide des étudiants et des professionnels francophones à condenser ou reformuler un texte.
Règles strictes :
- N'invente jamais un fait, un chiffre ou une idée absente du texte fourni.
- En mode résumé (court ou détaillé) : ne garde que ce qui est réellement dans le texte, ne complète jamais avec des connaissances extérieures.
- En mode reformulation : ne supprime et n'ajoute AUCUNE information — seule la formulation change.
- Mode demandé : "${modeLabel}" — ${modeInstruction}
- Écris dans la même langue que le texte source.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{ "result": string }`;

  const user = `Texte source :
"""
${values.sourceText}
"""`;

  return { system, user };
}
