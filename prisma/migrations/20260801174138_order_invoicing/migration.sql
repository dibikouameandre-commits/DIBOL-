-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stripeInvoiceId" TEXT,
ADD COLUMN     "invoicePdfUrl" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeInvoiceId_key" ON "Order"("stripeInvoiceId");
