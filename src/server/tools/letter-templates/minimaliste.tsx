import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("minimaliste");

// No color, no rules, no pills — hierarchy comes only from spacing and
// weight. The most restrained of the 5 templates, deliberately.
const BASE = { padding: 58, fontSize: 10.5, lineHeight: 1.6, paragraphGap: 16 };

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", color: meta.ink },
  senderName: { fontSize: 12.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, marginBottom: 4 },
  senderLine: { fontSize: 9.5, color: "#666666" },
  dateLine: { fontSize: 9.5, color: "#666666", marginTop: 30, marginBottom: 30 },
  recipientBlock: { marginBottom: 26 },
  recipientLine: { fontSize: 10 },
  subjectLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#888888",
    marginBottom: 3,
  },
  subject: { fontSize: 10.5, marginBottom: 26 },
  salutation: { marginBottom: 16 },
  paragraph: { textAlign: "left" },
  signOff: { marginTop: 30 },
  signOffName: { marginTop: 24 },
});

export function MinimalisteLettreDocument({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <Document>
      <Page
        size="A4"
        style={[styles.page, { padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight }]}
      >
        <View>
          <Text style={styles.senderName}>{letter.fullName}</Text>
          <Text style={styles.senderLine}>{letter.location}</Text>
          <Text style={styles.senderLine}>{letter.phone}</Text>
          <Text style={styles.senderLine}>{letter.email}</Text>
        </View>

        <Text style={styles.dateLine}>{`${getCityOnly(letter.location)}, le ${formatFrenchDate(letter.createdAt)}`}</Text>

        <View style={styles.recipientBlock}>
          <Text style={styles.recipientLine}>{letter.companyName}</Text>
          {letter.hiringManagerName && (
            <Text style={styles.recipientLine}>{`À l'attention de ${letter.hiringManagerName}`}</Text>
          )}
        </View>

        <View>
          <Text style={styles.subjectLabel}>Objet</Text>
          <Text style={styles.subject}>{getSubjectLine(letter)}</Text>
        </View>

        <Text style={styles.salutation}>{getSalutation(letter)}</Text>

        {letter.paragraphs.map((paragraph, i) => (
          <Text key={i} style={[styles.paragraph, { marginBottom: scale.paragraphGap }]}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.signOff}>
          <Text>Cordialement,</Text>
          <Text style={styles.signOffName}>{letter.fullName}</Text>
        </View>
      </Page>
    </Document>
  );
}
