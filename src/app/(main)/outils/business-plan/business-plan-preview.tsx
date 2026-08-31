import type { BusinessPlanResultData } from "@/lib/validations/tools";
import { formatFrenchDate, getCityOnly } from "@/server/tools/letter-format";

const SECTIONS: { key: keyof BusinessPlanResultData["content"]; title: string }[] = [
  { key: "executiveSummary", title: "Résumé exécutif" },
  { key: "problem", title: "Problème" },
  { key: "solution", title: "Solution" },
  { key: "targetMarket", title: "Marché cible" },
  { key: "businessModel", title: "Modèle économique" },
  { key: "competitiveAdvantage", title: "Avantage concurrentiel" },
  { key: "fundingNeed", title: "Besoin de financement" },
  { key: "nextSteps", title: "Prochaines étapes" },
];

export function BusinessPlanPreview({ plan }: { plan: BusinessPlanResultData }) {
  const { form, content } = plan;

  return (
    <div className="bg-white p-10 text-neutral-900">
      <h2 className="text-2xl font-bold">{form.projectName}</h2>
      <p className="text-sm text-neutral-600">Business plan préparé par {form.founderName}</p>
      <p className="mb-6 text-xs text-neutral-500">
        {getCityOnly(form.location)}, le {formatFrenchDate(plan.createdAt)}
      </p>

      <div className="flex flex-col gap-5">
        {SECTIONS.map(({ key, title }) => (
          <div key={key}>
            <p className="mb-1.5 text-xs font-bold tracking-wide text-primary uppercase">{title}</p>
            <p className="text-justify text-sm leading-relaxed">{content[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
