import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale } from "@/lib/tools/cv-density";

const meta = getCvTemplateMeta("commercial");
const BASE_SECTION_GAP = 20; // px, matches the previous mb-5

export function CommercialHtmlPreview({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const scale = getDensityScale("commercial", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;

  return (
    <div className="bg-white leading-relaxed text-neutral-900" style={{ fontSize: 13 + scale.bodyFontDelta }}>
      <div className="h-2" style={{ backgroundColor: meta.accent }} />
      <div style={{ padding: 32 + scale.pagePaddingDelta }}>
        <div className="mb-4 flex items-center gap-4">
          {photoDataUri && (
            // eslint-disable-next-line @next/next/no-img-element -- data URI, no optimization needed
            <img src={photoDataUri} alt="" className="size-14 shrink-0 rounded-full object-cover" />
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{cv.fullName}</h2>
            <span
              className="mb-1.5 inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: meta.accent }}
            >
              {cv.targetRole}
            </span>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-500">
              <span>{cv.location}</span>
              <span>{cv.phone}</span>
              <span>{cv.email}</span>
            </p>
          </div>
        </div>

        {cv.summary && <p className="mb-5 font-semibold">{cv.summary}</p>}

        {cv.experiences.length > 0 && (
          <section style={{ marginBottom: sectionGap }}>
            <h3
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: meta.accent }}
            >
              Résultats &amp; expérience
            </h3>
            <div className="flex flex-col gap-3">
              {cv.experiences.map((exp, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold">
                      {exp.title} — {exp.company}
                    </span>
                    <span className="text-xs text-neutral-500">{exp.period}</span>
                  </div>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span
                          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                          style={{ backgroundColor: meta.accentSoft, color: meta.accent }}
                        >
                          {j + 1}
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {cv.education.length > 0 && (
          <section style={{ marginBottom: sectionGap }}>
            <h3
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: meta.accent }}
            >
              Formation
            </h3>
            <div className="flex flex-col gap-1.5">
              {cv.education.map((edu, i) => (
                <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">
                    {edu.degree} — {edu.school}
                  </span>
                  <span className="text-xs text-neutral-500">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {cv.skills.length > 0 && (
          <section style={{ marginBottom: sectionGap }}>
            <h3
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: meta.accent }}
            >
              Compétences
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {cv.skills.map((skill, i) => (
                <span
                  key={i}
                  className="rounded border px-2 py-1 text-xs font-bold"
                  style={{ borderColor: meta.accent, color: meta.accent }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {cv.languages && cv.languages.length > 0 && (
          <section>
            <h3
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: meta.accent }}
            >
              Langues
            </h3>
            <p className="text-sm">{cv.languages.join(" · ")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
