import {
  Calculator,
  FileSearch,
  FileSignature,
  FileText,
  FileUser,
  Lightbulb,
  Mail,
  Receipt,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  Video,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Registry of DIBOL AI's free tools — adding a new tool means adding an
// entry here (plus its own page + server function), never a migration.
// ToolRun.toolSlug references `slug` below as a plain string, not a
// foreign key, on purpose (see prisma/schema.prisma).

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: string;
  // Purely visual (card icon on /outils) — never read by any tool's
  // generation/history/quota logic, safe to change freely.
  icon: LucideIcon;
  // Free generations per anonId/IP per rolling 24h, before asking for an
  // account (higher limit) or premium (unlimited) — see src/lib/rate-limit.ts.
  dailyFreeLimit: number;
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: "generateur-cv",
    name: "Générateur de CV",
    description:
      "Crée un CV clair et professionnel en quelques minutes, sans carte bancaire.",
    category: "Emploi",
    icon: FileUser,
    dailyFreeLimit: 3,
  },
  {
    slug: "lettre-motivation",
    name: "Générateur de lettre de motivation",
    description:
      "Rédige une lettre de motivation adaptée à l'offre visée, prête à envoyer.",
    category: "Emploi",
    icon: Send,
    dailyFreeLimit: 3,
  },
  {
    slug: "facture-devis",
    name: "Générateur de facture / devis",
    description:
      "Crée une facture ou un devis professionnel avec calcul automatique des totaux.",
    category: "Gestion",
    icon: Receipt,
    dailyFreeLimit: 3,
  },
  {
    slug: "email-professionnel",
    name: "Générateur d'e-mail professionnel",
    description:
      "Rédige un e-mail professionnel (relance, réclamation, demande...) prêt à envoyer.",
    category: "Gestion",
    icon: Mail,
    dailyFreeLimit: 3,
  },
  {
    slug: "lettre-administrative",
    name: "Générateur de lettre administrative",
    description:
      "Rédige une lettre administrative (attestation, congé, démission, résiliation...) prête à envoyer.",
    category: "Gestion",
    icon: FileText,
    dailyFreeLimit: 3,
  },
  {
    slug: "posts-reseaux-sociaux",
    name: "Générateur de posts réseaux sociaux",
    description:
      "Génère 3 variantes de post pour Facebook, Instagram, LinkedIn ou WhatsApp, prêtes à publier.",
    category: "Marketing",
    icon: Share2,
    dailyFreeLimit: 3,
  },
  {
    slug: "prompts-ia",
    name: "Générateur de prompts IA",
    description:
      "Transforme un objectif simple en prompt optimisé, prêt à coller dans ChatGPT ou Claude.",
    category: "Productivité",
    icon: Sparkles,
    dailyFreeLimit: 3,
  },
  {
    slug: "nom-entreprise-slogan",
    name: "Nom d'entreprise + slogan",
    description:
      "Décris ton activité et reçois 5 à 6 propositions de nom et slogan pour te lancer.",
    category: "Entrepreneuriat",
    icon: Lightbulb,
    dailyFreeLimit: 3,
  },
  {
    slug: "business-plan",
    name: "Business plan / pitch",
    description:
      "Décris ton projet et reçois un business plan structuré en 8 sections, téléchargeable en PDF.",
    category: "Entrepreneuriat",
    icon: TrendingUp,
    dailyFreeLimit: 3,
  },
  {
    slug: "resume-document",
    name: "Résumé / reformulation de document",
    description:
      "Colle un texte long et obtiens un résumé court, détaillé, ou une reformulation claire.",
    category: "Productivité",
    icon: FileSearch,
    dailyFreeLimit: 3,
  },
  {
    slug: "script-video",
    name: "Script vidéo réseaux sociaux",
    description:
      "Décris ton sujet et reçois un script séquencé pour TikTok, Reels ou Shorts.",
    category: "Marketing",
    icon: Video,
    dailyFreeLimit: 3,
  },
  {
    slug: "calcul-prix-vente",
    name: "Calcul prix de vente / marge",
    description:
      "Calcule un prix de vente rentable à partir de ton coût de revient, ou teste la marge d'un prix.",
    category: "Gestion",
    icon: Calculator,
    dailyFreeLimit: 20,
  },
  {
    slug: "contrat-simple",
    name: "Contrat simple (prestation, location)",
    description:
      "Génère un contrat de prestation de service ou de location simple, à faire relire avant signature.",
    category: "Gestion",
    icon: FileSignature,
    dailyFreeLimit: 3,
  },
  {
    slug: "workflow-n8n",
    name: "Workflow n8n assisté par IA",
    description:
      "Décris ton besoin d'automatisation et reçois un workflow n8n simple, prêt à importer.",
    category: "Productivité",
    icon: Workflow,
    dailyFreeLimit: 3,
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
