import type { TemplateId } from "@/lib/validations/tools";

// Single source of truth for each template's identity and colors — both
// the PDF component (src/server/tools/cv-templates/*.tsx) and its on-screen
// HTML twin (src/app/(main)/outils/generateur-cv/templates/*.tsx) read from
// here, so a color never drifts between what someone previews and what
// they download.
export type CvTemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  layout: "single-column" | "sidebar";
  accent: string;
  accentSoft: string;
  ink: string;
};

export const CV_TEMPLATES: CvTemplateMeta[] = [
  {
    id: "classique",
    name: "Classique",
    description: "Sobre et intemporel — le choix sûr pour tout secteur.",
    layout: "single-column",
    accent: "#0E7A56",
    accentSoft: "#E4F2E9",
    ink: "#16201C",
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "Colonne latérale colorée, mise en page contemporaine.",
    layout: "sidebar",
    accent: "#1F6FB2",
    accentSoft: "#E5F0F9",
    ink: "#141A1F",
  },
  {
    id: "etudiant",
    name: "Étudiant",
    description: "Formation mise en avant — pensé pour un premier CV.",
    layout: "single-column",
    accent: "#D9822B",
    accentSoft: "#FBEEDD",
    ink: "#211A12",
  },
  {
    id: "cadre",
    name: "Cadre",
    description: "Dense et exécutif, profil professionnel en évidence.",
    layout: "single-column",
    accent: "#8A6A2F",
    accentSoft: "#EFE9DC",
    ink: "#15171A",
  },
  {
    id: "commercial",
    name: "Commercial",
    description: "Dynamique, met en avant les résultats concrets.",
    layout: "single-column",
    accent: "#C0392B",
    accentSoft: "#FBE8E5",
    ink: "#1C1412",
  },
];

export function getCvTemplateMeta(id: TemplateId): CvTemplateMeta {
  const template = CV_TEMPLATES.find((t) => t.id === id);
  if (!template) {
    throw new Error(`Unknown CV template: ${id}`);
  }
  return template;
}
