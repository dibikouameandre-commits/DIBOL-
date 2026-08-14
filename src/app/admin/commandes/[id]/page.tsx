import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { getOrderDetail } from "@/server/admin/orders";
import { OrderStatusSelect } from "../order-status-select";

export const metadata: Metadata = { title: "Détail commande — Admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Commande #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(
              order.createdAt
            )}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{order.user.name ?? "—"}</span>
          <span className="text-muted-foreground">{order.user.email}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="flex flex-col divide-y">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-6 py-3 text-sm"
              >
                <span>
                  {item.product.name}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="font-medium">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t px-6 py-3 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total.toString())}</span>
          </div>
        </CardContent>
      </Card>

      {order.invoicePdfUrl && (
        <a
          href={order.invoicePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <FileText className="size-4" />
          Voir la facture Stripe
        </a>
      )}
    </div>
  );
}
