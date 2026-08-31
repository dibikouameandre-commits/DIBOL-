import type { LetterResultData } from "@/lib/validations/tools";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";
import { getLetterDensityScale } from "@/lib/tools/letter-density";

const BASE = { padding: 40, fontSize: 13, lineHeight: 1.6, paragraphGap: 14 };

export function ClassiqueLetterPreview({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <div
      className="bg-white text-neutral-900"
      style={{ padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight }}
    >
      <div>
        <p className="font-bold">{letter.fullName}</p>
        <p className="text-sm text-neutral-600">{letter.location}</p>
        <p className="text-sm text-neutral-600">{letter.phone}</p>
        <p className="text-sm text-neutral-600">{letter.email}</p>
      </div>

      <p className="mt-6 mb-7 text-right text-sm text-neutral-600">
        {getCityOnly(letter.location)}, le {formatFrenchDate(letter.createdAt)}
      </p>

      <div className="mb-7">
        <p>{letter.companyName}</p>
        {letter.hiringManagerName && <p>À l&apos;attention de {letter.hiringManagerName}</p>}
      </div>

      <p className="mb-5 font-bold">Objet : {getSubjectLine(letter)}</p>

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
        <p className="mt-5 font-bold">{letter.fullName}</p>
      </div>
    </div>
  );
}
