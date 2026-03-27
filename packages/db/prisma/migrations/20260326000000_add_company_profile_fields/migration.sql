-- AlterTable: add profile fields to Company
ALTER TABLE "Company"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "zipCode" TEXT,
  ADD COLUMN "country" TEXT DEFAULT 'BR',
  ADD COLUMN "document" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "businessHours" JSONB,
  ADD COLUMN "autoMessages" JSONB;
