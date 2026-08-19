import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/server/company";

export class EmptyCartError extends Error {}
export class InvalidProductError extends Error {}

// The global cart/checkout represents "Entreprise par défaut" — same
// reasoning as src/server/catalog.ts. A product id that doesn't belong to
// that company (e.g. a stale cart item from a different company's context)
// is excluded here, tripping the same "no longer available" error a
// deleted/unpublished product would.
export async function createPendingOrder(
  userId: string,
  items: { productId: string; quantity: number }[]
) {
  if (items.length === 0) {
    throw new EmptyCartError("Le panier est vide");
  }

  const defaultCompany = await getCompanyBySlug("default");
  if (!defaultCompany) {
    throw new InvalidProductError("La boutique n'est pas disponible pour le moment.");
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isPublished: true, companyId: defaultCompany.id },
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
      companyId: defaultCompany.id,
      total,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } } },
  });
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { stripeSessionId: sessionId },
  });
}

export async function markOrderPaid(
  orderId: string,
  data: {
    stripePaymentIntentId?: string | null;
    stripeInvoiceId?: string | null;
    invoicePdfUrl?: string | null;
  }
) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: data.stripePaymentIntentId ?? undefined,
      stripeInvoiceId: data.stripeInvoiceId ?? undefined,
      invoicePdfUrl: data.invoicePdfUrl ?? undefined,
    },
  });
}

export async function markOrderCanceled(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELED" },
  });
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, user: true },
  });
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}
