import { requireSuperAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  await requireSuperAdmin();

  const [
    revenueAgg,
    orderCounts,
    totalUsers,
    totalProducts,
    recentOrders,
    topProductRows,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: "PAID" } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const topProductIds = topProductRows.map((row) => row.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });

  const topProducts = topProductRows.map((row) => ({
    productId: row.productId,
    name:
      topProductDetails.find((p) => p.id === row.productId)?.name ??
      "Produit supprimé",
    quantity: row._sum.quantity ?? 0,
  }));

  const countByStatus = Object.fromEntries(
    orderCounts.map((row) => [row.status, row._count._all])
  ) as Record<string, number>;

  return {
    revenue: revenueAgg._sum.total?.toString() ?? "0",
    orderCounts: {
      total: orderCounts.reduce((sum, row) => sum + row._count._all, 0),
      pending: countByStatus.PENDING ?? 0,
      paid: countByStatus.PAID ?? 0,
      canceled: countByStatus.CANCELED ?? 0,
      refunded: countByStatus.REFUNDED ?? 0,
    },
    totalUsers,
    totalProducts,
    recentOrders,
    topProducts,
  };
}
