import { renderToBuffer } from "@react-pdf/renderer";

import type { FactureResultData, FactureTemplateId } from "@/lib/validations/tools";
import { ClassiqueFactureDocument } from "./facture-templates/classique";
import { ModerneFactureDocument } from "./facture-templates/moderne";
import { ElegantFactureDocument } from "./facture-templates/elegant";
import { MinimalisteFactureDocument } from "./facture-templates/minimaliste";
import { CreatifFactureDocument } from "./facture-templates/creatif";

// Chaque modèle consomme exactement le même FactureResultData — seule la
// présentation change, jamais le contenu ni les calculs (voir
// FactureResultData dans src/lib/validations/tools.ts).
const TEMPLATE_DOCUMENTS: Record<FactureTemplateId, React.ComponentType<{ data: FactureResultData }>> = {
  classique: ClassiqueFactureDocument,
  moderne: ModerneFactureDocument,
  elegant: ElegantFactureDocument,
  minimaliste: MinimalisteFactureDocument,
  creatif: CreatifFactureDocument,
};

export async function renderFacturePdf(
  data: FactureResultData,
  templateId: FactureTemplateId
): Promise<Buffer> {
  const FactureDocument = TEMPLATE_DOCUMENTS[templateId] ?? TEMPLATE_DOCUMENTS.classique;
  return renderToBuffer(<FactureDocument data={data} />);
}
