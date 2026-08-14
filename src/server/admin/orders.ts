"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/server/email";
import type { OrderStatus } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllOrders() {
  await requireAdmin();
  return prisma.order.findMany({
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderDetail(id: string) {
  await requireAdmin();
  return prisma.order.findUnique({
    where: { id },
    include: { user: true, items: { include: { product: true } } },
  });
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });

  if (!order) {
    return { success: false, error: "Commande introuvable" };
  }

  const becamePaid = status === "PAID" && order.status !== "PAID";

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      paidAt: becamePaid ? new Date() : order.paidAt,
    },
  });

  if (becamePaid) {
    await sendOrderConfirmationEmail({
      to: order.user.email,
      name: order.user.name,
      order: {
        id: order.id,
        total: order.total.toString(),
        invoicePdfUrl: order.invoicePdfUrl,
        items: order.items.map((item) => ({
          quantity: item.quantity,
          price: item.price.toString(),
          product: { name: item.product.name },
        })),
      },
    });
  }

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
