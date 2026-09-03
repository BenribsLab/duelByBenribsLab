-- Durcissement sécurité — SQLite
-- Sauvegardez la base avant d'exécuter ce script.
ALTER TABLE "duellistes" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "duellistes" ADD COLUMN "otpLastSentAt" DATETIME;
ALTER TABLE "duellistes" ADD COLUMN "otpLockedUntil" DATETIME;
ALTER TABLE "duellistes" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Les anciens OTP étaient stockés en clair et ne doivent plus être acceptés.
UPDATE "duellistes" SET "otpCode" = NULL, "otpExpiry" = NULL WHERE "otpCode" IS NOT NULL;
