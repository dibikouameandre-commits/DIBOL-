import type { PricingCalcFormValues, PricingCalcResult } from "@/lib/validations/tools";

// Fonction pure, sans appel réseau — le seul calculateur de l'outil, jamais
// touché par un appel IA. Mêmes conventions que computeFactureTotals()
// dans facture-calc.ts (arrondi à chaque étape, jamais seulement à la fin).

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Convention retenue : "marge" = majoration sur le coût de revient
// (markup), pas une marge sur le prix de vente (taux de marque) — plus
// intuitif pour un petit commerçant ("je veux gagner X% de plus que ce que
// ça m'a coûté") et sans risque de division par zéro à 100% de marge,
// contrairement à la marge sur prix de vente.
export function computePricing(values: PricingCalcFormValues): PricingCalcResult {
  const { unitCost, calcMode, marginPercent, targetPrice, quantity } = values;

  let sellingPrice: number;
  let marginAmount: number;
  let computedMarginPercent: number | null;

  if (calcMode === "marge") {
    const margin = marginPercent ?? 0;
    sellingPrice = roundCurrency(unitCost * (1 + margin / 100));
    marginAmount = roundCurrency(sellingPrice - unitCost);
    computedMarginPercent = margin;
  } else {
    sellingPrice = roundCurrency(targetPrice ?? 0);
    marginAmount = roundCurrency(sellingPrice - unitCost);
    // Coût nul : un pourcentage de marge n'a pas de sens mathématique
    // (division par zéro) — le montant de marge reste valide et affiché,
    // seul le pourcentage est signalé comme non calculable.
    computedMarginPercent = unitCost > 0 ? roundCurrency((marginAmount / unitCost) * 100) : null;
  }

  const totalProfit = quantity ? roundCurrency(marginAmount * quantity) : null;

  return {
    sellingPrice,
    marginAmount,
    marginPercent: computedMarginPercent,
    totalProfit,
  };
}
