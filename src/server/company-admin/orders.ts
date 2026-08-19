"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/server/email";
import type { OrderStatus } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllCompanyOrders(companySlug: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  return prisma.order.findMany({
    where: { companyId: company.id },
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompanyOrderDetail(companySlug: string, id: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order || order.companyId !== company.id) return null;
  return order;
}

export async function setCompanyOrderStatus(
  companySlug: string,
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });

  if (!order || order.companyId !== company.id) {
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

  revalidatePath(`/${companySlug}/admin/commandes`);
  revalidatePath(`/${companySlug}/admin/commandes/${orderId}`);
  return { success: true };
}
