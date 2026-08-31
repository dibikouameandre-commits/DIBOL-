import {
  socialPlatformLabels,
  type SocialPostFormValues,
  type SocialPlatform,
} from "@/lib/validations/tools";

// Conventions d'écriture par réseau — au-delà du simple nom, même principe
// que TONE_INSTRUCTIONS (email-prompt.ts) / TYPE_INSTRUCTIONS
// (lettre-admin-prompt.ts) : un label seul ("Instagram") ne suffit pas à
// produire un post réellement adapté au format du réseau.
const PLATFORM_INSTRUCTIONS: Record<SocialPlatform, string> = {
  facebook:
    "Facebook : posts un peu plus longs possibles (2 à 4 phrases), ton chaleureux et narratif, peu ou pas d'émojis excessifs, 0 à 2 hashtags maximum à la fin.",
  instagram:
    "Instagram : texte court et percutant, accroche forte dès la première ligne, émojis pertinents utilisés avec parcimonie, 3 à 8 hashtags ciblés à la fin.",
  whatsapp:
    "Statut WhatsApp : très court (1 à 2 phrases maximum, style statut), ton direct et personnel comme un message à des contacts proches, AUCUN hashtag.",
  linkedin:
    "LinkedIn : ton professionnel et posé, pas d'émojis excessifs, phrases claires orientées valeur/bénéfice, 0 à 3 hashtags professionnels pertinents à la fin.",
};

// Construction du prompt IA de l'outil "posts réseaux sociaux" — fonction
// pure, aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/social-post.ts). Même emplacement/principe que
// src/lib/tools/email-prompt.ts et src/lib/tools/lettre-admin-prompt.ts.
export function buildSocialPostPrompt(
  values: SocialPostFormValues
): { system: string; user: string } {
  const platformLabel = socialPlatformLabels[values.platform];
  const platformInstruction = PLATFORM_INSTRUCTIONS[values.platform];

  const system = `Tu es un rédacteur spécialisé dans les publications pour réseaux sociaux, pour des petits commerces et créateurs de contenu d'Afrique francophone.
Tu rédiges des posts prêts à publier, à partir de ce que la personne décrit sur son activité, son produit ou son actualité.
Règles strictes :
- N'invente jamais un fait, un prix, une date ou un détail qui n'est pas mentionné dans la description fournie.
- Reformule et mets en valeur ce qui est décrit, tu ne remplaces jamais le contenu par autre chose.
- Le réseau ciblé est "${platformLabel}" — ${platformInstruction}
- Génère EXACTEMENT 3 variantes du post, chacune avec une accroche et un angle différents (par exemple : une variante orientée bénéfice client, une orientée urgence/offre limitée si pertinent, une orientée storytelling/proximité) — jamais deux variantes qui se ressemblent.
- Si un nom d'activité et/ou un appel à l'action sont fournis, intègre-les naturellement dans chaque variante.
- Les hashtags (si le réseau en utilise) doivent être pertinents pour le contenu décrit, jamais génériques ou sans rapport.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "variants": [
    { "text": string, "hashtags"?: string[] },
    { "text": string, "hashtags"?: string[] },
    { "text": string, "hashtags"?: string[] }
  ]
}`;

  const user = `Réseau ciblé : ${platformLabel}
${values.businessName ? `Nom de l'activité : ${values.businessName}\n` : ""}${
    values.callToAction ? `Appel à l'action souhaité : ${values.callToAction}\n` : ""
  }
Ce que la personne veut communiquer :
"""
${values.context}
"""`;

  return { system, user };
}
