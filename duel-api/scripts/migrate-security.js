#!/usr/bin/env node
/**
 * Migration de durcissement sécurité.
 *
 * Ajoute les colonnes de protection des OTP et de révocation de session
 * (otpAttempts, otpLastSentAt, otpLockedUntil, tokenVersion) et purge les OTP
 * historiques qui étaient stockés en clair.
 *
 * Le script est idempotent et compatible SQLite et MySQL : il inspecte les
 * colonnes existantes avant d'émettre le moindre DDL, et ne supprime ni table
 * ni colonne.
 *
 * Usage :
 *   node scripts/migrate-security.js --dry-run   # affiche le plan, n'écrit rien
 *   node scripts/migrate-security.js             # applique la migration
 */

const { prisma, buildDatabaseUrl } = require('../src/database');

const TABLE = 'duellistes';

const COLUMNS = {
  sqlite: [
    ['otpAttempts', 'INTEGER NOT NULL DEFAULT 0'],
    ['otpLastSentAt', 'DATETIME'],
    ['otpLockedUntil', 'DATETIME'],
    ['tokenVersion', 'INTEGER NOT NULL DEFAULT 0']
  ],
  mysql: [
    ['otpAttempts', 'INT NOT NULL DEFAULT 0'],
    ['otpLastSentAt', 'DATETIME(3) NULL'],
    ['otpLockedUntil', 'DATETIME(3) NULL'],
    ['tokenVersion', 'INT NOT NULL DEFAULT 0']
  ]
};

function provider() {
  const value = process.env.DB_PROVIDER || (buildDatabaseUrl().startsWith('mysql') ? 'mysql' : 'sqlite');
  if (!COLUMNS[value]) throw new Error(`DB_PROVIDER non supporté par cette migration: ${value}`);
  return value;
}

function quote(engine, identifier) {
  return engine === 'mysql' ? `\`${identifier}\`` : `"${identifier}"`;
}

async function existingColumns(engine) {
  if (engine === 'sqlite') {
    const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info("${TABLE}")`);
    return new Set(rows.map((row) => row.name));
  }
  const rows = await prisma.$queryRawUnsafe(
    'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    TABLE
  );
  return new Set(rows.map((row) => row.name));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const engine = provider();

  const present = await existingColumns(engine);
  if (present.size === 0) {
    throw new Error(`Table "${TABLE}" introuvable : vérifiez DATABASE_URL / DB_PROVIDER avant de migrer.`);
  }

  const statements = [];
  for (const [name, definition] of COLUMNS[engine]) {
    if (present.has(name)) continue;
    statements.push(
      `ALTER TABLE ${quote(engine, TABLE)} ADD COLUMN ${quote(engine, name)} ${definition}`
    );
  }

  // Les OTP historiques étaient stockés en clair : ils ne doivent plus être acceptés.
  const otpPurge =
    `UPDATE ${quote(engine, TABLE)} SET ${quote(engine, 'otpCode')} = NULL, ` +
    `${quote(engine, 'otpExpiry')} = NULL WHERE ${quote(engine, 'otpCode')} IS NOT NULL`;
  statements.push(otpPurge);

  console.log(`Moteur détecté : ${engine}`);
  console.log(`Colonnes déjà présentes : ${[...present].filter((c) => c.startsWith('otp') || c === 'tokenVersion').join(', ') || 'aucune'}`);
  console.log(`${statements.length} instruction(s) à exécuter :`);
  statements.forEach((statement) => console.log(`  ${statement};`));

  if (dryRun) {
    console.log('\n--dry-run : aucune modification appliquée.');
    return;
  }

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  const apres = await existingColumns(engine);
  const manquantes = COLUMNS[engine].map(([name]) => name).filter((name) => !apres.has(name));
  if (manquantes.length > 0) {
    throw new Error(`Colonnes toujours absentes après migration : ${manquantes.join(', ')}`);
  }

  const [{ restants }] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS restants FROM ${quote(engine, TABLE)} WHERE ${quote(engine, 'otpCode')} IS NOT NULL`
  );
  console.log(`\nMigration appliquée. OTP en clair restants : ${Number(restants)}`);
}

main()
  .catch((error) => {
    console.error('Migration interrompue :', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
