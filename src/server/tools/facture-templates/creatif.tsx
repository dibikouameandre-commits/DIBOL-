import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

import type { FactureResultData } from "@/lib/validations/tools";
import { getFactureTemplateMeta } from "@/lib/tools/facture-templates";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { computeFactureDensity, getFactureDensityScale } from "@/lib/tools/facture-density";

const meta = getFactureTemplateMeta("creatif");

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: meta.ink },
  body: { paddingHorizontal: 40, paddingBottom: 40 },
  banner: {
    backgroundColor: meta.accent,
    paddingHorizontal: 40,
    paddingVertical: 26,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { width: 40, height: 40, marginBottom: 6, objectFit: "contain" },
  issuerName: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginBottom: 3 },
  issuerLine: { fontSize: 8.5, color: "#FFFFFF", opacity: 0.9, lineHeight: 1.4 },
  docPill: {
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
    color: meta.accent,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    letterSpacing: 1,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  docMetaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  docMetaLabel: { fontSize: 8.5, color: "#FFFFFF", opacity: 0.8 },
  docMetaValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  clientBlock: { marginBottom: 22, maxWidth: 260 },
  clientLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: meta.accent,
    marginBottom: 5,
  },
  clientName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  clientLine: { fontSize: 9.5, color: "#444444", lineHeight: 1.4 },
  table: { marginBottom: 4, borderRadius: 4, overflow: "hidden" },
  tableHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: meta.ink,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeadCell: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowOdd: { backgroundColor: meta.accentSoft },
  tableCell: { fontSize: 9.5 },
  colDescription: { flex: 1 },
  colQty: { width: 32, textAlign: "right" },
  colUnitPrice: { width: 92, textAlign: "right" },
  colDiscount: { width: 48, textAlign: "right" },
  colTotal: { width: 96, textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 14 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel: { fontSize: 9.5, color: "#555555" },
  totalsValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: meta.accent,
    borderRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  grandTotalLabel: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  grandTotalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  notesSection: { marginTop: 28, flexDirection: "row", gap: 24 },
  notesBlock: { flex: 1 },
  notesLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: meta.accent,
    marginBottom: 4,
  },
  notesText: { fontSize: 9, color: "#444444", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#AAAAAA",
    textAlign: "center",
  },
});

export function CreatifFactureDocument({ data }: { data: FactureResultData }) {
  const { form, totals } = data;
  const docLabel = form.documentType === "devis" ? "DEVIS" : "FACTURE";
  const scale = getFactureDensityScale(computeFactureDensity(data));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.banner, { marginBottom: 24 * scale.sectionGapMultiplier }]}>
          <View style={{ maxWidth: 260 }}>
            {form.issuerLogoDataUri && (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, not a DOM <img>
              <Image src={form.issuerLogoDataUri} style={styles.logo} />
            )}
            <Text style={styles.issuerName}>{form.issuerName}</Text>
            {form.issuerAddress && <Text style={styles.issuerLine}>{form.issuerAddress}</Text>}
            {(form.issuerPhone || form.issuerEmail) && (
              <Text style={styles.issuerLine}>
                {[form.issuerPhone, form.issuerEmail].filter(Boolean).join(" · ")}
              </Text>
            )}
            {form.issuerTaxId && (
              <Text style={styles.issuerLine}>RCCM / NIF : {form.issuerTaxId}</Text>
            )}
          </View>

          <View>
            <Text style={styles.docPill}>{docLabel}</Text>
            <View style={styles.docMetaRow}>
              <Text style={styles.docMetaLabel}>N°</Text>
              <Text style={styles.docMetaValue}>{form.documentNumber}</Text>
            </View>
            <View style={styles.docMetaRow}>
              <Text style={styles.docMetaLabel}>Date</Text>
              <Text style={styles.docMetaValue}>{form.documentDate}</Text>
            </View>
            {form.dueDate && (
              <View style={styles.docMetaRow}>
                <Text style={styles.docMetaLabel}>Échéance</Text>
                <Text style={styles.docMetaValue}>{form.dueDate}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.body, { paddingTop: 0 }]}>
          <View style={[styles.clientBlock, { marginBottom: 22 * scale.sectionGapMultiplier }]}>
            <Text style={styles.clientLabel}>
              {form.documentType === "devis" ? "Devis pour" : "Facturé à"}
            </Text>
            <Text style={styles.clientName}>{form.clientName}</Text>
            {form.clientAddress && <Text style={styles.clientLine}>{form.clientAddress}</Text>}
            {(form.clientPhone || form.clientEmail) && (
              <Text style={styles.clientLine}>
                {[form.clientPhone, form.clientEmail].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>

          <View style={styles.table}>
            <View style={[styles.tableHeadRow, { paddingVertical: 7 * scale.rowPaddingMultiplier }]}>
              <Text style={[styles.tableHeadCell, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeadCell, styles.colQty]}>Qté</Text>
              <Text style={[styles.tableHeadCell, styles.colUnitPrice]}>Prix unit.</Text>
              <Text style={[styles.tableHeadCell, styles.colDiscount]}>Remise</Text>
              <Text style={[styles.tableHeadCell, styles.colTotal]}>Montant</Text>
            </View>
            {totals.lines.map((line, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i % 2 === 1 ? styles.tableRowOdd : undefined,
                  { paddingVertical: 8 * scale.rowPaddingMultiplier },
                ]}
              >
                <Text style={[styles.tableCell, styles.colDescription]}>{line.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{line.quantity}</Text>
                <Text style={[styles.tableCell, styles.colUnitPrice]}>
                  {formatFactureAmount(line.unitPrice, form.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.colDiscount]}>
                  {line.discountPercent > 0 ? `-${line.discountPercent}%` : "—"}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatFactureAmount(line.lineTotal, form.currency)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.totalsBlock, { marginTop: 14 * scale.sectionGapMultiplier }]}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sous-total</Text>
              <Text style={styles.totalsValue}>
                {formatFactureAmount(totals.subtotal, form.currency)}
              </Text>
            </View>
            {totals.globalDiscountAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Remise globale ({totals.globalDiscountPercent}%)</Text>
                <Text style={styles.totalsValue}>
                  -{formatFactureAmount(totals.globalDiscountAmount, form.currency)}
                </Text>
              </View>
            )}
            {totals.taxAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Taxe ({totals.taxRatePercent}%)</Text>
                <Text style={styles.totalsValue}>
                  {formatFactureAmount(totals.taxAmount, form.currency)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatFactureAmount(totals.grandTotal, form.currency)}
              </Text>
            </View>
          </View>

          {(form.paymentTerms || form.notes) && (
            <View style={[styles.notesSection, { marginTop: 28 * scale.sectionGapMultiplier }]}>
              {form.paymentTerms && (
                <View style={styles.notesBlock}>
                  <Text style={styles.notesLabel}>Conditions de paiement</Text>
                  <Text style={styles.notesText}>{form.paymentTerms}</Text>
                </View>
              )}
              {form.notes && (
                <View style={styles.notesBlock}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{form.notes}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Text style={styles.footer} fixed>
          Créé gratuitement avec DIBOL AI — dibol-ai.vercel.app
        </Text>
      </Page>
    </Document>
  );
}
