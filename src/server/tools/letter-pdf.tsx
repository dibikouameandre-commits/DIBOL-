import { renderToBuffer } from "@react-pdf/renderer";

import type { LetterResultData, LetterTemplateId } from "@/lib/validations/tools";
import { ClassiqueLettreDocument } from "./letter-templates/classique";
import { ModerneLettreDocument } from "./letter-templates/moderne";
import { ElegantLettreDocument } from "./letter-templates/elegant";
import { MinimalisteLettreDocument } from "./letter-templates/minimaliste";
import { CreatifLettreDocument } from "./letter-templates/creatif";

// Every template consumes the exact same LetterResultData — only the
// presentation differs, never the content or the match score. Mirrors
// src/server/tools/cv-pdf.tsx's dispatcher pattern.
const TEMPLATE_DOCUMENTS: Record<
  LetterTemplateId,
  React.ComponentType<{ letter: LetterResultData }>
> = {
  classique: ClassiqueLettreDocument,
  moderne: ModerneLettreDocument,
  elegant: ElegantLettreDocument,
  minimaliste: MinimalisteLettreDocument,
  creatif: CreatifLettreDocument,
};

export async function renderLetterPdf(letter: LetterResultData): Promise<Buffer> {
  const LettreDocument = TEMPLATE_DOCUMENTS[letter.templateId];
  return renderToBuffer(<LettreDocument letter={letter} />);
}
