-- AlterTable: Ticket model - add missing fields
ALTER TABLE "Ticket" RENAME COLUMN "title" TO "subject";
ALTER TABLE "Ticket" ADD COLUMN "description" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "Ticket" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Ticket" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "slaDeadline" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Ticket" RENAME COLUMN "assigneeId" TO "assignedToId";

-- AlterTable: Add default values to existing columns (make safer)
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'open';
ALTER TABLE "Ticket" ALTER COLUMN "priority" SET DEFAULT 'medium';

-- CreateTable: TicketComment
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for TicketComment
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");

-- AddForeignKey: Ticket -> Company cascade
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Ticket -> Customer
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Ticket -> User (assignee)
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Ticket -> User (createdBy)
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: TicketComment -> Ticket
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TicketComment -> User
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: Ticket indexes
CREATE INDEX "Ticket_companyId_idx" ON "Ticket"("companyId");
CREATE INDEX "Ticket_customerId_idx" ON "Ticket"("customerId");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- AlterTable: NPSSurvey - add Company relation
ALTER TABLE "NPSSurvey" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey: NPSSurvey -> Company
ALTER TABLE "NPSSurvey" ADD CONSTRAINT "NPSSurvey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: NPSSurvey
CREATE INDEX "NPSSurvey_companyId_idx" ON "NPSSurvey"("companyId");

-- AddForeignKey: NPSResponse -> NPSSurvey
ALTER TABLE "NPSResponse" ADD CONSTRAINT "NPSResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "NPSSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: NPSResponse
CREATE INDEX "NPSResponse_surveyId_idx" ON "NPSResponse"("surveyId");
CREATE INDEX "NPSResponse_customerId_idx" ON "NPSResponse"("customerId");
