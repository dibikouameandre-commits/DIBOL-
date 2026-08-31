import { renderToBuffer } from "@react-pdf/renderer";

import type { CvContent, TemplateId } from "@/lib/validations/tools";
import { ClassiqueCvDocument } from "./cv-templates/classique";
import { ModerneCvDocument } from "./cv-templates/moderne";
import { EtudiantCvDocument } from "./cv-templates/etudiant";
import { CadreCvDocument } from "./cv-templates/cadre";
import { CommercialCvDocument } from "./cv-templates/commercial";

// Every template consumes the exact same CvContent — only the presentation
// differs. This is what keeps "no invented information" a single guarantee
// enforced once (at generation time), never something each template has to
// re-respect on its own.
const TEMPLATE_DOCUMENTS: Record<
  TemplateId,
  React.ComponentType<{ cv: CvContent; photoDataUri?: string }>
> = {
  classique: ClassiqueCvDocument,
  moderne: ModerneCvDocument,
  etudiant: EtudiantCvDocument,
  cadre: CadreCvDocument,
  commercial: CommercialCvDocument,
};

export async function renderCvPdf(
  cv: CvContent,
  templateId: TemplateId,
  photoDataUri?: string
): Promise<Buffer> {
  const CvDocument = TEMPLATE_DOCUMENTS[templateId];
  return renderToBuffer(<CvDocument cv={cv} photoDataUri={photoDataUri} />);
}
