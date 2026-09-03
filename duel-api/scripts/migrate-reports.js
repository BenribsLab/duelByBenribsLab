#!/usr/bin/env node
/**
 * Migration : ajout de la table de signalement (`reports`).
 *
 * Idempotente et compatible SQLite et MySQL : elle inspecte l'existence de la
 * table avant d'émettre le moindre DDL, et ne supprime rien.
 *
 * Usage :
 *   node scripts/migrate-reports.js --dry-run   # affiche le plan, n'écrit rien
 *   node scripts/migrate-reports.js             # applique la migration
 */

const fs = require('fs');
const path = require('path');
const { prisma, buildDatabaseUrl } = require('../src/database');

const TABLE = 'reports';

function provider() {
  const value = process.env.DB_PROVIDER || (buildDatabaseUrl().startsWith('mysql') ? 'mysql' : 'sqlite');
  if (value !== 'sqlite' && value !== 'mysql') throw new Error(`DB_PROVIDER non supporté par cette migration: ${value}`);
  return value;
}

async function tableExists(engine) {
  if (engine === 'sqlite') {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
      TABLE
    );
    return rows.length > 0;
  }
  const rows = await prisma.$queryRawUnsafe(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    TABLE
  );
  return rows.length > 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const engine = provider();

  const dejaPresente = await tableExists(engine);
  console.log(`Moteur détecté : ${engine}`);
  console.log(`Table "${TABLE}" déjà présente : ${dejaPresente ? 'oui' : 'non'}`);

  if (dejaPresente) {
    console.log('Rien à faire.');
    return;
  }

  const sqlFile = path.join(__dirname, '..', 'prisma', 'manual', `add_reports.${engine}.sql`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  // Un seul CREATE TABLE par fichier : découpage naïf sur les points-virgules
  // en fin de ligne, en ignorant les lignes de commentaire.
  const statements = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`${statements.length} instruction(s) à exécuter :`);
  statements.forEach((statement) => console.log(`  ${statement};`));

  if (dryRun) {
    console.log('\n--dry-run : aucune modification appliquée.');
    return;
  }

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log(`\nMigration appliquée : table "${TABLE}" créée.`);
}

main()
  .catch((error) => {
    console.error('Migration interrompue :', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
