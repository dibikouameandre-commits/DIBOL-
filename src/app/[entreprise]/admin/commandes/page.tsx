import type { Metadata } from "next";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { getAllCompanyOrders } from "@/server/company-admin/orders";

export const metadata: Metadata = { title: "Commandes — Admin entreprise" };

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

export default async function CompanyOrdersPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const orders = await getAllCompanyOrders(entreprise);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
        <p className="text-muted-foreground">
          {orders.length} commande{orders.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucune commande pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/${entreprise}/admin/commandes/${order.id}`}
                      className="font-medium hover:text-primary"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.user.name ?? order.user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                    }).format(order.createdAt)}
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
  );
}
