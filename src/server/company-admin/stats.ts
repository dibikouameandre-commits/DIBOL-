import { requireCompanyAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";

export async function getCompanyDashboardStats(companySlug: string) {
  const { company } = await requireCompanyAdmin(companySlug);

  const [
    revenueAgg,
    orderCounts,
    totalUsers,
    totalProducts,
    recentOrders,
    topProductRows,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID", companyId: company.id },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { companyId: company.id },
      _count: { _all: true },
    }),
    prisma.user.count({ where: { companyId: company.id } }),
    prisma.product.count({ where: { companyId: company.id } }),
    prisma.order.findMany({
      where: { companyId: company.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: "PAID", companyId: company.id } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const topProductIds = topProductRows.map((row) => row.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds }, companyId: company.id },
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
