import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale, type DensityScale } from "@/lib/tools/cv-density";
import { SKILL_LEVEL_RATIO } from "./skill-level";

const meta = getCvTemplateMeta("moderne");

const SIDEBAR_WIDTH = 165;
const BASE_SECTION_GAP = 14;

const styles = StyleSheet.create({
  page: { flexDirection: "row", fontSize: 10, fontFamily: "Helvetica", color: meta.ink },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: meta.accent,
    color: "#FFFFFF",
    padding: 24,
  },
  main: { flex: 1, padding: 32 },
  photo: { width: 78, height: 78, borderRadius: 39, marginBottom: 16, alignSelf: "center" },
  sidebarSection: { marginBottom: 18 },
  sidebarTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#FFFFFF",
    opacity: 0.85,
    marginBottom: 6,
  },
  sidebarText: { fontSize: 9, color: "#FFFFFF", marginBottom: 4, lineHeight: 1.4 },
  skillRow: { marginBottom: 6 },
  skillName: { fontSize: 9, color: "#FFFFFF", marginBottom: 2 },
  skillBarTrack: { height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
  skillBarFill: { height: 3, backgroundColor: "#FFFFFF", borderRadius: 2 },
  chip: {
    fontSize: 8.5,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 3,
    marginBottom: 4,
    marginRight: 4,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap" },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", color: meta.ink, marginBottom: 2 },
  role: { fontSize: 12.5, color: meta.accent, fontFamily: "Helvetica-Bold", marginBottom: 16 },
  section: { marginBottom: BASE_SECTION_GAP },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: meta.accent,
    marginBottom: 6,
  },
  summary: { lineHeight: 1.5, fontSize: 10 },
  entry: { marginBottom: 8 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, flex: 1, paddingRight: 8 },
  entryMeta: { fontSize: 9, color: "#666666", flexShrink: 0 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, lineHeight: 1.4, fontSize: 9.5 },
});

export function ModerneCvDocument({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  // The sidebar keeps its exact structure/colors (Moderne's identity) —
  // only the main column's breathing room and base text size respond to
  // content volume, same lever as every other template.
  const scale: DensityScale = getDensityScale("moderne", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;

  const withLevel = cv.skills.filter((s) => s.level);
  const withoutLevel = cv.skills.filter((s) => !s.level);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontSize: 10 + scale.bodyFontDelta }]}>
        <View style={styles.sidebar}>
          {photoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, not a DOM <img>
            <Image src={photoDataUri} style={styles.photo} />
          )}

          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            <Text style={styles.sidebarText}>{cv.location}</Text>
            <Text style={styles.sidebarText}>{cv.phone}</Text>
            <Text style={styles.sidebarText}>{cv.email}</Text>
          </View>

          {cv.skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Compétences</Text>
              {withLevel.map((skill, i) => (
                <View key={i} style={styles.skillRow}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.skillBarTrack}>
                    <View
                      style={[styles.skillBarFill, { width: `${SKILL_LEVEL_RATIO[skill.level!] * 100}%` }]}
                    />
                  </View>
                </View>
              ))}
              {withoutLevel.length > 0 && (
                <View style={styles.chipsRow}>
                  {withoutLevel.map((skill, i) => (
                    <Text key={i} style={styles.chip}>
                      {skill.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {cv.languages && cv.languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Langues</Text>
              <Text style={styles.sidebarText}>{cv.languages.join(" · ")}</Text>
            </View>
          )}
        </View>

        <View style={[styles.main, { paddingVertical: 32 + scale.pagePaddingDelta }]}>
          <Text style={styles.name}>{cv.fullName}</Text>
          <Text style={styles.role}>{cv.targetRole}</Text>

          {cv.summary && (
            <View style={[styles.section, { marginBottom: sectionGap }]}>
              <Text style={styles.sectionTitle}>Profil</Text>
              <Text style={styles.summary}>{cv.summary}</Text>
            </View>
          )}

          {cv.experiences.length > 0 && (
            <View style={[styles.section, { marginBottom: sectionGap }]}>
              <Text style={styles.sectionTitle}>Expérience</Text>
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
        </View>
      </Page>
    </Document>
  );
}
