import { NextResponse } from "next/server";

import { getCvResult } from "@/server/tools/cv";
import { renderCvPdf } from "@/server/tools/cv-pdf";

const COMBINING_MARKS = /[̀-ͯ]/g;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  const { shareSlug } = await params;
  const result = await getCvResult(shareSlug);

  if (!result) {
    return NextResponse.json({ error: "Introuvable ou expiré" }, { status: 404 });
  }

  try {
    const buffer = await renderCvPdf(result.cv, result.templateId, result.photoDataUri);
    // Normalize accented characters (Aïcha Koné -> Aicha-Kone) instead of
    // just stripping them, so the downloaded filename stays readable.
    const slug = result.cv.fullName
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `CV-${slug}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render CV PDF:", error);
    return NextResponse.json({ error: "Erreur de génération du PDF" }, { status: 500 });
  }
}
