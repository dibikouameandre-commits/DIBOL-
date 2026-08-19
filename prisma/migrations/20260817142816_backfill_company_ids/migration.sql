-- Phase A (multi-entreprise), part 2: add nullable companyId columns and
-- backfill existing Category/Product/Order rows into the default company.
-- User.companyId is intentionally left NULL here — no user currently has a
-- CLIENT/COMPANY_ADMIN role that would need one; the existing ADMIN row's
-- role migration to SUPER_ADMIN happens in Phase B alongside the code that
-- depends on it.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Category" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Product" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Order" ADD COLUMN "companyId" TEXT;

-- Backfill existing catalogue/order data into the default company
UPDATE "Category" SET "companyId" = 'default-company';
UPDATE "Product" SET "companyId" = 'default-company';
UPDATE "Order" SET "companyId" = 'default-company';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
