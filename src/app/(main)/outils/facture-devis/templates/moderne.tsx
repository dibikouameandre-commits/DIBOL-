import type { FactureResultData } from "@/lib/validations/tools";
import { getFactureTemplateMeta } from "@/lib/tools/facture-templates";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { computeFactureDensity, getFactureDensityScale } from "@/lib/tools/facture-density";

const meta = getFactureTemplateMeta("moderne");

export function ModerneFactureHtmlPreview({ data }: { data: FactureResultData }) {
  const { form, totals } = data;
  const docLabel = form.documentType === "devis" ? "DEVIS" : "FACTURE";
  const scale = getFactureDensityScale(computeFactureDensity(data));

  return (
    <div className="bg-white text-neutral-900" style={{ fontSize: 13 + scale.bodyFontDelta }}>
      <div className="p-9" style={{ paddingBottom: 0 }}>
        <div
          className="flex items-center justify-between gap-6 rounded-lg px-6 py-5"
          style={{ backgroundColor: meta.accent, marginBottom: 24 * scale.sectionGapMultiplier }}
        >
          <div className="max-w-[60%]">
            {form.issuerLogoDataUri && (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un data URI
              <img
                src={form.issuerLogoDataUri}
                alt=""
                className="mb-2 h-10 w-10 object-contain"
              />
            )}
            <h2 className="text-lg font-bold text-white">{form.issuerName || "Nom de l'entreprise"}</h2>
            {form.issuerAddress && (
              <p className="whitespace-pre-line text-xs text-white/80">{form.issuerAddress}</p>
            )}
            {(form.issuerPhone || form.issuerEmail) && (
              <p className="text-xs text-white/80">
                {[form.issuerPhone, form.issuerEmail].filter(Boolean).join(" · ")}
              </p>
            )}
            {form.issuerTaxId && (
              <p className="text-xs text-white/80">RCCM / NIF : {form.issuerTaxId}</p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-block rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-bold tracking-wide text-white">
              {docLabel}
            </span>
            <div className="mt-2 flex flex-col gap-0.5 text-xs text-white">
              <p>
                <span className="text-white/70">N° </span>
                <span className="font-semibold">{form.documentNumber || "—"}</span>
              </p>
              <p>
                <span className="text-white/70">Date </span>
                <span className="font-semibold">{form.documentDate || "—"}</span>
              </p>
              {form.dueDate && (
                <p>
                  <span className="text-white/70">Échéance </span>
                  <span className="font-semibold">{form.dueDate}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[60%]" style={{ marginBottom: 24 * scale.sectionGapMultiplier }}>
          <p
            className="mb-1.5 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: meta.accent }}
          >
            {form.documentType === "devis" ? "Devis pour" : "Facturé à"}
          </p>
          <p className="font-semibold">{form.clientName || "Nom du client"}</p>
          {form.clientAddress && (
            <p className="whitespace-pre-line text-xs text-neutral-500">{form.clientAddress}</p>
          )}
          {(form.clientPhone || form.clientEmail) && (
            <p className="text-xs text-neutral-500">
              {[form.clientPhone, form.clientEmail].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div>
          <div
            className="flex gap-3 px-2.5 pb-2 text-[10px] font-bold tracking-wide uppercase"
            style={{ borderBottom: `2px solid ${meta.accent}`, color: meta.accent }}
          >
            <span className="flex-1">Description</span>
            <span className="w-10 shrink-0 text-right">Qté</span>
            <span className="w-24 shrink-0 text-right">Prix unit.</span>
            <span className="w-14 shrink-0 text-right">Remise</span>
            <span className="w-24 shrink-0 text-right">Montant</span>
          </div>
          {totals.lines.map((line, i) => (
            <div
              key={i}
              className="flex items-baseline gap-3 border-b border-neutral-100 px-2.5 text-xs last:border-0"
              style={{ paddingTop: 8 * scale.rowPaddingMultiplier, paddingBottom: 8 * scale.rowPaddingMultiplier }}
            >
              <span className="flex-1">{line.description || "—"}</span>
              <span className="w-10 shrink-0 text-right tabular-nums">{line.quantity}</span>
              <span className="w-24 shrink-0 text-right tabular-nums">
                {formatFactureAmount(line.unitPrice, form.currency)}
              </span>
              <span className="w-14 shrink-0 text-right tabular-nums">
                {line.discountPercent > 0 ? `-${line.discountPercent}%` : "—"}
              </span>
              <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                {formatFactureAmount(line.lineTotal, form.currency)}
              </span>
            </div>
          ))}
        </div>

        <div
          className="ml-auto flex w-56 flex-col gap-1"
          style={{ marginTop: 12 * scale.sectionGapMultiplier }}
        >
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Sous-total</span>
            <span className="font-medium tabular-nums">
              {formatFactureAmount(totals.subtotal, form.currency)}
            </span>
          </div>
          {totals.globalDiscountAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Remise globale ({totals.globalDiscountPercent}%)</span>
              <span className="font-medium tabular-nums">
                -{formatFactureAmount(totals.globalDiscountAmount, form.currency)}
              </span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Taxe ({totals.taxRatePercent}%)</span>
              <span className="font-medium tabular-nums">
                {formatFactureAmount(totals.taxAmount, form.currency)}
              </span>
            </div>
          )}
          <div
            className="mt-1 flex justify-between rounded-lg px-2.5 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: meta.ink }}
          >
            <span>Total</span>
            <span className="tabular-nums" style={{ color: meta.accentSoft }}>
              {formatFactureAmount(totals.grandTotal, form.currency)}
            </span>
          </div>
        </div>

        {(form.paymentTerms || form.notes) && (
          <div className="flex gap-6" style={{ marginTop: 28 * scale.sectionGapMultiplier }}>
            {form.paymentTerms && (
              <div className="flex-1">
                <p
                  className="mb-1 text-[10px] font-bold tracking-wide uppercase"
                  style={{ color: meta.accent }}
                >
                  Conditions de paiement
                </p>
                <p className="whitespace-pre-line text-xs text-neutral-600">{form.paymentTerms}</p>
              </div>
            )}
            {form.notes && (
              <div className="flex-1">
                <p
                  className="mb-1 text-[10px] font-bold tracking-wide uppercase"
                  style={{ color: meta.accent }}
                >
                  Notes
                </p>
                <p className="whitespace-pre-line text-xs text-neutral-600">{form.notes}</p>
              </div>
            )}
          </div>
        )}
        <div className="h-9" />
      </div>
    </div>
  );
}
