const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Racine de l'API : sert d'ancre pour les chemins SQLite relatifs.
const API_ROOT = path.resolve(__dirname, '..');

/**
 * Prisma résout un chemin SQLite relatif par rapport au fichier de schéma,
 * pas au répertoire de travail : `file:./prisma/dev.db` pointait donc vers
 * `<racine>/prisma/prisma/dev.db` et la base restait introuvable. On normalise
 * ici vers un chemin absolu ancré sur la racine de l'API.
 */
function absoluteSqliteUrl(url) {
  if (!url.startsWith('file:')) return url;
  const filePath = url.slice('file:'.length);
  if (filePath === ':memory:' || path.isAbsolute(filePath)) return url;
  return `file:${path.resolve(API_ROOT, filePath)}`;
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return absoluteSqliteUrl(process.env.DATABASE_URL);

  const provider = process.env.DB_PROVIDER || 'sqlite';
  if (provider === 'sqlite') return absoluteSqliteUrl(process.env.SQLITE_URL || 'file:./prisma/dev.db');
  if (provider === 'mysql') {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const database = process.env.DB_NAME || 'duel';
    const username = encodeURIComponent(process.env.DB_USER || 'root');
    const password = encodeURIComponent(process.env.DB_PASS || '');
    return `mysql://${username}:${password}@${host}:${port}/${database}`;
  }
  throw new Error(`DB_PROVIDER non supporté: ${provider}`);
}

process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty'
});

async function testConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { prisma, testConnection, disconnect, buildDatabaseUrl, absoluteSqliteUrl };
