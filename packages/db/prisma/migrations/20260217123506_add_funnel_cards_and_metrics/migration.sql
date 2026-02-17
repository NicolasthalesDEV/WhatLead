-- AlterTable
ALTER TABLE "FunnelStage" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "FunnelCard" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" INTEGER,
    "probability" INTEGER NOT NULL DEFAULT 50,
    "tags" TEXT[],
    "assignedToId" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "quotesCreated" INTEGER NOT NULL DEFAULT 0,
    "quotesAccepted" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "messagesReceived" INTEGER NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "responseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentsReceived" INTEGER NOT NULL DEFAULT 0,
    "pixPayments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunnelCard_companyId_idx" ON "FunnelCard"("companyId");

-- CreateIndex
CREATE INDEX "FunnelCard_stageId_idx" ON "FunnelCard"("stageId");

-- CreateIndex
CREATE INDEX "FunnelCard_customerId_idx" ON "FunnelCard"("customerId");

-- CreateIndex
CREATE INDEX "DailyMetric_companyId_idx" ON "DailyMetric"("companyId");

-- CreateIndex
CREATE INDEX "DailyMetric_date_idx" ON "DailyMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_companyId_date_key" ON "DailyMetric"("companyId", "date");

-- AddForeignKey
ALTER TABLE "FunnelCard" ADD CONSTRAINT "FunnelCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelCard" ADD CONSTRAINT "FunnelCard_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "FunnelStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelCard" ADD CONSTRAINT "FunnelCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelCard" ADD CONSTRAINT "FunnelCard_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetric" ADD CONSTRAINT "DailyMetric_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
