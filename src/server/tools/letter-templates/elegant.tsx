import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("elegant");

// A refined serif typeface (Times, a core PDF font — no embedding needed,
// so it stays print-safe everywhere) is this template's main
// differentiator: it reads as more formal/executive than the sans-serif
// templates, appropriate for representation or senior roles.
const BASE = { padding: 56, fontSize: 11, lineHeight: 1.55, paragraphGap: 15 };

const styles = StyleSheet.create({
  page: { fontFamily: "Times-Roman", color: meta.ink },
  header: { alignItems: "center", marginBottom: 18 },
  senderName: {
    fontSize: 17,
    fontFamily: "Times-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: meta.accent,
    marginBottom: 6,
  },
  senderLine: { fontSize: 9.5, color: "#5A5A5A" },
  rule: { borderBottom: `0.75 solid ${meta.accent}`, width: 90, marginTop: 10, marginBottom: 20 },
  dateLine: { fontSize: 10, fontFamily: "Times-Italic", color: "#5A5A5A", marginBottom: 24, textAlign: "right" },
  recipientBlock: { marginBottom: 22 },
  recipientLine: { fontSize: 10.5 },
  subject: { fontSize: 11, fontFamily: "Times-BoldItalic", color: meta.accent, marginBottom: 22 },
  salutation: { marginBottom: 14 },
  paragraph: { textAlign: "justify" },
  signOff: { marginTop: 26 },
  signOffName: { marginTop: 22, fontFamily: "Times-Bold" },
});

export function ElegantLettreDocument({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <Document>
      <Page
        size="A4"
        style={[styles.page, { padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight }]}
      >
        <View style={styles.header}>
          <Text style={styles.senderName}>{letter.fullName}</Text>
          <Text style={styles.senderLine}>
            {letter.location} · {letter.phone} · {letter.email}
          </Text>
          <View style={styles.rule} />
        </View>

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
          <Text key={i} style={[styles.paragraph, { marginBottom: scale.paragraphGap }]}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.signOff}>
          <Text style={{ fontFamily: "Times-Italic" }}>Cordialement,</Text>
          <Text style={styles.signOffName}>{letter.fullName}</Text>
        </View>
      </Page>
    </Document>
  );
}
