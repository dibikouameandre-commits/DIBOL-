import { NextResponse } from "next/server";

import { getFactureResult } from "@/server/tools/facture";
import { renderFacturePdf } from "@/server/tools/facture-pdf";

// Sert le PDF d'un document déjà généré et partagé — aucune revalidation de
// quota ici (le quota a déjà été consommé au moment de la génération
// initiale, voir src/app/api/outils/facture-devis/pdf/route.ts) ; le contenu
// stocké est déjà la version authoritative calculée côté serveur.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  const { shareSlug } = await params;
  const result = await getFactureResult(shareSlug);

  if (!result) {
    return NextResponse.json({ error: "Introuvable ou expiré" }, { status: 404 });
  }

  try {
    const buffer = await renderFacturePdf(result, result.form.templateId);

    const prefix = result.form.documentType === "devis" ? "Devis" : "Facture";
    const slug = result.form.documentNumber.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    const filename = `${prefix}-${slug || "document"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render shared facture PDF:", error);
    return NextResponse.json({ error: "Erreur de génération du PDF" }, { status: 500 });
  }
}
