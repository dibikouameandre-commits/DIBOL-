import type { FactureLineItem, FactureTotals } from "@/lib/validations/tools";

// The single source of truth for every number on a facture/devis — called
// identically for the live on-screen total (as the user types) and for the
// authoritative recomputation before storage (see src/server/tools/facture.ts,
// added in a later étape). The client's raw form only ever contains
// quantity/unitPrice/discountPercent (see factureFormSchema) — there is no
// "total" field anywhere for a client submission to tamper with; every total
// only ever exists as output of this function. Never touched by an AI call.

// Currency amounts are floats coming from a form — rounding once per
// arithmetic step (not just at the very end) keeps intermediate values
// consistent with what's actually displayed line by line, avoiding the
// classic "the total doesn't match the sum you can see" complaint.
function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeFactureTotals(
  lineItems: FactureLineItem[],
  options: { globalDiscountPercent?: number; taxRatePercent?: number } = {}
): FactureTotals {
  const globalDiscountPercent = options.globalDiscountPercent ?? 0;
  const taxRatePercent = options.taxRatePercent ?? 0;

  const lines = lineItems.map((item) => {
    const discountPercent = item.discountPercent ?? 0;
    const lineSubtotal = roundCurrency(item.quantity * item.unitPrice);
    const lineDiscountAmount = roundCurrency(lineSubtotal * (discountPercent / 100));
    const lineTotal = roundCurrency(lineSubtotal - lineDiscountAmount);

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent,
      lineSubtotal,
      lineDiscountAmount,
      lineTotal,
    };
  });

  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const globalDiscountAmount = roundCurrency(subtotal * (globalDiscountPercent / 100));
  const totalAfterDiscount = roundCurrency(subtotal - globalDiscountAmount);
  const taxAmount = roundCurrency(totalAfterDiscount * (taxRatePercent / 100));
  const grandTotal = roundCurrency(totalAfterDiscount + taxAmount);

  return {
    lines,
    subtotal,
    globalDiscountPercent,
    globalDiscountAmount,
    totalAfterDiscount,
    taxRatePercent,
    taxAmount,
    grandTotal,
  };
}

// Formats a number with the document's chosen currency — display only,
// never used in a calculation (all math stays on plain numbers above).
const CURRENCY_SYMBOLS: Record<string, string> = {
  XOF: "FCFA",
  XAF: "FCFA",
  GNF: "FG",
  MAD: "DH",
  TND: "DT",
  DZD: "DA",
  EUR: "€",
  USD: "$",
};

// Nombre de décimales réellement utilisées par devise (norme ISO 4217) —
// le FCFA (XOF/XAF) et le franc guinéen n'ont pas de sous-unité utilisée en
// pratique : "25 000 FCFA" est l'écriture normale sur une facture, jamais
// "25 000,00 FCFA". Le dinar tunisien utilise 3 décimales (le millime).
const CURRENCY_DECIMALS: Record<string, number> = {
  XOF: 0,
  XAF: 0,
  GNF: 0,
  MAD: 2,
  TND: 3,
  DZD: 2,
  EUR: 2,
  USD: 2,
};

export function formatFactureAmount(amount: number, currency: string): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const formatted = amount.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${formatted} ${symbol}`;
}
