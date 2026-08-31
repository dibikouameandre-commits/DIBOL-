import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

import type { BusinessPlanResultData } from "@/lib/validations/tools";
import { formatFrenchDate, getCityOnly } from "@/server/tools/letter-format";

// Un seul modèle pour le lancement de cet outil (comme la lettre
// administrative et le nom d'entreprise à leurs débuts) — @react-pdf/renderer
// pagine automatiquement si le contenu dépasse une page, pas de gestion
// manuelle nécessaire ici.
const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.5 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555555", marginBottom: 2 },
  dateLine: { fontSize: 9.5, color: "#777777", marginBottom: 24 },
  divider: { borderBottom: "1 solid #DDDDDD", marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#4338CA",
    marginBottom: 5,
  },
  sectionBody: { textAlign: "justify" },
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

const SECTIONS: { key: keyof BusinessPlanResultData["content"]; title: string }[] = [
  { key: "executiveSummary", title: "Résumé exécutif" },
  { key: "problem", title: "Problème" },
  { key: "solution", title: "Solution" },
  { key: "targetMarket", title: "Marché cible" },
  { key: "businessModel", title: "Modèle économique" },
  { key: "competitiveAdvantage", title: "Avantage concurrentiel" },
  { key: "fundingNeed", title: "Besoin de financement" },
  { key: "nextSteps", title: "Prochaines étapes" },
];

export function BusinessPlanDocument({ plan }: { plan: BusinessPlanResultData }) {
  const { form, content } = plan;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{form.projectName}</Text>
        <Text style={styles.subtitle}>Business plan préparé par {form.founderName}</Text>
        <Text style={styles.dateLine}>
          {getCityOnly(form.location)}, le {formatFrenchDate(plan.createdAt)}
        </Text>
        <View style={styles.divider} />

        {SECTIONS.map(({ key, title }) => (
          <View key={key} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionBody}>{content[key]}</Text>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Créé gratuitement avec DIBOL AI — dibol-ai.vercel.app
        </Text>
      </Page>
    </Document>
  );
}

export async function renderBusinessPlanPdf(plan: BusinessPlanResultData): Promise<Buffer> {
  return renderToBuffer(<BusinessPlanDocument plan={plan} />);
}
