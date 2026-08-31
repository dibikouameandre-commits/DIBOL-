import { AlertTriangle } from "lucide-react";

import { CONTRAT_PARTY_ROLES, contratTypeLabels, type ContratResultData } from "@/lib/validations/tools";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { formatFrenchDate, getCityOnly } from "@/server/tools/letter-format";
import { CONTRAT_DISCLAIMER } from "@/server/tools/contrat-pdf";

export function ContratPreview({ contrat }: { contrat: ContratResultData }) {
  const { form, content } = contrat;
  const roles = CONTRAT_PARTY_ROLES[form.contratType];
  const typeLabel = contratTypeLabels[form.contratType];

  return (
    <div className="bg-white p-8 text-sm text-neutral-900 sm:p-10">
      <div className="mb-6 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="text-xs italic text-amber-800">{CONTRAT_DISCLAIMER}</p>
      </div>

      <h2 className="mb-5 text-center text-lg font-bold uppercase">{typeLabel}</h2>

      <p className="mb-2">ENTRE LES SOUSSIGNÉS :</p>
      <p className="mb-3">
        {form.partyAName}
        {form.partyAAddress ? `, ${form.partyAAddress}` : ""}, ci-après désigné « {roles.partyA} »,
      </p>
      <p className="mb-3">D&apos;une part,</p>
      <p className="mb-2">ET :</p>
      <p className="mb-3">
        {form.partyBName}
        {form.partyBAddress ? `, ${form.partyBAddress}` : ""}, ci-après désigné « {roles.partyB} »,
      </p>
      <p className="mb-6">D&apos;autre part, il a été convenu ce qui suit :</p>

      <div className="flex flex-col gap-4">
        {content.clauses.map((clause, i) => (
          <div key={i}>
            <p className="mb-1 font-bold">
              Article {i + 1} — {clause.title}
            </p>
            <p className="text-justify leading-relaxed">{clause.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 mb-6">
        Fait à {getCityOnly(form.city)}, le {formatFrenchDate(contrat.createdAt)}, en deux exemplaires.
      </p>

      <div className="flex justify-between gap-6">
        <div className="w-[45%]">
          <p className="mb-8 font-bold">{roles.partyA}</p>
          <p>{form.partyAName}</p>
        </div>
        <div className="w-[45%]">
          <p className="mb-8 font-bold">{roles.partyB}</p>
          <p>{form.partyBName}</p>
        </div>
      </div>

      <p className="mt-8 text-xs text-neutral-400">
        Montant convenu : {formatFactureAmount(form.amount, form.currency)} · Durée : {form.duration}
      </p>
    </div>
  );
}
