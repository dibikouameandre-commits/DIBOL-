import type { LettreAdminResultData } from "@/lib/validations/tools";
import { formatFrenchDate, getCityOnly } from "@/server/tools/letter-format";
import { getLetterDensityScale } from "@/lib/tools/letter-density";

const BASE = { padding: 40, fontSize: 13, lineHeight: 1.6, paragraphGap: 14 };

export function LettreAdminPreview({ lettre }: { lettre: LettreAdminResultData }) {
  const scale = getLetterDensityScale({ paragraphs: lettre.content.paragraphs }, BASE);
  const { form, content } = lettre;

  return (
    <div
      className="bg-white text-neutral-900"
      style={{ padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight }}
    >
      <div>
        <p className="font-bold">{form.senderName}</p>
        {form.senderAddress && <p className="text-sm text-neutral-600">{form.senderAddress}</p>}
        {form.senderPhone && <p className="text-sm text-neutral-600">{form.senderPhone}</p>}
        {form.senderEmail && <p className="text-sm text-neutral-600">{form.senderEmail}</p>}
      </div>

      <p className="mt-6 mb-7 text-right text-sm text-neutral-600">
        {getCityOnly(form.city)}, le {formatFrenchDate(lettre.createdAt)}
      </p>

      <div className="mb-7">
        <p>{form.recipientName}</p>
        {form.recipientAddress && <p>{form.recipientAddress}</p>}
      </div>

      <p className="mb-5 font-bold">{content.subject}</p>

      <p className="mb-3.5">{content.greeting}</p>

      <div className="flex flex-col" style={{ gap: scale.paragraphGap }}>
        {content.paragraphs.map((paragraph, i) => (
          <p key={i} className="text-justify">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-6">
        <p>{content.closing}</p>
        <p className="mt-5 font-bold">{content.signatureName}</p>
      </div>
    </div>
  );
}
