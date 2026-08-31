import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale } from "@/lib/tools/cv-density";

const meta = getCvTemplateMeta("cadre");
const BASE_SECTION_GAP = 20; // px, matches the previous mb-5

export function CadreHtmlPreview({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const scale = getDensityScale("cadre", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;

  return (
    <div className="bg-white leading-relaxed text-neutral-900" style={{ fontSize: 13 + scale.bodyFontDelta }}>
      <div className="flex items-center gap-4 bg-[#1B1D22] p-8 text-white">
        {photoDataUri && (
          // eslint-disable-next-line @next/next/no-img-element -- data URI, no optimization needed
          <img src={photoDataUri} alt="" className="size-16 shrink-0 rounded object-cover" />
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{cv.fullName}</h2>
          <p
            className="mb-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: meta.accent }}
          >
            {cv.targetRole}
          </p>
          <p className="flex flex-wrap gap-x-3 text-xs text-neutral-300">
            <span>{cv.location}</span>
            <span>{cv.phone}</span>
            <span>{cv.email}</span>
          </p>
        </div>
      </div>

      <div style={{ padding: 32 + scale.pagePaddingDelta }}>
        {cv.summary && (
          <p
            className="mb-5 border-l-2 pl-3 text-sm italic text-neutral-700"
            style={{ borderColor: meta.accent }}
          >
            {cv.summary}
          </p>
        )}

        {cv.experiences.length > 0 && (
          <section style={{ marginBottom: sectionGap }}>
            <h3
              className="mb-2 text-[10px] font-bold tracking-widest uppercase"
              style={{ color: meta.accent }}
            >
              Expérience professionnelle
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
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="flex gap-2">
                        <span style={{ color: meta.accent }}>—</span>
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
              className="mb-2 text-[10px] font-bold tracking-widest uppercase"
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
              className="mb-2 text-[10px] font-bold tracking-widest uppercase"
              style={{ color: meta.accent }}
            >
              Compétences clés
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {cv.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="size-1 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.accent }}
                  />
                  <span className="text-sm">{skill.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {cv.languages && cv.languages.length > 0 && (
          <section>
            <h3
              className="mb-2 text-[10px] font-bold tracking-widest uppercase"
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
