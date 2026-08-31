import { NextResponse } from "next/server";

import { getLetterResult } from "@/server/tools/letter";
import { renderLetterPdf } from "@/server/tools/letter-pdf";

const COMBINING_MARKS = /[̀-ͯ]/g;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  const { shareSlug } = await params;
  const result = await getLetterResult(shareSlug);

  if (!result) {
    return NextResponse.json({ error: "Introuvable ou expiré" }, { status: 404 });
  }

  try {
    const buffer = await renderLetterPdf(result);
    const slug = result.fullName
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `Lettre-de-motivation-${slug}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render letter PDF:", error);
    return NextResponse.json({ error: "Erreur de génération du PDF" }, { status: 500 });
  }
}
