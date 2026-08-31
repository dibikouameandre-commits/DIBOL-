-- DIBOL AI V2, Phase 1: free AI tools foundation.
-- Purely additive — no existing table touched, no multi-entreprise model
-- affected. ToolRun/ToolResult are global to the platform (no companyId),
-- since free tools are DIBOL AI's own acquisition product, not part of any
-- client company's catalogue.

-- CreateTable
CREATE TABLE "ToolRun" (
    "id" TEXT NOT NULL,
    "toolSlug" TEXT NOT NULL,
    "userId" TEXT,
    "anonId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "shareSlug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolRun_toolSlug_anonId_createdAt_idx" ON "ToolRun"("toolSlug", "anonId", "createdAt");

-- CreateIndex
CREATE INDEX "ToolRun_toolSlug_ipHash_createdAt_idx" ON "ToolRun"("toolSlug", "ipHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ToolResult_runId_key" ON "ToolResult"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolResult_shareSlug_key" ON "ToolResult"("shareSlug");

-- AddForeignKey
ALTER TABLE "ToolRun" ADD CONSTRAINT "ToolRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolResult" ADD CONSTRAINT "ToolResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ToolRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
