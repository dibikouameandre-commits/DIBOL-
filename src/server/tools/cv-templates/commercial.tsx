import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale, type DensityScale } from "@/lib/tools/cv-density";

const meta = getCvTemplateMeta("commercial");

const BASE_SECTION_GAP = 14;

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10.5, fontFamily: "Helvetica", color: meta.ink },
  topBar: { height: 8, backgroundColor: meta.accent },
  content: { padding: 36 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 },
  photo: { width: 62, height: 62, borderRadius: 31 },
  name: { fontSize: 23, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  role: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: meta.accent,
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 6,
  },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, fontSize: 9.5, color: "#444444" },
  section: { marginBottom: BASE_SECTION_GAP },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: meta.accent,
    marginBottom: 6,
  },
  summary: { lineHeight: 1.5, fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  entry: { marginBottom: 9 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, flex: 1, paddingRight: 8 },
  entryMeta: { fontSize: 9.5, color: "#555555", flexShrink: 0 },
  bullet: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3, gap: 6 },
  bulletMarker: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: meta.accentSoft,
    color: meta.accent,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3,
  },
  bulletText: { flex: 1, lineHeight: 1.4 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: meta.accent,
    borderWidth: 1,
    borderColor: meta.accent,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 8, color: "#AAAAAA", textAlign: "center" },
});

export function CommercialCvDocument({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const scale: DensityScale = getDensityScale("commercial", computeCvDensity(cv));
  const sectionGap = BASE_SECTION_GAP * scale.sectionGapMultiplier;

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontSize: 10.5 + scale.bodyFontDelta }]}>
        <View style={styles.topBar} />
        <View style={[styles.content, { paddingVertical: 36 + scale.pagePaddingDelta }]}>
          <View style={styles.header}>
            {photoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, not a DOM <img>
              <Image
                src={photoDataUri}
                style={[
                  styles.photo,
                  {
                    width: 62 * scale.photoSizeMultiplier,
                    height: 62 * scale.photoSizeMultiplier,
                    borderRadius: 31 * scale.photoSizeMultiplier,
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

          {cv.summary && (
            <View style={[styles.section, { marginBottom: sectionGap }]}>
              <Text style={styles.summary}>{cv.summary}</Text>
            </View>
          )}

          {cv.experiences.length > 0 && (
            <View style={[styles.section, { marginBottom: sectionGap }]}>
              <Text style={styles.sectionTitle}>Résultats &amp; expérience</Text>
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
                      <Text style={styles.bulletMarker}>{j + 1}</Text>
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
              <Text style={styles.sectionTitle}>Compétences</Text>
              <View style={styles.chipsRow}>
                {cv.skills.map((skill, i) => (
                  <Text key={i} style={styles.chip}>
                    {skill.name}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {cv.languages && cv.languages.length > 0 && (
            <View style={[styles.section, { marginBottom: sectionGap, marginTop: 0 }]}>
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
