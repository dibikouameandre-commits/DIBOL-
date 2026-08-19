import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readProductFile } from "@/lib/storage";
import { isSuperAdmin } from "@/lib/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  const { orderItemId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true, product: true },
  });

  if (!orderItem) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const isOwner = orderItem.order.userId === session.user.id;
  const isAdmin = isSuperAdmin(session.user.role);

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (orderItem.order.status !== "PAID") {
    return NextResponse.json(
      { error: "Cette commande n'est pas encore payée" },
      { status: 403 }
    );
  }

  if (!orderItem.product.fileKey) {
    return NextResponse.json(
      { error: "Aucun fichier disponible pour ce produit" },
      { status: 404 }
    );
  }

  try {
    const buffer = await readProductFile(orderItem.product.fileKey);
    const filename = orderItem.product.fileName ?? orderItem.product.slug;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to read product file:", error);
    return NextResponse.json(
      { error: "Fichier introuvable sur le serveur" },
      { status: 404 }
    );
  }
}
