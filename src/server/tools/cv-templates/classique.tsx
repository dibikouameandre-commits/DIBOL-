import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale, type DensityScale } from "@/lib/tools/cv-density";
import { SKILL_LEVEL_RATIO } from "./skill-level";

const meta = getCvTemplateMeta("classique");

const BASE_SECTION_GAP = 14;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", color: meta.ink },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  photo: { width: 64, height: 64, borderRadius: 32 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  role: { fontSize: 13, color: meta.accent, marginBottom: 6 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, fontSize: 9.5, color: "#444444" },
  divider: { borderBottom: `1 solid #DDDDDD`, marginBottom: 16 },
  section: { marginBottom: BASE_SECTION_GAP },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: meta.accent,
    marginBottom: 6,
  },
  summary: { lineHeight: 1.5 },
  entry: { marginBottom: 8 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, flex: 1, paddingRight: 8 },
  entryMeta: { fontSize: 9.5, color: "#555555", flexShrink: 0 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, lineHeight: 1.4 },
  skillGroup: { marginBottom: 6 },
  skillGroupLabel: { fontSize: 9, color: "#555555", marginBottom: 3, textTransform: "uppercase" },
  skillRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  skillName: { width: 110, fontSize: 9.5 },
  skillBarTrack: { flex: 1, height: 4, backgroundColor: "#E5E5E5", borderRadius: 2 },
  skillBarFill: { height: 4, backgroundColor: meta.accent, borderRadius: 2 },
  skillChip: {
    fontSize: 9,
    backgroundColor: meta.accentSoft,
    color: meta.ink,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  skillChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#AAAAAA", textAlign: "center" },
});

function SkillsBlock({ cv, sectionGap }: { cv: CvContent; sectionGap: number }) {
  const withLevel = cv.skills.filter((s) => s.level);
  const withoutLevel = cv.skills.filter((s) => !s.level);

  const grouped = new Map<string, typeof withLevel>();
  for (const skill of withLevel) {
    const key = skill.category ?? "Compétences";
    grouped.set(key, [...(grouped.get(key) ?? []), skill]);
  }

  return (
    <View style={[styles.section, { marginBottom: sectionGap }]}>
      <Text style={styles.sectionTitle}>Compétences</Text>
      {[...grouped.entries()].map(([category, skills]) => (
        <View key={category} style={styles.skillGroup}>
          {grouped.size > 1 && <Text style={styles.skillGroupLabel}>{category}</Text>}
          {skills.map((skill, i) => (
            <View key={i} style={styles.skillRow}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <View style={styles.skillBarTrack}>
                <View
                  style={[
                    styles.skillBarFill,
                    { width: `${SKILL_LEVEL_RATIO[skill.level!] * 100}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ))}
      {withoutLevel.length > 0 && (
        <View style={styles.skillChipsRow}>
          {withoutLevel.map((skill, i) => (
            <Text key={i} style={styles.skillChip}>
              {skill.name}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export function ClassiqueCvDocument({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const scale: DensityScale = getDensityScale("classique", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;
  const pageStyle = [
    styles.page,
    { padding: 40 + scale.pagePaddingDelta, fontSize: 10.5 + scale.bodyFontDelta },
  ];

  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        <View style={styles.header}>
          {photoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, not a DOM <img>
            <Image
              src={photoDataUri}
              style={[
                styles.photo,
                {
                  width: 64 * scale.photoSizeMultiplier,
                  height: 64 * scale.photoSizeMultiplier,
                  borderRadius: 32 * scale.photoSizeMultiplier,
                },
              ]}
            />
          )}
          <View>
            <Text style={styles.name}>{cv.fullName}</Text>
            <Text style={styles.role}>{cv.targetRole}</Text>
            <View style={styles.contactRow}>
              <Text>{cv.location}</Text>
              <Text>{cv.phone}</Text>
              <Text>{cv.email}</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {cv.summary && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Profil</Text>
            <Text style={styles.summary}>{cv.summary}</Text>
          </View>
        )}

        {cv.experiences.length > 0 && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Expérience professionnelle</Text>
            {cv.experiences.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHead}>
                  <Text style={styles.entryTitle}>
                    {exp.title} — {exp.company}
                  </Text>
                  <Text style={styles.entryMeta}>{exp.period}</Text>
                </View>
                {exp.bullets.map((bullet, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {cv.education.length > 0 && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Formation</Text>
            {cv.education.map((edu, i) => (
              <View key={i} style={styles.entryHead}>
                <Text style={styles.entryTitle}>
                  {edu.degree} — {edu.school}
                </Text>
                <Text style={styles.entryMeta}>{edu.year}</Text>
              </View>
            ))}
          </View>
        )}

        {cv.skills.length > 0 && <SkillsBlock cv={cv} sectionGap={sectionGap} />}

        {cv.languages && cv.languages.length > 0 && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Langues</Text>
            <Text>{cv.languages.join(" · ")}</Text>
          </View>
        )}

        {cv.interests && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
            <Text style={styles.summary}>{cv.interests}</Text>
          </View>
        )}

        {cv.additionalInfo && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Informations complémentaires</Text>
            <Text style={styles.summary}>{cv.additionalInfo}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>Créé gratuitement avec DIBOL AI — dibol-ai.vercel.app</Text>
      </Page>
    </Document>
  );
}
