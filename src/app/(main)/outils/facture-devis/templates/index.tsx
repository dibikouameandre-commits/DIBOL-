import type { FactureResultData, FactureTemplateId } from "@/lib/validations/tools";
import { ClassiqueFactureHtmlPreview } from "./classique";
import { ModerneFactureHtmlPreview } from "./moderne";
import { ElegantFactureHtmlPreview } from "./elegant";
import { MinimalisteFactureHtmlPreview } from "./minimaliste";
import { CreatifFactureHtmlPreview } from "./creatif";

// Un jumeau HTML par modèle PDF (src/server/tools/facture-templates/*.tsx) —
// mêmes remarques que pour le CV/la lettre : gardé aussi fidèle que possible
// à son équivalent PDF, pour que l'aperçu à l'écran ne surprenne jamais au
// moment du téléchargement.
const HTML_PREVIEWS: Record<
  FactureTemplateId,
  (props: { data: FactureResultData }) => React.ReactElement
> = {
  classique: ClassiqueFactureHtmlPreview,
  moderne: ModerneFactureHtmlPreview,
  elegant: ElegantFactureHtmlPreview,
  minimaliste: MinimalisteFactureHtmlPreview,
  creatif: CreatifFactureHtmlPreview,
};

export function FactureHtmlPreview({
  data,
  templateId,
}: {
  data: FactureResultData;
  templateId: FactureTemplateId;
}) {
  const Preview = HTML_PREVIEWS[templateId] ?? HTML_PREVIEWS.classique;
  return <Preview data={data} />;
}
