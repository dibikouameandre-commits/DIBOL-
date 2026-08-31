import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("creatif");

const BASE = { padding: 40, fontSize: 11, lineHeight: 1.5, paragraphGap: 14 };

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", color: meta.ink },
  headerBand: { backgroundColor: meta.accent, padding: 28 },
  senderName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 4 },
  senderLine: { fontSize: 9.5, color: "#FFFFFF", opacity: 0.9 },
  content: {},
  dateLine: { fontSize: 10, color: "#666666", marginTop: 4, marginBottom: 22, textAlign: "right" },
  recipientBlock: { marginBottom: 20 },
  recipientLine: { fontSize: 10.5 },
  subject: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: meta.accent,
    marginBottom: 20,
  },
  salutation: { marginBottom: 14 },
  paragraphRow: { flexDirection: "row" },
  paragraphBar: { width: 3, backgroundColor: meta.accentSoft, marginRight: 12, borderRadius: 2 },
  paragraph: { flex: 1, textAlign: "justify" },
  signOff: { marginTop: 24, paddingLeft: 32 },
  signOffName: { marginTop: 22, fontFamily: "Helvetica-Bold", color: meta.accent },
});

export function CreatifLettreDocument({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontSize: scale.fontSize, lineHeight: scale.lineHeight }]}>
        <View style={styles.headerBand}>
          <Text style={styles.senderName}>{letter.fullName}</Text>
          <Text style={styles.senderLine}>
            {letter.location} · {letter.phone} · {letter.email}
          </Text>
        </View>

        <View style={{ padding: scale.padding }}>
          <Text style={styles.dateLine}>{`${getCityOnly(letter.location)}, le ${formatFrenchDate(letter.createdAt)}`}</Text>

          <View style={styles.recipientBlock}>
            <Text style={styles.recipientLine}>{letter.companyName}</Text>
            {letter.hiringManagerName && (
              <Text style={styles.recipientLine}>{`À l'attention de ${letter.hiringManagerName}`}</Text>
            )}
          </View>

          <Text style={styles.subject}>{`Objet : ${getSubjectLine(letter)}`}</Text>

          <Text style={styles.salutation}>{getSalutation(letter)}</Text>

          {letter.paragraphs.map((paragraph, i) => (
            <View key={i} style={[styles.paragraphRow, { marginBottom: scale.paragraphGap }]}>
              <View style={styles.paragraphBar} />
              <Text style={styles.paragraph}>{paragraph}</Text>
            </View>
          ))}

          <View style={styles.signOff}>
            <Text>Cordialement,</Text>
            <Text style={styles.signOffName}>{letter.fullName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
