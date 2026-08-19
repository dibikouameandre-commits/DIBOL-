import type { Metadata } from "next";

import { getAllCompanyCategories } from "@/server/company-admin/categories";
import { getCompanyDashboardStats } from "@/server/company-admin/stats";

export const metadata: Metadata = { title: "Vue d'ensemble — Admin entreprise" };

export default async function CompanyAdminOverviewPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const [categories, stats] = await Promise.all([
    getAllCompanyCategories(entreprise),
    getCompanyDashboardStats(entreprise),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Vue d&apos;ensemble</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Produits</div>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Catégories</div>
          <div className="text-2xl font-bold">{categories.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Commandes</div>
          <div className="text-2xl font-bold">{stats.orderCounts.total}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Utilisateurs</div>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </div>
      </div>
    </div>
  );
}
