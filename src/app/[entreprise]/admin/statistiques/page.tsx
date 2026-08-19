import type { Metadata } from "next";
import { Euro, Package, ShoppingCart, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { getCompanyDashboardStats } from "@/server/company-admin/stats";
import { StatTile } from "@/app/admin/(with-loading)/stat-tile";

export const metadata: Metadata = { title: "Statistiques — Admin entreprise" };

export default async function CompanyStatsPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const stats = await getCompanyDashboardStats(entreprise);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenu total (commandes payées)"
          value={formatPrice(stats.revenue)}
          icon={Euro}
        />
        <StatTile
          label="Commandes"
          value={stats.orderCounts.total}
          icon={ShoppingCart}
        />
        <StatTile label="Utilisateurs" value={stats.totalUsers} icon={Users} />
        <StatTile label="Produits" value={stats.totalProducts} icon={Package} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">En attente</span>
              <span className="font-medium">{stats.orderCounts.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payées</span>
              <span className="font-medium">{stats.orderCounts.paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annulées</span>
              <span className="font-medium">{stats.orderCounts.canceled}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remboursées</span>
              <span className="font-medium">{stats.orderCounts.refunded}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pas encore de vente.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {stats.topProducts.map((product) => (
                  <li
                    key={product.productId}
                    className="flex justify-between"
                  >
                    <span>{product.name}</span>
                    <span className="font-medium">{product.quantity} vendu(s)</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
