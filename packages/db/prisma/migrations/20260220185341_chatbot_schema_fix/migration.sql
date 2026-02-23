/*
  Warnings:

  - You are about to drop the column `config` on the `ChatbotNode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChatbotExecution" ADD COLUMN     "context" JSONB DEFAULT '{}',
ALTER COLUMN "variables" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "ChatbotFlow" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "triggerType" SET DEFAULT 'KEYWORD',
ALTER COLUMN "active" SET DEFAULT false;

-- AlterTable
ALTER TABLE "ChatbotNode" DROP COLUMN "config",
ADD COLUMN     "connections" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "name" SET DEFAULT '',
ALTER COLUMN "position" SET DEFAULT '{"x":0,"y":0}';

-- CreateIndex
CREATE INDEX "ChatbotFlow_status_idx" ON "ChatbotFlow"("status");
