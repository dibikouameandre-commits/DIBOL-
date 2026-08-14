-- Rename fileUrl -> fileKey (now stores a local storage key, not a public URL)
ALTER TABLE "Product" RENAME COLUMN "fileUrl" TO "fileKey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "fileName" TEXT;
