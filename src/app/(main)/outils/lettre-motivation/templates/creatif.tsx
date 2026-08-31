import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("creatif");
const BASE = { padding: 32, fontSize: 13, lineHeight: 1.6, paragraphGap: 14 };

export function CreatifLetterPreview({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <div className="bg-white text-neutral-900" style={{ fontSize: scale.fontSize, lineHeight: scale.lineHeight }}>
      <div className="p-7 text-white" style={{ backgroundColor: meta.accent }}>
        <p className="text-xl font-bold">{letter.fullName}</p>
        <p className="mt-1 text-xs opacity-90">
          {letter.location} · {letter.phone} · {letter.email}
        </p>
      </div>

      <div style={{ padding: scale.padding }}>
        <p className="mb-5 text-right text-sm text-neutral-500">
          {getCityOnly(letter.location)}, le {formatFrenchDate(letter.createdAt)}
        </p>

        <div className="mb-5">
          <p>{letter.companyName}</p>
          {letter.hiringManagerName && <p>À l&apos;attention de {letter.hiringManagerName}</p>}
        </div>

        <p className="mb-5 text-base font-bold" style={{ color: meta.accent }}>
          Objet : {getSubjectLine(letter)}
        </p>

        <p className="mb-3.5">{getSalutation(letter)}</p>

        <div className="flex flex-col" style={{ gap: scale.paragraphGap }}>
          {letter.paragraphs.map((paragraph, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 w-[3px] shrink-0 rounded-full" style={{ backgroundColor: meta.accentSoft }} />
              <p className="text-justify">{paragraph}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pl-[18px]">
          <p>Cordialement,</p>
          <p className="mt-5 font-bold" style={{ color: meta.accent }}>
            {letter.fullName}
          </p>
        </div>
      </div>
    </div>
  );
}
