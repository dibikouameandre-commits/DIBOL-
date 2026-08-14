import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, PackageOpen } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getUserOrders } from "@/server/orders";

export const metadata: Metadata = {
  title: "Mes achats",
};

const statusLabels: Record<
  string,
  { label: string; variant: "secondary" | "default" | "destructive" | "outline" }
> = {
  PENDING: { label: "En attente", variant: "outline" },
  PAID: { label: "Payée", variant: "default" },
  CANCELED: { label: "Annulée", variant: "destructive" },
  REFUNDED: { label: "Remboursée", variant: "secondary" },
};

export default async function DashboardPage() {
  const session = await auth();
  const orders = session?.user ? await getUserOrders(session.user.id) : [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
        <PackageOpen className="size-8 text-muted-foreground" />
        <p className="font-medium">Aucun achat pour le moment</p>
        <Link href="/boutique" className={cn(buttonVariants(), "mt-2")}>
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => {
        const status = statusLabels[order.status];

        return (
          <div key={order.id} className="rounded-xl border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">
                  Commande #{order.id.slice(-8).toUpperCase()}
                </span>
                <span className="text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "long",
                  }).format(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={status.variant}>{status.label}</Badge>
                {order.invoicePdfUrl && (
                  <a
                    href={order.invoicePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <FileText className="size-3.5" />
                    Facture
                  </a>
                )}
              </div>
            </div>
            <ul className="flex flex-col divide-y">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {item.product.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                  {order.status === "PAID" ? (
                    item.product.fileKey ? (
                      <a
                        href={`/api/download/${item.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "gap-1.5"
                        )}
                      >
                        <Download className="size-3.5" />
                        Télécharger
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Téléchargement bientôt disponible
                      </span>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
