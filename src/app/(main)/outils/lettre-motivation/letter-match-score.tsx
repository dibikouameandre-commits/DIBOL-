import type { LetterResultData } from "@/lib/validations/tools";

function scoreColor(score: number) {
  if (score >= 70) return "text-[#0E7A56]";
  if (score >= 40) return "text-[#B3742A]";
  return "text-[#A33B34]";
}

// Only rendered when the letter was generated with a pasted job offer —
// diagnostic info for the candidate, deliberately never printed into the
// letter document itself (src/server/tools/letter-pdf.tsx).
export function LetterMatchScore({ letter }: { letter: LetterResultData }) {
  if (letter.matchScore === undefined) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-bold tabular-nums ${scoreColor(letter.matchScore)}`}>
          {letter.matchScore}
          <span className="text-base font-normal text-muted-foreground">/100</span>
        </span>
        <span className="text-sm text-muted-foreground">de correspondance avec l&apos;offre</span>
      </div>

      {letter.matchedKeywords && letter.matchedKeywords.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Points forts pour cette offre
          </p>
          <div className="flex flex-wrap gap-1.5">
            {letter.matchedKeywords.map((kw, i) => (
              <span key={i} className="rounded-full bg-[#E4F2E9] px-2.5 py-1 text-xs text-[#0B5C41]">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {letter.missingKeywords && letter.missingKeywords.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ce que l&apos;offre demande en plus
          </p>
          <div className="flex flex-wrap gap-1.5">
            {letter.missingKeywords.map((kw, i) => (
              <span key={i} className="rounded-full bg-[#F7E7E5] px-2.5 py-1 text-xs text-[#A33B34]">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
