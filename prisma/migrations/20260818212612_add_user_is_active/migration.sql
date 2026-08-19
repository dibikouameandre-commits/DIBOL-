-- Phase C (multi-entreprise): lets a COMPANY_ADMIN deactivate/reactivate a
-- user in their own company without deleting the account.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
