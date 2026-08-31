import type { LetterResultData, LetterTemplateId } from "@/lib/validations/tools";
import { ClassiqueLetterPreview } from "./classique";
import { ModerneLetterPreview } from "./moderne";
import { ElegantLetterPreview } from "./elegant";
import { MinimalisteLetterPreview } from "./minimaliste";
import { CreatifLetterPreview } from "./creatif";

// One HTML twin per PDF template (src/server/tools/letter-templates/*.tsx)
// — mirrors src/app/(main)/outils/generateur-cv/templates/index.tsx's
// dispatcher pattern, so the on-screen preview never surprises someone
// once they download the PDF.
const HTML_PREVIEWS: Record<LetterTemplateId, (props: { letter: LetterResultData }) => React.ReactElement> = {
  classique: ClassiqueLetterPreview,
  moderne: ModerneLetterPreview,
  elegant: ElegantLetterPreview,
  minimaliste: MinimalisteLetterPreview,
  creatif: CreatifLetterPreview,
};

export function LetterHtmlPreview({ letter }: { letter: LetterResultData }) {
  const Preview = HTML_PREVIEWS[letter.templateId];
  return <Preview letter={letter} />;
}
