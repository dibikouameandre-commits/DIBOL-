import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

import { CONTRAT_PARTY_ROLES, contratTypeLabels, type ContratResultData } from "@/lib/validations/tools";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { formatFrenchDate, getCityOnly } from "@/server/tools/letter-format";

// Texte du disclaimer — toujours identique, jamais généré par l'IA, jamais
// modifiable par les entrées de l'utilisateur. Imprimé en haut de chaque
// contrat généré par cet outil.
export const CONTRAT_DISCLAIMER =
  "Ce document est un modèle simplifié généré automatiquement à titre informatif. Il ne remplace pas un conseil juridique professionnel. Fais-le relire par un avocat ou un juriste avant toute signature.";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.5 },
  disclaimerBox: {
    border: "1 solid #D97706",
    backgroundColor: "#FFFBEB",
    padding: 10,
    marginBottom: 24,
  },
  disclaimerText: { fontSize: 8.5, color: "#92400E", fontStyle: "italic" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 20 },
  intro: { textAlign: "justify", marginBottom: 20 },
  partyLine: { marginBottom: 3 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sectionBody: { textAlign: "justify" },
  dateLine: { marginTop: 20, marginBottom: 30 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  signatureBlock: { width: "45%" },
  signatureLabel: { fontFamily: "Helvetica-Bold", marginBottom: 30 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#AAAAAA",
    textAlign: "center",
  },
});

export function ContratDocument({ contrat }: { contrat: ContratResultData }) {
  const { form, content } = contrat;
  const roles = CONTRAT_PARTY_ROLES[form.contratType];
  const typeLabel = contratTypeLabels[form.contratType];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>{CONTRAT_DISCLAIMER}</Text>
        </View>

        <Text style={styles.title}>{typeLabel.toUpperCase()}</Text>

        <Text style={styles.intro}>ENTRE LES SOUSSIGNÉS :</Text>
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.partyLine}>
            {form.partyAName}
            {form.partyAAddress ? `, ${form.partyAAddress}` : ""}, ci-après désigné « {roles.partyA} »,
          </Text>
        </View>
        <Text style={[styles.intro, { marginBottom: 10 }]}>D&apos;une part,</Text>
        <Text style={styles.intro}>ET :</Text>
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.partyLine}>
            {form.partyBName}
            {form.partyBAddress ? `, ${form.partyBAddress}` : ""}, ci-après désigné « {roles.partyB} »,
          </Text>
        </View>
        <Text style={[styles.intro, { marginBottom: 20 }]}>
          D&apos;autre part, il a été convenu ce qui suit :
        </Text>

        {content.clauses.map((clause, i) => (
          <View key={i} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              Article {i + 1} — {clause.title}
            </Text>
            <Text style={styles.sectionBody}>{clause.text}</Text>
          </View>
        ))}

        <Text style={styles.dateLine}>
          Fait à {getCityOnly(form.city)}, le {formatFrenchDate(contrat.createdAt)}, en deux exemplaires.
        </Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{roles.partyA}</Text>
            <Text>{form.partyAName}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{roles.partyB}</Text>
            <Text>{form.partyBName}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Créé gratuitement avec DIBOL AI — dibol-ai.vercel.app · Montant convenu :{" "}
          {formatFactureAmount(form.amount, form.currency)} · Durée : {form.duration}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderContratPdf(contrat: ContratResultData): Promise<Buffer> {
  return renderToBuffer(<ContratDocument contrat={contrat} />);
}
