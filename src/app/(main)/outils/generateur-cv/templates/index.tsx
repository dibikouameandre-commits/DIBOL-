import type { CvContent, TemplateId } from "@/lib/validations/tools";
import { ClassiqueHtmlPreview } from "./classique";
import { ModerneHtmlPreview } from "./moderne";
import { EtudiantHtmlPreview } from "./etudiant";
import { CadreHtmlPreview } from "./cadre";
import { CommercialHtmlPreview } from "./commercial";

// One HTML twin per PDF template (src/server/tools/cv-templates/*.tsx) —
// kept as faithful to its PDF counterpart as two different rendering
// engines allow, so the on-screen preview never surprises someone once
// they download the PDF.
const HTML_PREVIEWS: Record<
  TemplateId,
  (props: { cv: CvContent; photoDataUri?: string }) => React.ReactElement
> = {
  classique: ClassiqueHtmlPreview,
  moderne: ModerneHtmlPreview,
  etudiant: EtudiantHtmlPreview,
  cadre: CadreHtmlPreview,
  commercial: CommercialHtmlPreview,
};

export function CvHtmlPreview({
  cv,
  templateId,
  photoDataUri,
}: {
  cv: CvContent;
  templateId: TemplateId;
  photoDataUri?: string;
}) {
  const Preview = HTML_PREVIEWS[templateId];
  return <Preview cv={cv} photoDataUri={photoDataUri} />;
}
