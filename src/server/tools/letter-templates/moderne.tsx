import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { LetterResultData } from "@/lib/validations/tools";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly, getSalutation, getSubjectLine } from "@/server/tools/letter-format";

const meta = getLetterTemplateMeta("moderne");

const BASE = { padding: 48, fontSize: 11, lineHeight: 1.5, paragraphGap: 14 };

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", color: meta.ink },
  topBar: { height: 7, backgroundColor: meta.accent },
  content: {},
  senderName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: meta.accent, marginBottom: 3 },
  senderLine: { fontSize: 10, color: "#444444" },
  dateLine: { fontSize: 10, color: "#444444", marginTop: 24, marginBottom: 24, textAlign: "right" },
  recipientBlock: { marginBottom: 20 },
  recipientLine: { fontSize: 10.5 },
  subject: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: meta.accent,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginBottom: 22,
  },
  salutation: { marginBottom: 14 },
  paragraph: { textAlign: "justify" },
  signOff: { marginTop: 26 },
  signOffName: { marginTop: 22, fontFamily: "Helvetica-Bold", color: meta.accent },
});

export function ModerneLettreDocument({ letter }: { letter: LetterResultData }) {
  const scale = getLetterDensityScale(letter, BASE);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontSize: scale.fontSize, lineHeight: scale.lineHeight }]}>
        <View style={styles.topBar} />
        <View style={{ padding: scale.padding }}>
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

          <Text style={styles.subject}>{getSubjectLine(letter)}</Text>

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
        </View>
      </Page>
    </Document>
  );
}
