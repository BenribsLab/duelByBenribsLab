-- CreateTable
CREATE TABLE "duellistes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pseudo" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "dateInscription" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "email" TEXT,
    "passwordHash" TEXT,
    "authMode" TEXT NOT NULL DEFAULT 'PASSWORD',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiry" DATETIME,
    "nbVictoires" INTEGER NOT NULL DEFAULT 0,
    "nbDefaites" INTEGER NOT NULL DEFAULT 0,
    "nbMatchsTotal" INTEGER NOT NULL DEFAULT 0,
    "indiceTouches" INTEGER NOT NULL DEFAULT 0,
    "categorie" TEXT NOT NULL DEFAULT 'SENIOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "duels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provocateurId" INTEGER NOT NULL,
    "adversaireId" INTEGER NOT NULL,
    "arbitreId" INTEGER,
    "etat" TEXT NOT NULL DEFAULT 'PROPOSE',
    "dateProposition" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateAcceptation" DATETIME,
    "dateProgrammee" DATETIME,
    "dateValidation" DATETIME,
    "scoreProvocateur" INTEGER,
    "scoreAdversaire" INTEGER,
    "vainqueurId" INTEGER,
    "valideParProvocateur" BOOLEAN NOT NULL DEFAULT false,
    "valideParAdversaire" BOOLEAN NOT NULL DEFAULT false,
    "valideParArbitre" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "duels_provocateurId_fkey" FOREIGN KEY ("provocateurId") REFERENCES "duellistes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "duels_adversaireId_fkey" FOREIGN KEY ("adversaireId") REFERENCES "duellistes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "duels_arbitreId_fkey" FOREIGN KEY ("arbitreId") REFERENCES "duellistes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "validations_scores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "duelisteId" INTEGER NOT NULL,
    "scoreProvocateur" INTEGER NOT NULL,
    "scoreAdversaire" INTEGER NOT NULL,
    "dateSaisie" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "validations_scores_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "duels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "validations_scores_duelisteId_fkey" FOREIGN KEY ("duelisteId") REFERENCES "duellistes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "duellistes_pseudo_key" ON "duellistes"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "duellistes_email_key" ON "duellistes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "validations_scores_matchId_duelisteId_key" ON "validations_scores"("matchId", "duelisteId");
