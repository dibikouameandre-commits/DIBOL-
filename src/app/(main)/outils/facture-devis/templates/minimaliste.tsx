import type { FactureResultData } from "@/lib/validations/tools";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { computeFactureDensity, getFactureDensityScale } from "@/lib/tools/facture-density";

export function MinimalisteFactureHtmlPreview({ data }: { data: FactureResultData }) {
  const { form, totals } = data;
  const docLabel = form.documentType === "devis" ? "DEVIS" : "FACTURE";
  const scale = getFactureDensityScale(computeFactureDensity(data));
  const rootStyle = { padding: 40 + scale.pagePaddingDelta, fontSize: 13 + scale.bodyFontDelta };

  return (
    <div className="bg-white text-neutral-900" style={rootStyle}>
      <div
        className="flex items-start justify-between gap-6"
        style={{ marginBottom: 26 * scale.sectionGapMultiplier }}
      >
        <div className="max-w-[60%]">
          {form.issuerLogoDataUri && (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un data URI
            <img
              src={form.issuerLogoDataUri}
              alt=""
              className="mb-2 h-10 w-10 object-contain grayscale"
            />
          )}
          <h2 className="text-base font-bold">{form.issuerName || "Nom de l'entreprise"}</h2>
          {form.issuerAddress && (
            <p className="whitespace-pre-line text-xs text-neutral-500">{form.issuerAddress}</p>
          )}
          {(form.issuerPhone || form.issuerEmail) && (
            <p className="text-xs text-neutral-500">
              {[form.issuerPhone, form.issuerEmail].filter(Boolean).join(" · ")}
            </p>
          )}
          {form.issuerTaxId && (
            <p className="text-xs text-neutral-500">RCCM / NIF : {form.issuerTaxId}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <span className="inline-block border border-neutral-800 px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-neutral-800">
            {docLabel}
          </span>
          <div className="mt-2 flex flex-col gap-0.5 text-xs">
            <p>
              <span className="text-neutral-400">N° </span>
              <span className="font-semibold">{form.documentNumber || "—"}</span>
            </p>
            <p>
              <span className="text-neutral-400">Date </span>
              <span className="font-semibold">{form.documentDate || "—"}</span>
            </p>
            {form.dueDate && (
              <p>
                <span className="text-neutral-400">Échéance </span>
                <span className="font-semibold">{form.dueDate}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className="border-b border-neutral-200"
        style={{ marginBottom: 22 * scale.sectionGapMultiplier }}
      />

      <div className="max-w-[60%]" style={{ marginBottom: 24 * scale.sectionGapMultiplier }}>
        <p className="mb-1.5 text-[9px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
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
        <div className="flex gap-3 border-b border-neutral-800 px-1 pb-1.5 text-[9px] font-bold tracking-[0.1em] text-neutral-500 uppercase">
          <span className="flex-1">Description</span>
          <span className="w-10 shrink-0 text-right">Qté</span>
          <span className="w-24 shrink-0 text-right">Prix unit.</span>
          <span className="w-14 shrink-0 text-right">Remise</span>
          <span className="w-24 shrink-0 text-right">Montant</span>
        </div>
        {totals.lines.map((line, i) => (
          <div
            key={i}
            className="flex items-baseline gap-3 border-b border-neutral-100 px-1 text-xs last:border-0"
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
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Sous-total</span>
          <span className="font-medium text-neutral-900 tabular-nums">
            {formatFactureAmount(totals.subtotal, form.currency)}
          </span>
        </div>
        {totals.globalDiscountAmount > 0 && (
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Remise globale ({totals.globalDiscountPercent}%)</span>
            <span className="font-medium text-neutral-900 tabular-nums">
              -{formatFactureAmount(totals.globalDiscountAmount, form.currency)}
            </span>
          </div>
        )}
        {totals.taxAmount > 0 && (
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Taxe ({totals.taxRatePercent}%)</span>
            <span className="font-medium text-neutral-900 tabular-nums">
              {formatFactureAmount(totals.taxAmount, form.currency)}
            </span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t-2 border-neutral-900 pt-2 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatFactureAmount(totals.grandTotal, form.currency)}</span>
        </div>
      </div>

      {(form.paymentTerms || form.notes) && (
        <div className="flex gap-6" style={{ marginTop: 28 * scale.sectionGapMultiplier }}>
          {form.paymentTerms && (
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-bold tracking-[0.1em] text-neutral-400 uppercase">
                Conditions de paiement
              </p>
              <p className="whitespace-pre-line text-xs text-neutral-600">{form.paymentTerms}</p>
            </div>
          )}
          {form.notes && (
            <div className="flex-1">
              <p className="mb-1 text-[9px] font-bold tracking-[0.1em] text-neutral-400 uppercase">
                Notes
              </p>
              <p className="whitespace-pre-line text-xs text-neutral-600">{form.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
