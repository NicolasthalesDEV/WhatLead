-- CreateTable
CREATE TABLE "ChatbotTrigger" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conditions" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotTrigger_companyId_idx" ON "ChatbotTrigger"("companyId");

-- CreateIndex
CREATE INDEX "ChatbotTrigger_flowId_idx" ON "ChatbotTrigger"("flowId");

-- CreateIndex
CREATE INDEX "ChatbotTrigger_type_idx" ON "ChatbotTrigger"("type");

-- CreateIndex
CREATE INDEX "ChatbotTrigger_enabled_idx" ON "ChatbotTrigger"("enabled");

-- AddForeignKey
ALTER TABLE "ChatbotTrigger" ADD CONSTRAINT "ChatbotTrigger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
