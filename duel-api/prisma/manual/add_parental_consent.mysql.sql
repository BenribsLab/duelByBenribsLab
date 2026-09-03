-- Ajout du consentement parental — MySQL / MariaDB
-- Sauvegardez la base avant d'exécuter ce script.
CREATE TABLE `parental_consents` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `duelisteId` INT NOT NULL,
    `parentEmail` VARCHAR(255) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING_PARENT',
    `parentDecidedAt` DATETIME(3) NULL,
    `adminDecidedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `parental_consents_duelisteId_key` (`duelisteId`),
    CONSTRAINT `parental_consents_duelisteId_fkey` FOREIGN KEY (`duelisteId`) REFERENCES `duellistes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
