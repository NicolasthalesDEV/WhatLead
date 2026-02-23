-- AlterTable
ALTER TABLE "ChatbotSettings" ADD COLUMN     "elevenLabsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "elevenLabsVoiceId" TEXT,
ADD COLUMN     "openAIEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openAIModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
ADD COLUMN     "openAISystemPrompt" TEXT;
