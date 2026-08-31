"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { matchCvToOffer } from "@/server/tools/cv";
import {
  jobOfferFormSchema,
  type JobOfferFormValues,
  type MatchAnalysis,
} from "@/lib/validations/tools";

function scoreColor(score: number) {
  if (score >= 70) return "text-[#0E7A56]";
  if (score >= 40) return "text-[#B3742A]";
  return "text-[#A33B34]";
}

function MatchResult({ match }: { match: MatchAnalysis }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-bold tabular-nums ${scoreColor(match.score)}`}>
          {match.score}
          <span className="text-base font-normal text-muted-foreground">/100</span>
        </span>
        <span className="text-sm text-muted-foreground">de correspondance avec cette offre</span>
      </div>

      {match.matchedKeywords.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Points forts pour cette offre
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-full bg-[#E4F2E9] px-2.5 py-1 text-xs text-[#0B5C41]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.missingKeywords.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ce que l&apos;offre demande en plus
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.missingKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-full bg-[#F7E7E5] px-2.5 py-1 text-xs text-[#A33B34]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggestions
          </p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {match.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function JobMatchForm({ shareSlug, initialMatches }: { shareSlug: string; initialMatches: MatchAnalysis[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobOfferFormValues>({ resolver: zodResolver(jobOfferFormSchema) });

  const onSubmit = async (values: JobOfferFormValues) => {
    setIsSubmitting(true);
    const result = await matchCvToOffer(shareSlug, values.offerText);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    // initialMatches arrives newest-first from getCvResult; keep that order
    // explicit here too rather than relying on the new match always sorting
    // first by construction.
    setMatches((prev) =>
      [result.match, ...prev].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="offerText">Colle le texte de l&apos;offre d&apos;emploi</Label>
          <Textarea
            id="offerText"
            rows={6}
            placeholder="Colle ici la description du poste, les missions, les compétences demandées..."
            {...register("offerText")}
          />
          {errors.offerText && (
            <p className="text-sm text-destructive">{errors.offerText.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Analyse en cours..." : "Comparer mon CV à cette offre"}
        </Button>
      </form>

      {matches.length > 0 && (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <MatchResult key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
