"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { siteConfig } from "@/config/site";
import {
  attachStripeSession,
  createPendingOrder,
  markOrderCanceled,
  EmptyCartError,
  InvalidProductError,
} from "@/server/orders";

export async function createCheckoutSession(
  items: { productId: string; quantity: number }[]
): Promise<{ error: string } | never> {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion?from=/panier");
  }

  let order;

  try {
    order = await createPendingOrder(session.user.id, items);
  } catch (error) {
    if (error instanceof EmptyCartError) {
      return { error: "Ton panier est vide." };
    }
    if (error instanceof InvalidProductError) {
      return { error: error.message };
    }
    throw error;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    await markOrderCanceled(order.id);
    return {
      error:
        "Le paiement n'est pas encore configuré (clé Stripe manquante). Réessaie plus tard.",
    };
  }

  let checkoutSession;

  try {
    checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email ?? undefined,
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(item.price) * 100),
          product_data: { name: item.product.name },
        },
      })),
      invoice_creation: { enabled: true },
      metadata: { orderId: order.id },
      success_url: `${siteConfig.url}/commande/succes?commande=${order.id}`,
      cancel_url: `${siteConfig.url}/panier?annule=1`,
    });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    await markOrderCanceled(order.id);
    return { error: "Impossible de créer la session de paiement Stripe." };
  }

  if (!checkoutSession.url) {
    await markOrderCanceled(order.id);
    return { error: "Impossible de créer la session de paiement." };
  }

  await attachStripeSession(order.id, checkoutSession.id);

  redirect(checkoutSession.url);
}
