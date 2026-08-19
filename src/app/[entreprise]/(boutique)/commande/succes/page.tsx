import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, PartyPopper } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { auth } from "@/lib/auth";
import { getCompanyBySlug } from "@/server/company";
import { getOrderById } from "@/server/orders";
import { ClearCompanyCartOnMount } from "./clear-cart";

export const metadata: Metadata = {
  title: "Commande confirmée",
  robots: { index: false },
};

export default async function CompanyCommandeSuccesPage({
  params,
  searchParams,
}: {
  params: Promise<{ entreprise: string }>;
  searchParams: Promise<{ commande?: string }>;
}) {
  const { entreprise } = await params;
  const { commande } = await searchParams;
  const session = await auth();

  if (!commande || !session?.user) {
    notFound();
  }

  const company = await getCompanyBySlug(entreprise);
  const order = await getOrderById(commande);

  if (!company || !order || order.userId !== session.user.id || order.companyId !== company.id) {
    notFound();
  }

  const isPaid = order.status === "PAID";
  const base = `/${entreprise}`;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <ClearCompanyCartOnMount />

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
        href={`${base}/boutique`}
        className={cn(buttonVariants({ size: "lg" }), "mt-2")}
      >
        Continuer mes achats
      </Link>
    </div>
  );
}
