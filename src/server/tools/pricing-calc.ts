"use server";

import { getOrCreateAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun, type ToolQuotaStatus } from "@/lib/rate-limit";
import { computePricing } from "@/lib/tools/pricing-calc";
import {
  pricingCalcFormSchema,
  type PricingCalcFormValues,
  type PricingCalcResult,
} from "@/lib/validations/tools";

const TOOL_SLUG = "calcul-prix-vente";

type CalculatePricingResult =
  | { success: true; result: PricingCalcResult; quota: ToolQuotaStatus }
  | { success: false; error: string; quota?: ToolQuotaStatus };

// Pas d'appel IA ici — uniquement le quota (mêmes règles que les autres
// outils) et le calcul déterministe de computePricing(). Aucun ToolResult
// n'est créé : cet outil n'a ni historique ni partage par lien (validé
// explicitement), le ToolRun ne sert qu'à faire respecter le quota.
export async function calculatePricing(
  values: PricingCalcFormValues
): Promise<CalculatePricingResult> {
  const parsed = pricingCalcFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const [anonId, ipHash] = await Promise.all([getOrCreateAnonId(), getRequestIpHash()]);

  const rateLimit = await checkToolRateLimit(TOOL_SLUG, { anonId, ipHash });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error:
        "Tu as atteint la limite gratuite pour aujourd'hui. Réessaie demain, ou crée un compte pour un quota plus généreux.",
      quota: { remaining: 0, limit: rateLimit.limit, blocked: true },
    };
  }

  const result = computePricing(parsed.data);

  await recordToolRun(TOOL_SLUG, { anonId, ipHash });
  const remaining = Math.max(rateLimit.remaining - 1, 0);

  return {
    success: true,
    result,
    quota: { remaining, limit: rateLimit.limit, blocked: remaining <= 0 },
  };
}
