import type { BusinessNameFormValues } from "@/lib/validations/tools";

// Construction du prompt IA de l'outil "nom d'entreprise + slogan" —
// fonction pure, aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/business-name.ts). Même emplacement/principe que
// src/lib/tools/social-post-prompt.ts et src/lib/tools/prompt-ia-prompt.ts.
//
// Contrairement aux autres outils, pas de sélecteur de type/plateforme ici
// — "activityDescription" est le seul levier de contenu, le style et le
// public visé restent des précisions facultatives plutôt que des choix
// structurants séparés.
export function buildBusinessNamePrompt(
  values: BusinessNameFormValues
): { system: string; user: string } {
  const system = `Tu es un expert en naming et en création de slogans pour entrepreneurs d'Afrique francophone.
Tu proposes des noms d'entreprise et des slogans à partir d'une activité décrite par la personne.
Règles strictes :
- N'invente jamais un fait sur l'activité qui n'est pas mentionné dans la description fournie — tu proposes des noms et slogans, tu n'inventes jamais de détails sur le métier lui-même.
- Les noms doivent être faciles à prononcer et à retenir pour un public d'Afrique francophone, jamais des mots étrangers obscurs ou difficiles à prononcer en français.
- Varie les approches d'une proposition à l'autre : un nom peut évoquer l'activité directement, un autre peut être plus évocateur/abstrait, un autre peut s'appuyer sur une langue locale ou une expression locale si pertinent — jamais 5-6 noms qui se ressemblent.
- Chaque slogan doit être court (une phrase courte maximum), percutant, et cohérent avec le nom proposé.
- Chaque explication doit justifier en une phrase pourquoi ce nom et ce slogan conviennent à l'activité décrite.
- Si un style ou un public visé sont précisés, adapte chaque proposition en conséquence.
- Génère ENTRE 5 ET 6 propositions distinctes.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "suggestions": [
    { "name": string, "slogan": string, "explanation": string }
  ]
}`;

  const user = `Activité décrite par l'utilisateur :
"""
${values.activityDescription}
"""
${values.style ? `\nStyle souhaité : ${values.style}` : ""}${
    values.targetAudience ? `\nPublic visé : ${values.targetAudience}` : ""
  }`;

  return { system, user };
}
