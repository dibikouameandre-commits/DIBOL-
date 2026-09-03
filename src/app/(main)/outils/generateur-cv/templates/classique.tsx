import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale } from "@/lib/tools/cv-density";
import { SKILL_LEVEL_RATIO } from "@/server/tools/cv-templates/skill-level";

const meta = getCvTemplateMeta("classique");
const BASE_SECTION_GAP = 20; // px, matches the previous mb-5

export function ClassiqueHtmlPreview({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const scale = getDensityScale("classique", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;
  const rootStyle = { padding: 36 + scale.pagePaddingDelta, fontSize: 13 + scale.bodyFontDelta };

  const withLevel = cv.skills.filter((s) => s.level);
  const withoutLevel = cv.skills.filter((s) => !s.level);
  const grouped = new Map<string, typeof withLevel>();
  for (const skill of withLevel) {
    const key = skill.category ?? "Compétences";
    grouped.set(key, [...(grouped.get(key) ?? []), skill]);
  }

  return (
    <div className="bg-white leading-relaxed text-neutral-900" style={rootStyle}>
      <div className="mb-4 flex items-center gap-4">
        {photoDataUri && (
          // eslint-disable-next-line @next/next/no-img-element -- data URI, no optimization needed
          <img src={photoDataUri} alt="" className="size-16 shrink-0 rounded-full object-cover" />
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{cv.fullName}</h2>
          <p className="font-medium" style={{ color: meta.accent }}>
            {cv.targetRole}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-500">
            <span>{cv.location}</span>
            <span>{cv.phone}</span>
            <span>{cv.email}</span>
          </p>
        </div>
      </div>
      <div className="mb-5 border-b border-neutral-200" />

      {cv.summary && (
        <section style={{ marginBottom: sectionGap }}>
          <h3
            className="mb-2 text-[10px] font-bold tracking-wider uppercase"
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
          {[...grouped.entries()].map(([category, skills]) => (
            <div key={category} className="mb-2">
              {grouped.size > 1 && (
                <p className="mb-1 text-[10px] uppercase text-neutral-500">{category}</p>
              )}
              {skills.map((skill, i) => (
                <div key={i} className="mb-1 flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs">{skill.name}</span>
                  <span className="h-1 flex-1 rounded-full bg-neutral-200">
                    <span
                      className="block h-1 rounded-full"
                      style={{
                        width: `${SKILL_LEVEL_RATIO[skill.level!] * 100}%`,
                        backgroundColor: meta.accent,
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          ))}
          {withoutLevel.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {withoutLevel.map((skill, i) => (
                <span
                  key={i}
                  className="rounded px-2 py-1 text-xs"
                  style={{ backgroundColor: meta.accentSoft, color: meta.ink }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {cv.languages && cv.languages.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <h3
            className="mb-2 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: meta.accent }}
          >
            Langues
          </h3>
          <p className="text-sm">{cv.languages.join(" · ")}</p>
        </section>
      )}

      {cv.interests && (
        <section style={{ marginBottom: sectionGap }}>
          <h3
            className="mb-2 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: meta.accent }}
          >
            Centres d&apos;intérêt
          </h3>
          <p className="text-sm">{cv.interests}</p>
        </section>
      )}

      {cv.additionalInfo && (
        <section>
          <h3
            className="mb-2 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: meta.accent }}
          >
            Informations complémentaires
          </h3>
          <p className="text-sm">{cv.additionalInfo}</p>
        </section>
      )}
    </div>
  );
}
