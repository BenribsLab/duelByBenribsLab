-- CreateTable
CREATE TABLE "parental_consents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "duelisteId" INTEGER NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PARENT',
    "parentDecidedAt" DATETIME,
    "adminDecidedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parental_consents_duelisteId_fkey" FOREIGN KEY ("duelisteId") REFERENCES "duellistes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "parental_consents_duelisteId_key" ON "parental_consents"("duelisteId");
