import type { LetterTemplateId } from "@/lib/validations/tools";

// Single source of truth for each template's identity and colors — both the
// PDF component (src/server/tools/letter-templates/*.tsx) and its on-screen
// HTML twin (src/app/(main)/outils/lettre-motivation/templates/*.tsx) read
// from here, so a color never drifts between preview and download. Mirrors
// src/lib/tools/cv-templates.ts's pattern.
export type LetterTemplateMeta = {
  id: LetterTemplateId;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  ink: string;
};

export const LETTER_TEMPLATES: LetterTemplateMeta[] = [
  {
    id: "classique",
    name: "Classique",
    description: "Sobre et intemporel — le choix sûr pour toute candidature.",
    accent: "#33475B",
    accentSoft: "#EAEEF1",
    ink: "#1A1A1A",
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "Bandeau coloré et objet mis en valeur, mise en page contemporaine.",
    accent: "#1F6FB2",
    accentSoft: "#E5F0F9",
    ink: "#141A1F",
  },
  {
    id: "elegant",
    name: "Élégant",
    description: "Typographie serif raffinée — pour un poste de représentation ou de direction.",
    accent: "#6B2737",
    accentSoft: "#F3E6E9",
    ink: "#211418",
  },
  {
    id: "minimaliste",
    name: "Minimaliste",
    description: "Épuré au maximum, sans couleur — laisse le contenu parler.",
    accent: "#4A4A4A",
    accentSoft: "#F2F2F2",
    ink: "#1A1A1A",
  },
  {
    id: "creatif",
    name: "Créatif",
    description: "Bandeau d'en-tête coloré, plus de personnalité visuelle.",
    accent: "#C0632B",
    accentSoft: "#FBEBDF",
    ink: "#1E1712",
  },
];

export function getLetterTemplateMeta(id: LetterTemplateId): LetterTemplateMeta {
  const template = LETTER_TEMPLATES.find((t) => t.id === id);
  if (!template) {
    throw new Error(`Unknown letter template: ${id}`);
  }
  return template;
}
