import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale } from "@/lib/tools/cv-density";
import { SKILL_LEVEL_RATIO } from "@/server/tools/cv-templates/skill-level";

const meta = getCvTemplateMeta("moderne");
const BASE_SECTION_GAP = 16; // px, matches the previous mb-4

export function ModerneHtmlPreview({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  // The sidebar keeps its exact structure/colors (Moderne's identity) —
  // only the main column adapts, same as its PDF twin.
  const scale = getDensityScale("moderne", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;
  const withLevel = cv.skills.filter((s) => s.level);
  const withoutLevel = cv.skills.filter((s) => !s.level);

  return (
    <div className="flex flex-col bg-white leading-relaxed text-neutral-900 sm:flex-row" style={{ fontSize: 13 + scale.bodyFontDelta }}>
      <aside
        className="flex shrink-0 flex-col gap-5 p-6 text-white sm:w-52"
        style={{ backgroundColor: meta.accent }}
      >
        {photoDataUri && (
          // eslint-disable-next-line @next/next/no-img-element -- data URI, no optimization needed
          <img
            src={photoDataUri}
            alt=""
            className="mx-auto size-20 rounded-full object-cover ring-2 ring-white/40"
          />
        )}
        <div>
          <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
            Contact
          </h4>
          <p className="text-xs">{cv.location}</p>
          <p className="text-xs">{cv.phone}</p>
          <p className="text-xs break-all">{cv.email}</p>
        </div>

        {cv.skills.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
              Compétences
            </h4>
            <div className="flex flex-col gap-2">
              {withLevel.map((skill, i) => (
                <div key={i}>
                  <p className="mb-1 text-xs">{skill.name}</p>
                  <span className="block h-1 rounded-full bg-white/25">
                    <span
                      className="block h-1 rounded-full bg-white"
                      style={{ width: `${SKILL_LEVEL_RATIO[skill.level!] * 100}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
            {withoutLevel.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {withoutLevel.map((skill, i) => (
                  <span key={i} className="rounded bg-white/20 px-2 py-1 text-[11px]">
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {cv.languages && cv.languages.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
              Langues
            </h4>
            <p className="text-xs">{cv.languages.join(" · ")}</p>
          </div>
        )}
      </aside>

      <div className="flex-1 p-6 sm:p-8" style={{ paddingTop: 24 + scale.pagePaddingDelta, paddingBottom: 24 + scale.pagePaddingDelta }}>
        <h2 className="text-2xl font-bold tracking-tight">{cv.fullName}</h2>
        <p className="mb-4 font-bold" style={{ color: meta.accent }}>
          {cv.targetRole}
        </p>

        {cv.summary && (
          <section style={{ marginBottom: sectionGap }}>
            <h3
              className="mb-1.5 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: meta.accent }}
            >
              Profil
            </h3>
            <p>{cv.summary}</p>
          </section>
        )}

        {cv.experiences.length > 0 && (
          <section style={{ marginBottom: sectionGap }}>
            <h3
              className="mb-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: meta.accent }}
            >
              Expérience
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
                        <span style={{ color: meta.accent }}>•</span>
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
          <section>
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
      </div>
    </div>
  );
}
