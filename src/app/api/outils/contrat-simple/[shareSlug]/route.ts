import { NextResponse } from "next/server";

import { getContratResult } from "@/server/tools/contrat";
import { renderContratPdf } from "@/server/tools/contrat-pdf";

const COMBINING_MARKS = /[̀-ͯ]/g;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  const { shareSlug } = await params;
  const result = await getContratResult(shareSlug);

  if (!result) {
    return NextResponse.json({ error: "Introuvable ou expiré" }, { status: 404 });
  }

  try {
    const buffer = await renderContratPdf(result);
    const slug = result.form.partyBName
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `Contrat-${slug}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render contrat PDF:", error);
    return NextResponse.json({ error: "Erreur de génération du PDF" }, { status: 500 });
  }
}
