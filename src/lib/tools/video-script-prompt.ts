import {
  videoPlatformLabels,
  videoDurationLabels,
  type VideoScriptFormValues,
  type VideoDuration,
} from "@/lib/validations/tools";

// Le nombre de séquences attendu dépend de la durée — un script de 15s ne
// peut pas raisonnablement contenir 6 séquences détaillées, ce serait trop
// rapide pour être suivi à l'écran.
const DURATION_INSTRUCTIONS: Record<VideoDuration, string> = {
  "15s": "Vidéo de 15 secondes : 3 séquences courtes maximum — accroche (0-3s), développement (3-11s), appel à l'action (11-15s). Va droit au but, chaque seconde compte.",
  "30s": "Vidéo de 30 secondes : 4 à 5 séquences — accroche (0-3s), puis 2 à 3 séquences de développement, puis appel à l'action final.",
  "60s": "Vidéo de 60 secondes : 5 à 8 séquences — accroche (0-3s), développement plus détaillé en plusieurs temps, puis appel à l'action final.",
};

// Construction du prompt IA de l'outil "script vidéo réseaux sociaux" —
// fonction pure, aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/video-script.ts). Même emplacement/principe que les
// autres outils.
export function buildVideoScriptPrompt(
  values: VideoScriptFormValues
): { system: string; user: string } {
  const platformLabel = videoPlatformLabels[values.platform];
  const durationLabel = videoDurationLabels[values.duration];
  const durationInstruction = DURATION_INSTRUCTIONS[values.duration];

  const system = `Tu es un scénariste spécialisé dans les vidéos courtes pour réseaux sociaux (${platformLabel}), pour des créateurs de contenu d'Afrique francophone.
Tu écris un script séquencé à partir du sujet décrit par la personne.
Règles strictes :
- N'invente jamais un fait, un produit, un prix ou un détail qui n'est pas mentionné dans le sujet décrit.
- Les 3 premières secondes sont l'accroche : elles doivent capter l'attention immédiatement (question, affirmation surprenante, ou visuel fort) — c'est le point le plus critique d'une vidéo courte, sans quoi le spectateur passe à la suivante.
- ${durationInstruction}
- Pour chaque séquence : "timing" indique la plage de temps (ex : "0-3s"), "spokenText" est le texte exact à dire à voix haute (naturel, oral, jamais écrit comme un texte formel), "visualCue" décrit brièvement ce qui doit se passer à l'écran à ce moment (plan, action, texte affiché...).
- La dernière séquence est toujours un appel à l'action clair (s'abonner, commenter, visiter un lien, acheter...) cohérent avec le sujet décrit.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "sequences": [
    { "timing": string, "spokenText": string, "visualCue": string }
  ]
}`;

  const user = `Plateforme : ${platformLabel}
Durée cible : ${durationLabel}

Sujet de la vidéo :
"""
${values.subject}
"""`;

  return { system, user };
}
