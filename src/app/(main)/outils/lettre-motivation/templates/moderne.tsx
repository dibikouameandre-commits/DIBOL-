import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("moderne");
const BASE = { padding: 36, fontSize: 13, lineHeight: 1.6, paragraphGap: 14 };

export function ModerneLetterPreview({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <div className="bg-white text-neutral-900" style={{ fontSize: scale.fontSize, lineHeight: scale.lineHeight }}>
      <div className="h-2" style={{ backgroundColor: meta.accent }} />
      <div style={{ padding: scale.padding }}>
        <div>
          <p className="text-lg font-bold" style={{ color: meta.accent }}>
            {letter.fullName}
          </p>
          <p className="text-sm text-neutral-600">{letter.location}</p>
          <p className="text-sm text-neutral-600">{letter.phone}</p>
          <p className="text-sm text-neutral-600">{letter.email}</p>
        </div>

        <p className="mt-6 mb-6 text-right text-sm text-neutral-600">
          {getCityOnly(letter.location)}, le {formatFrenchDate(letter.createdAt)}
        </p>

        <div className="mb-5">
          <p>{letter.companyName}</p>
          {letter.hiringManagerName && <p>À l&apos;attention de {letter.hiringManagerName}</p>}
        </div>

        <span
          className="mb-6 inline-block rounded px-2.5 py-1.5 text-sm font-bold text-white"
          style={{ backgroundColor: meta.accent }}
        >
          {getSubjectLine(letter)}
        </span>

        <p className="mb-3.5">{getSalutation(letter)}</p>

        <div className="flex flex-col" style={{ gap: scale.paragraphGap }}>
          {letter.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-justify">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-6">
          <p>Cordialement,</p>
          <p className="mt-5 font-bold" style={{ color: meta.accent }}>
            {letter.fullName}
          </p>
        </div>
      </div>
    </div>
  );
}
