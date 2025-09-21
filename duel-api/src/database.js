const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Fonction pour exécuter les commandes Prisma
async function runPrismaCommands() {
  const provider = process.env.DB_PROVIDER || 'sqlite';
  
  try {
    console.log('🔧 Génération du client Prisma...');
    const { stdout: generateOutput } = await execAsync('npx prisma generate');
    console.log('✅ Client Prisma généré');
    
    console.log(`🗄️ Synchronisation de la base de données ${provider.toUpperCase()}...`);
    const { stdout: pushOutput } = await execAsync('npx prisma db push --force-reset');
    console.log('✅ Base de données synchronisée');
    
  } catch (error) {
    console.error('❌ Erreur lors des commandes Prisma:', error.message);
    // Ne pas arrêter le processus, continuer avec Prisma existant
  }
}

// Fonction pour copier le bon schéma selon le provider
async function copySchemaFile() {
  const provider = process.env.DB_PROVIDER || 'sqlite';
  const prismaDir = path.join(__dirname, '../prisma');
  const targetSchema = path.join(prismaDir, 'schema.prisma');
  
  let sourceSchema;
  if (provider === 'mysql') {
    sourceSchema = path.join(prismaDir, 'schema.mysql.prisma');
  } else {
    sourceSchema = path.join(prismaDir, 'schema.sqlite.prisma');
  }
  
  try {
    // Vérifier que le fichier source existe
    if (!fs.existsSync(sourceSchema)) {
      console.warn(`⚠️ Fichier schéma source introuvable: ${sourceSchema}`);
      return false;
    }
    
    // Vérifier si une copie est nécessaire
    if (fs.existsSync(targetSchema)) {
      const sourceContent = fs.readFileSync(sourceSchema, 'utf8');
      const targetContent = fs.readFileSync(targetSchema, 'utf8');
      if (sourceContent === targetContent) {
        console.log(`📋 Schéma ${provider} déjà à jour`);
        return false; // Pas de changement
      }
    }
    
    // Copier le schéma approprié
    fs.copyFileSync(sourceSchema, targetSchema);
    console.log(`📋 Schéma ${provider} copié: ${path.basename(sourceSchema)} → schema.prisma`);
    return true; // Changement effectué
  } catch (error) {
    console.error('❌ Erreur lors de la copie du schéma:', error);
    return false;
  }
}

// Initialisation automatique
async function initializeDatabase() {
  console.log('🚀 Initialisation de la base de données...');
  
  // Copier le schéma approprié
  const schemaChanged = await copySchemaFile();
  
  // Exécuter les commandes Prisma si nécessaire
  if (schemaChanged || process.env.FORCE_PRISMA_INIT === 'true') {
    await runPrismaCommands();
  }
  
  console.log('✅ Base de données initialisée');
}

// Lancer l'initialisation au démarrage
initializeDatabase().catch(console.error);

// Fonction pour construire l'URL de base de données dynamiquement
function buildDatabaseUrl() {
  const provider = process.env.DB_PROVIDER || 'sqlite';
  
  if (provider === 'sqlite') {
    return process.env.SQLITE_URL || 'file:./prisma/dev.db';
  } else if (provider === 'mysql') {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const database = process.env.DB_NAME || 'duel';
    const username = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '';
    
    return `mysql://${username}:${password}@${host}:${port}/${database}`;
  }
  
  // Fallback pour SQLite
  return 'file:./prisma/dev.db';
}

// Construire l'URL et l'assigner à DATABASE_URL pour Prisma
process.env.DATABASE_URL = buildDatabaseUrl();

// Configuration du client Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty'
});

// Middleware pour la gestion des erreurs de connexion - DEPRECATED in Prisma 5.x
// prisma.$use(async (params, next) => {
//   const before = Date.now();
//   
//   try {
//     const result = await next(params);
//     const after = Date.now();
//     
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`🔍 Query ${params.model}.${params.action} took ${after - before}ms`);
//     }
//     
//     return result;
//   } catch (error) {
//     console.error('❌ Erreur Prisma:', error);
//     throw error;
//   }
// });

// Fonction de test de connexion
async function testConnection() {
  const provider = process.env.DB_PROVIDER || 'sqlite';
  try {
    await prisma.$connect();
    console.log(`✅ Connexion à la base de données ${provider.toUpperCase()} établie`);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}

// Fonction de fermeture propre
async function disconnect() {
  await prisma.$disconnect();
  console.log('🔌 Connexion à la base de données fermée');
}

// Gestion des arrêts de processus
process.on('beforeExit', async () => {
  await disconnect();
});

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  prisma,
  testConnection,
  disconnect
};