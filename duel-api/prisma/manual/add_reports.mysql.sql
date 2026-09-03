-- Ajout du signalement d'utilisateur — MySQL / MariaDB
-- Sauvegardez la base avant d'exécuter ce script.
CREATE TABLE `reports` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `reporterId` INT NOT NULL,
    `reportedUserId` INT NOT NULL,
    `duelId` INT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `reports_reporterId_idx` (`reporterId`),
    KEY `reports_reportedUserId_idx` (`reportedUserId`),
    KEY `reports_duelId_idx` (`duelId`),
    CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `duellistes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `reports_reportedUserId_fkey` FOREIGN KEY (`reportedUserId`) REFERENCES `duellistes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `reports_duelId_fkey` FOREIGN KEY (`duelId`) REFERENCES `duels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
