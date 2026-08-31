import type { SocialPostVariant } from "@/lib/validations/tools";

// Assemble une variante de post en texte brut prêt à coller dans l'app du
// réseau social visé. Comme l'e-mail, cet outil ne produit pas de PDF — un
// post se colle, il ne se télécharge pas.
export function formatSocialPostVariantAsText(variant: SocialPostVariant): string {
  if (!variant.hashtags || variant.hashtags.length === 0) return variant.text;

  const hashtagLine = variant.hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");

  return `${variant.text}\n\n${hashtagLine}`;
}
