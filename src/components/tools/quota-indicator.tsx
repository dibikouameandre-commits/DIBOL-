import { Sparkles, AlertTriangle, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ToolQuotaStatus } from "@/lib/rate-limit";

// Pure display — never gates anything. The actual block still happens
// server-side in the generate/match server actions via checkToolRateLimit;
// this only reflects that same status so the visitor sees it coming instead
// of only finding out after clicking submit. Colors reuse the same
// green/amber/red tones already used for the CV/offer match score
// (see job-match-form.tsx's scoreColor) for a consistent visual language.
export function QuotaIndicator({ remaining, limit }: ToolQuotaStatus) {
  if (remaining <= 0) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg bg-[#F7E7E5] px-3.5 py-2.5 text-sm text-[#A33B34] dark:bg-[#3A2320] dark:text-[#F5A99C]">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          Tu as atteint la limite gratuite pour aujourd&apos;hui. Réessaie demain, ou crée un
          compte pour un quota plus généreux.
        </span>
      </div>
    );
  }

  const isLow = remaining === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm",
        isLow
          ? "bg-[#FBEEDD] text-[#8A5A1E] dark:bg-[#3A2E16] dark:text-[#F0C368]"
          : "bg-[#E4F2E9] text-[#0B5C41] dark:bg-[#16332A] dark:text-[#7EE2A8]"
      )}
    >
      {isLow ? (
        <AlertTriangle className="size-4 shrink-0" />
      ) : (
        <Sparkles className="size-4 shrink-0" />
      )}
      <span>
        {isLow
          ? "Il ne te reste qu'une génération gratuite aujourd'hui."
          : `${remaining} générations gratuites restantes aujourd'hui (sur ${limit}).`}
      </span>
    </div>
  );
}
