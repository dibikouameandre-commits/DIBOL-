"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import type { ToolQuotaStatus } from "@/lib/rate-limit";
import {
  pricingCalcFormSchema,
  factureCurrencyLabels,
  type PricingCalcFormValues,
  type PricingCalcResult,
} from "@/lib/validations/tools";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { calculatePricing } from "@/server/tools/pricing-calc";

const CALC_MODE_LABELS: Record<"marge" | "prix-cible", string> = {
  marge: "Je connais la marge que je veux",
  "prix-cible": "Je veux tester un prix de vente",
};

export function PricingCalcForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PricingCalcResult | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PricingCalcFormValues>({
    resolver: zodResolver(pricingCalcFormSchema),
    defaultValues: { currency: "XOF", calcMode: "marge" },
  });

  const calcMode = watch("calcMode");
  const currency = watch("currency") || "XOF";

  const onSubmit = async (values: PricingCalcFormValues) => {
    setIsSubmitting(true);
    setResult(null);
    const response = await calculatePricing(values);
    setIsSubmitting(false);

    if (response.quota) {
      setQuota(response.quota);
    }

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    setResult(response.result);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unitCost">Coût de revient unitaire</Label>
          <Input
            id="unitCost"
            type="number"
            step="any"
            min="0"
            placeholder="1500"
            {...register("unitCost", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
          />
          {errors.unitCost && (
            <p className="text-sm text-destructive">{errors.unitCost.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Devise</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      factureCurrencyLabels[value as keyof typeof factureCurrencyLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(factureCurrencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="calcMode">Que veux-tu calculer ?</Label>
        <Controller
          name="calcMode"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="calcMode" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) => CALC_MODE_LABELS[value as keyof typeof CALC_MODE_LABELS]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALC_MODE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {calcMode === "marge" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marginPercent">Marge souhaitée sur le coût (%)</Label>
            <Input
              id="marginPercent"
              type="number"
              step="any"
              min="0"
              placeholder="30"
              {...register("marginPercent", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
            {errors.marginPercent && (
              <p className="text-sm text-destructive">{errors.marginPercent.message}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetPrice">Prix de vente à tester</Label>
            <Input
              id="targetPrice"
              type="number"
              step="any"
              min="0"
              placeholder="2000"
              {...register("targetPrice", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
            {errors.targetPrice && (
              <p className="text-sm text-destructive">{errors.targetPrice.message}</p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantité vendue (facultatif)</Label>
          <Input
            id="quantity"
            type="number"
            step="1"
            min="1"
            placeholder="100"
            {...register("quantity", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Calcul en cours..." : "Calculer"}
      </Button>

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Prix de vente conseillé</span>
            <span className="text-2xl font-bold">
              {formatFactureAmount(result.sellingPrice, currency)}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Marge</span>
            <span className="font-medium">
              {formatFactureAmount(result.marginAmount, currency)}
              {result.marginPercent !== null && ` (${result.marginPercent.toFixed(1)} %)`}
            </span>
          </div>
          {result.marginPercent === null && (
            <p className="text-xs text-muted-foreground">
              Pourcentage non calculable avec un coût de revient à 0.
            </p>
          )}
          {result.totalProfit !== null && (
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">Profit total</span>
              <span className="font-medium">{formatFactureAmount(result.totalProfit, currency)}</span>
            </div>
          )}
          {result.marginAmount < 0 && (
            <p className="text-sm font-medium text-destructive">
              Attention : à ce prix, tu vends à perte.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
