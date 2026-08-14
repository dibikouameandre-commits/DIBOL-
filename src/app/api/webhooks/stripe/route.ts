import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { getOrderById, markOrderPaid } from "@/server/orders";
import { sendOrderConfirmationEmail } from "@/server/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("Stripe webhook: missing orderId in session metadata");
      return NextResponse.json({ received: true });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      console.error(`Stripe webhook: order ${orderId} not found`);
      return NextResponse.json({ received: true });
    }

    // Idempotency: Stripe may retry/resend the same event.
    if (order.status === "PAID") {
      return NextResponse.json({ received: true });
    }

    let invoicePdfUrl: string | null = null;
    const invoiceId =
      typeof session.invoice === "string" ? session.invoice : session.invoice?.id;

    if (invoiceId) {
      try {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        invoicePdfUrl = invoice.invoice_pdf ?? null;
      } catch (error) {
        console.error("Failed to retrieve Stripe invoice:", error);
      }
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    await markOrderPaid(order.id, {
      stripePaymentIntentId: paymentIntentId,
      stripeInvoiceId: invoiceId,
      invoicePdfUrl,
    });

    await sendOrderConfirmationEmail({
      to: order.user.email,
      name: order.user.name,
      order: {
        id: order.id,
        total: order.total.toString(),
        invoicePdfUrl,
        items: order.items.map((item) => ({
          quantity: item.quantity,
          price: item.price.toString(),
          product: { name: item.product.name },
        })),
      },
    });
  }

  return NextResponse.json({ received: true });
}
