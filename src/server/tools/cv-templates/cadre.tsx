import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale, type DensityScale } from "@/lib/tools/cv-density";

const meta = getCvTemplateMeta("cadre");

const BASE_SECTION_GAP = 14;

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: meta.ink },
  headerBand: {
    backgroundColor: "#1B1D22",
    color: "#FFFFFF",
    padding: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  photo: { width: 66, height: 66, borderRadius: 4 },
  name: { fontSize: 21, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 2 },
  role: { fontSize: 11.5, color: meta.accent, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, fontSize: 9, color: "#CCCCCC" },
  body: { padding: 32 },
  summaryBox: {
    borderLeft: `2 solid ${meta.accent}`,
    paddingLeft: 12,
    marginBottom: 18,
  },
  summaryText: { fontSize: 10.5, lineHeight: 1.55, fontStyle: "italic", color: "#333333" },
  section: { marginBottom: BASE_SECTION_GAP },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: meta.accent,
    marginBottom: 8,
  },
  entry: { marginBottom: 9 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, flex: 1, paddingRight: 8 },
  entryMeta: { fontSize: 9, color: "#666666", flexShrink: 0 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10, color: meta.accent },
  bulletText: { flex: 1, lineHeight: 1.4 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap" },
  skillCol: { width: "50%", marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 5 },
  skillDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: meta.accent },
  skillText: { fontSize: 9.5 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: "#AAAAAA", textAlign: "center" },
});

export function CadreCvDocument({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const scale: DensityScale = getDensityScale("cadre", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontSize: 10 + scale.bodyFontDelta }]}>
        <View style={styles.headerBand}>
          {photoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, not a DOM <img>
            <Image
              src={photoDataUri}
              style={[
                styles.photo,
                {
                  width: 66 * scale.photoSizeMultiplier,
                  height: 66 * scale.photoSizeMultiplier,
                  borderRadius: 4 * scale.photoSizeMultiplier,
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

        <View style={[styles.body, { paddingVertical: 32 + scale.pagePaddingDelta }]}>
          {cv.summary && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{cv.summary}</Text>
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
                      <Text style={styles.bulletDot}>—</Text>
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

          {cv.skills.length > 0 && (
            <View style={[styles.section, { marginBottom: sectionGap }]}>
              <Text style={styles.sectionTitle}>Compétences clés</Text>
              <View style={styles.skillsRow}>
                {cv.skills.map((skill, i) => (
                  <View key={i} style={styles.skillCol}>
                    <View style={styles.skillDot} />
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {cv.languages && cv.languages.length > 0 && (
            <View style={[styles.section, { marginBottom: sectionGap }]}>
              <Text style={styles.sectionTitle}>Langues</Text>
              <Text>{cv.languages.join(" · ")}</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer} fixed>Créé gratuitement avec DIBOL AI — dibol-ai.vercel.app</Text>
      </Page>
    </Document>
  );
}
