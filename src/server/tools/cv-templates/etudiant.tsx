import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

import type { CvContent } from "@/lib/validations/tools";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { computeCvDensity, getDensityScale, type DensityScale } from "@/lib/tools/cv-density";

const meta = getCvTemplateMeta("etudiant");

const BASE_SECTION_GAP = 14;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", color: meta.ink },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  photo: { width: 60, height: 60, borderRadius: 12 },
  name: { fontSize: 21, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  role: { fontSize: 12.5, color: meta.accent, marginBottom: 4 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, fontSize: 9.5, color: "#444444" },
  banner: {
    backgroundColor: meta.accentSoft,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: { fontSize: 10, lineHeight: 1.5, color: meta.ink },
  section: { marginBottom: BASE_SECTION_GAP },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: meta.accent,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  entry: { marginBottom: 8 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, flex: 1, paddingRight: 8 },
  entryMeta: { fontSize: 9.5, color: "#555555", flexShrink: 0 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10, color: meta.accent },
  bulletText: { flex: 1, lineHeight: 1.4 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    fontSize: 9,
    backgroundColor: meta.accentSoft,
    color: meta.ink,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#AAAAAA", textAlign: "center" },
  closingBand: {
    position: "absolute",
    bottom: 44,
    left: 40,
    right: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: meta.accentSoft,
  },
});

export function EtudiantCvDocument({ cv, photoDataUri }: { cv: CvContent; photoDataUri?: string }) {
  const density = computeCvDensity(cv);
  const scale: DensityScale = getDensityScale("etudiant", density);
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
                  width: 60 * scale.photoSizeMultiplier,
                  height: 60 * scale.photoSizeMultiplier,
                  borderRadius: 12 * scale.photoSizeMultiplier,
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
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{cv.summary}</Text>
          </View>
        )}

        {/* Formation avant expérience — un premier CV a souvent plus à
            montrer côté études que côté emploi. */}
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

        {cv.experiences.length > 0 && (
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Expériences &amp; stages</Text>
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
          <View style={[styles.section, { marginBottom: sectionGap }]}>
            <Text style={styles.sectionTitle}>Langues</Text>
            <Text>{cv.languages.join(" · ")}</Text>
          </View>
        )}

        {/* Repère visuel discret en bas de page pour les CV courts — pure
            décoration, aucune information ajoutée. */}
        {density === "sparse" && <View style={styles.closingBand} />}

        <Text style={styles.footer} fixed>Créé gratuitement avec DIBOL AI — dibol-ai.vercel.app</Text>
      </Page>
    </Document>
  );
}
