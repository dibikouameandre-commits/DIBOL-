import { resend, EMAIL_FROM } from "@/lib/resend";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

type ConfirmationOrder = {
  id: string;
  total: string | number;
  invoicePdfUrl?: string | null;
  items: {
    quantity: number;
    price: string | number;
    product: { name: string };
  }[];
};

function orderConfirmationHtml(order: ConfirmationOrder, name?: string | null) {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-size:14px;">
            ${item.product.name}${item.quantity > 1 ? ` &times; ${item.quantity}` : ""}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;color:#111;font-size:14px;">
            ${formatPrice(Number(item.price) * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  const invoiceRow = order.invoicePdfUrl
    ? `<a href="${order.invoicePdfUrl}" style="color:#5b53e8;">Télécharger la facture</a>`
    : "";

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:20px;color:#111;margin-bottom:4px;">Merci pour ta commande${name ? `, ${name}` : ""} !</h1>
    <p style="color:#666;font-size:14px;margin-top:0;">
      Ta commande #${order.id.slice(-8).toUpperCase()} est confirmée. Voici le récapitulatif :
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      ${itemsHtml}
      <tr>
        <td style="padding:14px 0 0;font-weight:600;color:#111;">Total</td>
        <td style="padding:14px 0 0;font-weight:600;color:#111;text-align:right;">${formatPrice(order.total)}</td>
      </tr>
    </table>
    <a href="${siteConfig.url}/dashboard"
       style="display:inline-block;background:#5b53e8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">
      Voir mes achats
    </a>
    ${invoiceRow ? `<p style="margin-top:16px;font-size:14px;">${invoiceRow}</p>` : ""}
    <p style="color:#999;font-size:12px;margin-top:32px;">${siteConfig.name} — ${siteConfig.description}</p>
  </div>`;
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  name?: string | null;
  order: ConfirmationOrder;
}) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Confirmation de commande — ${siteConfig.name}`,
      html: orderConfirmationHtml(params.order, params.name),
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

function simpleEmailHtml(params: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:20px;color:#111;margin-bottom:4px;">${params.title}</h1>
    <p style="color:#666;font-size:14px;">${params.body}</p>
    <a href="${params.ctaUrl}"
       style="display:inline-block;background:#5b53e8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;margin-top:8px;">
      ${params.ctaLabel}
    </a>
    <p style="color:#999;font-size:12px;margin-top:32px;">${siteConfig.name} — ${siteConfig.description}</p>
  </div>`;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Réinitialise ton mot de passe — ${siteConfig.name}`,
      html: simpleEmailHtml({
        title: "Réinitialisation de mot de passe",
        body: "Tu as demandé à réinitialiser ton mot de passe. Ce lien est valable 1 heure et ne peut être utilisé qu'une seule fois. Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.",
        ctaLabel: "Choisir un nouveau mot de passe",
        ctaUrl: params.resetUrl,
      }),
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  verifyUrl: string;
}) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: `Confirme ton adresse email — ${siteConfig.name}`,
      html: simpleEmailHtml({
        title: "Confirme ton adresse email",
        body: "Merci de t'être inscrit·e sur DIBOL AI. Confirme ton adresse email en cliquant sur le lien ci-dessous. Ce lien est valable 24 heures.",
        ctaLabel: "Confirmer mon email",
        ctaUrl: params.verifyUrl,
      }),
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}
