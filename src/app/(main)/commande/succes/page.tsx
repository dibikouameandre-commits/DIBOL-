import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, PartyPopper } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/server/orders";
import { ClearCartOnMount } from "./clear-cart";

export const metadata: Metadata = {
  title: "Commande confirmée",
  robots: { index: false },
};

export default async function CommandeSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ commande?: string }>;
}) {
  const { commande } = await searchParams;
  const session = await auth();

  if (!commande || !session?.user) {
    notFound();
  }

  const order = await getOrderById(commande);

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const isPaid = order.status === "PAID";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <ClearCartOnMount />

      {isPaid ? (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Commande confirmée !
          </h1>
          <p className="text-muted-foreground">
            Merci pour ton achat. Un email de confirmation t&apos;a été
            envoyé.
          </p>
        </>
      ) : (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Paiement en cours de confirmation
          </h1>
          <p className="text-muted-foreground">
            Ta commande sera automatiquement confirmée dès que le paiement
            sera validé par Stripe.
          </p>
        </>
      )}

      <div className="mt-2 w-full rounded-xl border p-5 text-left">
        <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>Commande #{order.id.slice(-8).toUpperCase()}</span>
          <span>{formatPrice(order.total.toString())}</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product.name}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
              <span>{formatPrice(Number(item.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dashboard"
        className={cn(buttonVariants({ size: "lg" }), "mt-2")}
      >
        Voir mes achats
      </Link>
    </div>
  );
}
