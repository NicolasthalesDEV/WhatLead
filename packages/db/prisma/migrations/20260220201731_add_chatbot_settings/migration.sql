-- CreateTable
CREATE TABLE "ChatbotSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "botName" TEXT NOT NULL DEFAULT 'Assistente',
    "botEmoji" TEXT NOT NULL DEFAULT '🤖',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "typingDelay" INTEGER NOT NULL DEFAULT 1500,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxMessagesPerSession" INTEGER NOT NULL DEFAULT 50,
    "welcomeMessage" TEXT DEFAULT 'Olá! Como posso ajudar você hoje? 😊',
    "farewellMessage" TEXT DEFAULT 'Obrigado pelo contato! Até logo! 👋',
    "unknownCommandMessage" TEXT DEFAULT 'Desculpe, não entendi. Poderia reformular sua pergunta?',
    "offHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "offHoursMessage" TEXT DEFAULT 'Estamos fora do horário de atendimento. Retornaremos em breve!',
    "businessHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "businessHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "businessDays" TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI']::TEXT[],
    "handoffEnabled" BOOLEAN NOT NULL DEFAULT true,
    "handoffKeyword" TEXT NOT NULL DEFAULT 'humano',
    "handoffMessage" TEXT DEFAULT 'Transferindo para um atendente humano...',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotSettings_companyId_key" ON "ChatbotSettings"("companyId");

-- CreateIndex
CREATE INDEX "ChatbotSettings_companyId_idx" ON "ChatbotSettings"("companyId");

-- AddForeignKey
ALTER TABLE "ChatbotSettings" ADD CONSTRAINT "ChatbotSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
