-- Phase B (multi-entreprise): supports invalidating a JWT session
-- immediately when a role or password changes, instead of waiting up to
-- 30 days for the token to expire naturally.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
