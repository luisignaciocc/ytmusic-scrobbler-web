-- CreateTable
CREATE TABLE "SupportEmail" (
    "id" TEXT NOT NULL,
    "resendId" TEXT NOT NULL,
    "messageId" TEXT,
    "fromAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT,
    "action" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportEmail_resendId_key" ON "SupportEmail"("resendId");

-- CreateIndex
CREATE INDEX "SupportEmail_fromAddress_createdAt_idx" ON "SupportEmail"("fromAddress", "createdAt");
