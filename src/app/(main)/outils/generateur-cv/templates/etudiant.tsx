import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale } from "@/lib/tools/cv-density";

const meta = getCvTemplateMeta("etudiant");
const BASE_SECTION_GAP = 20; // px, matches the previous mb-5

function SectionPill({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: meta.accent }}
    >
      {children}
    </h3>
  );
}

export function EtudiantHtmlPreview({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  // Étudiant gets a stronger sparse multiplier than other templates — see
  // src/lib/tools/cv-density.ts — since a first-job CV with little content
  // is this template's main use case.
  const density = computeCvDensity(cv);
  const scale = getDensityScale("etudiant", density);
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;
  const rootStyle = { padding: 36 + scale.pagePaddingDelta, fontSize: 13 + scale.bodyFontDelta };

  return (
    <div className="bg-white leading-relaxed text-neutral-900" style={rootStyle}>
      <div className="mb-4 flex items-center gap-4">
        {photoDataUri && (
          // eslint-disable-next-line @next/next/no-img-element -- data URI, no optimization needed
          <img src={photoDataUri} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight">{cv.fullName}</h2>
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

      {cv.summary && (
        <div
          className="mb-5 rounded-md p-3 text-sm"
          style={{ backgroundColor: meta.accentSoft, color: meta.ink }}
        >
          {cv.summary}
        </div>
      )}

      {cv.education.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionPill>Formation</SectionPill>
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

      {cv.experiences.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionPill>Expériences &amp; stages</SectionPill>
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

      {cv.skills.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionPill>Compétences</SectionPill>
          <div className="flex flex-wrap gap-1.5">
            {cv.skills.map((skill, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-1 text-xs"
                style={{ backgroundColor: meta.accentSoft, color: meta.ink }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {cv.languages && cv.languages.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionPill>Langues</SectionPill>
          <p className="text-sm">{cv.languages.join(" · ")}</p>
        </section>
      )}

      {cv.interests && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionPill>Centres d&apos;intérêt</SectionPill>
          <p className="text-sm">{cv.interests}</p>
        </section>
      )}

      {cv.additionalInfo && (
        <section>
          <SectionPill>Informations complémentaires</SectionPill>
          <p className="text-sm">{cv.additionalInfo}</p>
        </section>
      )}

      {/* Repère visuel discret en bas de page pour les CV courts — pure
          décoration, aucune information ajoutée. Miroir du PDF. */}
      {density === "sparse" && (
        <div className="mt-8 h-1 rounded-full" style={{ backgroundColor: meta.accentSoft }} />
      )}
    </div>
  );
}
