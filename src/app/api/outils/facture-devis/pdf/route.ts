import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { factureFormSchema, type FactureResultData } from "@/lib/validations/tools";
import { computeFactureTotals } from "@/lib/tools/facture-calc";
import { renderFacturePdf } from "@/server/tools/facture-pdf";

const TOOL_SLUG = "facture-devis";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme le CV et la lettre

// Outil 100% déterministe : aucun appel IA. Le PDF est recalculé à partir des
// données du formulaire — jamais à partir d'un total envoyé par le client
// (même principe que src/server/checkout.ts qui revalide les prix côté
// serveur). Le quota gratuit (voir src/lib/rate-limit.ts, déjà utilisé par le
// CV et la lettre de motivation) s'applique ici exactement de la même façon :
// vérifié avant de générer, jamais consommé si la génération échoue.
//
// Étape 6 : chaque génération réussie est maintenant aussi enregistrée
// (ToolRun + ToolResult, même mécanisme que le CV/la lettre) pour permettre
// le partage par lien — voir src/app/outils/facture-devis/resultat/[shareSlug].
// Le PDF téléchargé directement ici reste inchangé ; seul un lien de partage
// est produit en plus, jamais requis pour télécharger.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = factureFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informations invalides" }, { status: 400 });
  }

  const [session, anonId, ipHash] = await Promise.all([
    auth(),
    getOrCreateAnonId(),
    getRequestIpHash(),
  ]);

  const rateLimit = await checkToolRateLimit(TOOL_SLUG, { anonId, ipHash });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Tu as atteint la limite gratuite pour aujourd'hui. Réessaie demain, ou crée un compte pour un quota plus généreux.",
      },
      { status: 429 }
    );
  }

  const totals = computeFactureTotals(parsed.data.lineItems, {
    globalDiscountPercent: parsed.data.globalDiscountPercent,
    taxRatePercent: parsed.data.taxRatePercent,
  });

  const resultData: FactureResultData = {
    form: parsed.data,
    totals,
    createdAt: new Date().toISOString(),
  };

  try {
    const buffer = await renderFacturePdf(resultData, parsed.data.templateId);

    // Quota consommé seulement maintenant — un PDF qui n'a pas pu être
    // généré (bloc catch ci-dessous) ne coûte jamais une génération.
    const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });
    const remainingAfter = Math.max(rateLimit.remaining - 1, 0);

    const shareSlug = generateShareSlug();
    await prisma.toolResult.create({
      data: {
        runId: run.id,
        shareSlug,
        content: resultData,
        expiresAt: new Date(Date.now() + RESULT_TTL_MS),
      },
    });

    const prefix = parsed.data.documentType === "devis" ? "Devis" : "Facture";
    const slug = parsed.data.documentNumber.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    const filename = `${prefix}-${slug || "document"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Lus côté client pour rafraîchir l'indicateur de quota sans
        // recharger la page (l'outil reste sur une seule page, contrairement
        // au CV/lettre qui ont une page résultat séparée).
        "X-Quota-Remaining": String(remainingAfter),
        "X-Quota-Limit": String(rateLimit.limit),
        "X-Quota-Blocked": remainingAfter <= 0 ? "1" : "0",
        // Étape 6 : lien de partage du document généré.
        "X-Share-Slug": shareSlug,
      },
    });
  } catch (error) {
    console.error("Failed to render facture PDF:", error);
    return NextResponse.json({ error: "Erreur de génération du PDF" }, { status: 500 });
  }
}
