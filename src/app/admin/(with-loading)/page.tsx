import type { Metadata } from "next";
import Link from "next/link";
import { Euro, Package, ShoppingCart, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { getDashboardStats } from "@/server/admin/stats";
import { StatTile } from "./stat-tile";

export const metadata: Metadata = { title: "Vue d'ensemble — Admin" };

const statusVariants: Record<
  string,
  "secondary" | "default" | "destructive" | "outline"
> = {
  PENDING: "outline",
  PAID: "default",
  CANCELED: "destructive",
  REFUNDED: "secondary",
};

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  CANCELED: "Annulée",
  REFUNDED: "Remboursée",
};

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Vue d&apos;ensemble</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenu total"
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

      <div>
        <h2 className="mb-3 text-lg font-semibold">Commandes récentes</h2>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Aucune commande pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/commandes/${order.id}`}
                        className="font-medium hover:text-primary"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.user.name ?? order.user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total.toString())}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
