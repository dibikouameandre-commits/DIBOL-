import { prisma } from "@/lib/prisma";

export class EmptyCartError extends Error {}
export class InvalidProductError extends Error {}
export class WrongCompanyError extends Error {}

export async function createCompanyPendingOrder(
  companyId: string,
  userId: string,
  items: { productId: string; quantity: number }[]
) {
  if (items.length === 0) {
    throw new EmptyCartError("Le panier est vide");
  }

  // A client belongs to exactly one company (per the multi-entreprise
  // design) — someone with no company yet (companyId: null, e.g. an
  // account created before this feature existed, or a super-admin) can
  // still buy anywhere; someone already tied to a different company cannot.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (user?.companyId && user.companyId !== companyId) {
    throw new WrongCompanyError(
      "Ton compte est rattaché à une autre entreprise, tu ne peux pas passer commande ici."
    );
  }

  const productIds = items.map((item) => item.productId);
  // companyId here is the real isolation guard: a product id that belongs
  // to a different company (however it got into the request) is silently
  // excluded, which then trips the length mismatch check below exactly
  // like an unpublished/deleted product would.
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isPublished: true, companyId },
  });

  if (products.length !== productIds.length) {
    throw new InvalidProductError(
      "Un ou plusieurs produits ne sont plus disponibles"
    );
  }

  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
    };
  });

  const total = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return prisma.order.create({
    data: {
      userId,
      companyId,
      total,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } } },
  });
}
