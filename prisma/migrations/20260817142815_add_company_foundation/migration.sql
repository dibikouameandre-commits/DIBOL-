-- Phase A (multi-entreprise): foundation only, no behavior change yet.
-- New Role enum values are added here, kept unused until Phase B updates
-- the application code that checks them (Postgres forbids using a new
-- enum value in the same transaction it was added in).

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- AlterEnum (additive only, "ADMIN" is left untouched)
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'COMPANY_ADMIN';

-- Seed the default company that existing data will be backfilled into
INSERT INTO "Company" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('default-company', 'Entreprise par défaut', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
