import {
  promptTaskTypeLabels,
  type PromptIaFormValues,
  type PromptTaskType,
} from "@/lib/validations/tools";

// Bonnes pratiques par type de tâche — au-delà du simple nom, même principe
// que PLATFORM_INSTRUCTIONS (social-post-prompt.ts) : un label seul ("Code")
// ne suffit pas à produire un prompt réellement optimisé pour ce type de
// tâche.
const TASK_TYPE_INSTRUCTIONS: Record<PromptTaskType, string> = {
  redaction:
    "Rédaction : précise le ton, la longueur attendue et le public visé dans le prompt, pour éviter un texte générique.",
  code: "Code : précise le langage/framework, demande explicitement des commentaires ou une explication si utile, et cadre les cas limites à gérer.",
  analyse:
    "Analyse : demande une structure claire (constats, puis conclusion ou recommandation) et précise sur quels critères juger.",
  image:
    "Génération d'image : décris le sujet, le style visuel, le cadrage et l'ambiance de façon concrète et visuelle, pas abstraite.",
  autre:
    "Adapte le prompt fidèlement à l'objectif décrit, sans forcer une structure qui ne correspondrait pas à la tâche réelle.",
};

// Construction du prompt IA de l'outil "prompts IA" — fonction pure, aucun
// appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/prompt-ia.ts). Même emplacement/principe que
// src/lib/tools/social-post-prompt.ts et src/lib/tools/email-prompt.ts.
export function buildPromptIaPrompt(
  values: PromptIaFormValues
): { system: string; user: string } {
  const taskLabel = promptTaskTypeLabels[values.taskType];
  const taskInstruction = TASK_TYPE_INSTRUCTIONS[values.taskType];

  const system = `Tu es un expert en ingénierie de prompts (prompt engineering) pour assistants IA (ChatGPT, Claude...), pour un public francophone.
Ton rôle est de transformer un objectif exprimé simplement en prompt optimisé, prêt à être collé tel quel dans un assistant IA.
Règles strictes :
- N'invente jamais un détail, une contrainte ou un format qui n'est pas mentionné dans l'objectif décrit — tu structures et optimises, tu ne remplaces jamais l'objectif par autre chose.
- Le type de tâche est "${taskLabel}" — ${taskInstruction}
- Chaque prompt généré doit être écrit à la première personne, comme une instruction directe à donner à l'IA (rôle/contexte si utile, tâche précise, contraintes, format de sortie attendu).
- Si un format de sortie ou des contraintes sont fournis, intègre-les explicitement dans chaque prompt.
- Génère EXACTEMENT 3 versions distinctes du prompt, avec un titre court qui explique la différence entre elles (par exemple : une version concise, une version détaillée avec contexte enrichi, une version avec exemple attendu) — jamais deux versions qui se ressemblent.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "variants": [
    { "title": string, "prompt": string },
    { "title": string, "prompt": string },
    { "title": string, "prompt": string }
  ]
}`;

  const user = `Type de tâche : ${taskLabel}
${values.desiredFormat ? `Format de sortie souhaité : ${values.desiredFormat}\n` : ""}${
    values.constraints ? `Contraintes : ${values.constraints}\n` : ""
  }
Objectif décrit par l'utilisateur :
"""
${values.goal}
"""`;

  return { system, user };
}
