import { NextResponse } from "next/server";

import { getLettreAdminResult } from "@/server/tools/lettre-admin";
import { renderLettreAdminPdf } from "@/server/tools/lettre-admin-pdf";

const COMBINING_MARKS = /[̀-ͯ]/g;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareSlug: string }> }
) {
  const { shareSlug } = await params;
  const result = await getLettreAdminResult(shareSlug);

  if (!result) {
    return NextResponse.json({ error: "Introuvable ou expiré" }, { status: 404 });
  }

  try {
    const buffer = await renderLettreAdminPdf(result);
    const slug = result.form.senderName
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `Lettre-administrative-${slug}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to render lettre administrative PDF:", error);
    return NextResponse.json({ error: "Erreur de génération du PDF" }, { status: 500 });
  }
}
