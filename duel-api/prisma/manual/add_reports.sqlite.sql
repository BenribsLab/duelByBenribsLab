-- Ajout du signalement d'utilisateur — SQLite
-- Sauvegardez la base avant d'exécuter ce script.
CREATE TABLE "reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reporterId" INTEGER NOT NULL,
    "reportedUserId" INTEGER NOT NULL,
    "duelId" INTEGER,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "duellistes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "duellistes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "duels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
