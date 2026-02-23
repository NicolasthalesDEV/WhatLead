-- AlterTable
ALTER TABLE "ChatbotSettings" ADD COLUMN     "agentContext" TEXT,
ADD COLUMN     "agentPersonality" TEXT,
ADD COLUMN     "elevenLabsModel" TEXT NOT NULL DEFAULT 'eleven_multilingual_v2',
ADD COLUMN     "elevenLabsSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
ADD COLUMN     "elevenLabsStability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "elevenLabsStyle" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "openAIContextMessages" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "openAIMaxTokens" INTEGER NOT NULL DEFAULT 512,
ADD COLUMN     "openAITemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
ADD COLUMN     "responseLength" TEXT NOT NULL DEFAULT 'normal';
