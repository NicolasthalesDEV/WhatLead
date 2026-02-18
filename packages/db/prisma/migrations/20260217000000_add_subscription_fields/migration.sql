-- AlterTable: Add subscription fields to Company
ALTER TABLE "Company" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "Company" ADD COLUMN "planStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Company" ADD COLUMN "planStartedAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN "billingCycle" TEXT;
ALTER TABLE "Company" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Company" ADD COLUMN "mercadopagoCustomerId" TEXT;
ALTER TABLE "Company" ADD COLUMN "mercadopagoSubscriptionId" TEXT;
ALTER TABLE "Company" ADD COLUMN "lastPaymentAt" TIMESTAMP(3);
