import type { FactureTemplateId } from "@/lib/validations/tools";

// Single source of truth for each template's identity and colors — both the
// PDF component (src/server/tools/facture-templates/*.tsx) and its on-screen
// HTML twin (src/app/(main)/outils/facture-devis/templates/*.tsx) read from
// here, so a color never drifts between what someone previews and what they
// download.
export type FactureTemplateMeta = {
  id: FactureTemplateId;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  ink: string;
};

export const FACTURE_TEMPLATES: FactureTemplateMeta[] = [
  {
    id: "classique",
    name: "Classique",
    description: "Sobre et professionnel — le choix sûr pour tout secteur.",
    accent: "#1F6FB2",
    accentSoft: "#E5F0F9",
    ink: "#16201C",
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "Bandeau d'en-tête coloré, mise en page contemporaine.",
    accent: "#0E9384",
    accentSoft: "#E1F3F0",
    ink: "#122421",
  },
  {
    id: "elegant",
    name: "Élégant",
    description: "Typographie serif raffinée — pour une image haut de gamme.",
    accent: "#8A6A2F",
    accentSoft: "#F1EADC",
    ink: "#211C12",
  },
  {
    id: "minimaliste",
    name: "Minimaliste",
    description: "Épuré au maximum, sans couleur — laisse les chiffres parler.",
    accent: "#2B2B2B",
    accentSoft: "#F2F2F2",
    ink: "#1A1A1A",
  },
  {
    id: "creatif",
    name: "Créatif",
    description: "Bandeau coloré et affirmé, plus de personnalité visuelle.",
    accent: "#D9622B",
    accentSoft: "#FBE9DD",
    ink: "#241A12",
  },
];

export function getFactureTemplateMeta(id: FactureTemplateId): FactureTemplateMeta {
  return FACTURE_TEMPLATES.find((t) => t.id === id) ?? FACTURE_TEMPLATES[0];
}
