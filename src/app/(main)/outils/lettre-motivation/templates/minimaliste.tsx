import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const BASE = { padding: 44, fontSize: 12.5, lineHeight: 1.7, paragraphGap: 16 };

export function MinimalisteLetterPreview({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <div
      className="bg-white text-neutral-900"
      style={{ padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight }}
    >
      <div>
        <p className="font-bold tracking-wide">{letter.fullName}</p>
        <p className="text-xs text-neutral-500">{letter.location}</p>
        <p className="text-xs text-neutral-500">{letter.phone}</p>
        <p className="text-xs text-neutral-500">{letter.email}</p>
      </div>

      <p className="mt-8 mb-8 text-xs text-neutral-500">
        {getCityOnly(letter.location)}, le {formatFrenchDate(letter.createdAt)}
      </p>

      <div className="mb-7">
        <p>{letter.companyName}</p>
        {letter.hiringManagerName && <p>À l&apos;attention de {letter.hiringManagerName}</p>}
      </div>

      <div className="mb-7">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Objet</p>
        <p>{getSubjectLine(letter)}</p>
      </div>

      <p className="mb-4">{getSalutation(letter)}</p>

      <div className="flex flex-col" style={{ gap: scale.paragraphGap }}>
        {letter.paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8">
        <p>Cordialement,</p>
        <p className="mt-6">{letter.fullName}</p>
      </div>
    </div>
  );
}
