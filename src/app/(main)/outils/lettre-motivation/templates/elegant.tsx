import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("elegant");
const BASE = { padding: 44, fontSize: 13, lineHeight: 1.65, paragraphGap: 15 };

export function ElegantLetterPreview({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <div
      className="bg-white text-neutral-900"
      style={{ padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight, fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div className="flex flex-col items-center text-center">
        <p
          className="text-xl font-bold uppercase"
          style={{ color: meta.accent, letterSpacing: "0.12em" }}
        >
          {letter.fullName}
        </p>
        <p className="mt-1.5 text-xs text-neutral-500">
          {letter.location} · {letter.phone} · {letter.email}
        </p>
        <div className="mt-3 h-px w-24" style={{ backgroundColor: meta.accent }} />
      </div>

      <p className="mb-6 mt-6 text-right text-sm italic text-neutral-500">
        {getCityOnly(letter.location)}, le {formatFrenchDate(letter.createdAt)}
      </p>

      <div className="mb-6">
        <p>{letter.companyName}</p>
        {letter.hiringManagerName && <p>À l&apos;attention de {letter.hiringManagerName}</p>}
      </div>

      <p className="mb-6 font-bold italic" style={{ color: meta.accent }}>
        Objet : {getSubjectLine(letter)}
      </p>

      <p className="mb-3.5">{getSalutation(letter)}</p>

      <div className="flex flex-col" style={{ gap: scale.paragraphGap }}>
        {letter.paragraphs.map((paragraph, i) => (
          <p key={i} className="text-justify">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-6">
        <p className="italic">Cordialement,</p>
        <p className="mt-5 font-bold">{letter.fullName}</p>
      </div>
    </div>
  );
}
