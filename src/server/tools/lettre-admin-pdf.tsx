import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

import type { LettreAdminResultData } from "@/lib/validations/tools";
import { getLetterDensityScale } from "@/lib/tools/letter-density";
import { formatFrenchDate, getCityOnly } from "@/server/tools/letter-format";

// Un seul modèle pour le lancement de cet outil (comme le CV et la lettre de
// motivation à leurs débuts) — un choix de modèles pourra être ajouté plus
// tard sans changer la structure de données.
const BASE = { padding: 52, fontSize: 11, lineHeight: 1.5, paragraphGap: 14 };

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", color: "#1a1a1a" },
  senderName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  senderLine: { fontSize: 10, color: "#444444" },
  dateLine: { fontSize: 10, color: "#444444", marginTop: 24, marginBottom: 28, textAlign: "right" },
  recipientBlock: { marginBottom: 28 },
  recipientLine: { fontSize: 10.5 },
  subject: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 22 },
  salutation: { marginBottom: 14 },
  paragraph: { textAlign: "justify" },
  closing: { marginTop: 10 },
  signOff: { marginTop: 26 },
  signOffName: { marginTop: 22, fontFamily: "Helvetica-Bold" },
});

export function LettreAdminDocument({ lettre }: { lettre: LettreAdminResultData }) {
  const scale = getLetterDensityScale({ paragraphs: lettre.content.paragraphs }, BASE);
  const { form, content } = lettre;

  return (
    <Document>
      <Page
        size="A4"
        style={[styles.page, { padding: scale.padding, fontSize: scale.fontSize, lineHeight: scale.lineHeight }]}
      >
        <View>
          <Text style={styles.senderName}>{form.senderName}</Text>
          {form.senderAddress && <Text style={styles.senderLine}>{form.senderAddress}</Text>}
          {form.senderPhone && <Text style={styles.senderLine}>{form.senderPhone}</Text>}
          {form.senderEmail && <Text style={styles.senderLine}>{form.senderEmail}</Text>}
        </View>

        <Text style={styles.dateLine}>{`${getCityOnly(form.city)}, le ${formatFrenchDate(lettre.createdAt)}`}</Text>

        <View style={styles.recipientBlock}>
          <Text style={styles.recipientLine}>{form.recipientName}</Text>
          {form.recipientAddress && (
            <Text style={styles.recipientLine}>{form.recipientAddress}</Text>
          )}
        </View>

        <Text style={styles.subject}>{content.subject}</Text>

        <Text style={styles.salutation}>{content.greeting}</Text>

        {content.paragraphs.map((paragraph, i) => (
          <Text key={i} style={[styles.paragraph, { marginBottom: scale.paragraphGap }]}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.signOff}>
          <Text style={styles.closing}>{content.closing}</Text>
          <Text style={styles.signOffName}>{content.signatureName}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderLettreAdminPdf(lettre: LettreAdminResultData): Promise<Buffer> {
  return renderToBuffer(<LettreAdminDocument lettre={lettre} />);
}
