const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

class DatabaseConfigService {
  /**
   * Lire la configuration actuelle depuis les variables d'environnement ou .env
   */
  getCurrentConfig() {
    if (process.env.DB_PROVIDER || process.env.DATABASE_URL) {
      return {
        provider: process.env.DB_PROVIDER || 'sqlite',
        url: process.env.DATABASE_URL || process.env.SQLITE_URL || 'file:./dev.db',
        host: process.env.DB_HOST || null,
        port: process.env.DB_PORT || null,
        database: process.env.DB_NAME || null,
        username: process.env.DB_USER || null,
        password: process.env.DB_PASS || null
      };
    }

    const envPath = path.join(process.cwd(), '.env');
    try {
      if (!fs.existsSync(envPath)) {
        return { provider: 'sqlite', url: 'file:./dev.db' };
      }
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            envVars[key] = valueParts.join('=').replace(/"/g, '');
          }
        }
      });
      return {
        provider: envVars.DB_PROVIDER || 'sqlite',
        url: envVars.SQLITE_URL || 'file:./dev.db',
        host: envVars.DB_HOST || null,
        port: envVars.DB_PORT || null,
        database: envVars.DB_NAME || null,
        username: envVars.DB_USER || null,
        password: envVars.DB_PASS || null
      };
    } catch (error) {
      console.error('Erreur lecture .env:', error);
      return { provider: 'sqlite', url: 'file:./dev.db' };
    }
  }

  /**
   * Extraire les tables attendues depuis schema.mysql.prisma
   */
  getExpectedTablesFromSchema() {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.mysql.prisma');
    try {
      if (!fs.existsSync(schemaPath)) {
        console.warn('Fichier schema.mysql.prisma introuvable, tables par défaut utilisées');
        return ['duellistes', 'duels', 'validations_scores', 'email_invitations'];
      }
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const tableNames = [];
      const modelRegex = /model\s+(\w+)\s*\{[^}]*@@map\("([^"]+)"\)/g;
      let match;
      while ((match = modelRegex.exec(schemaContent)) !== null) {
        tableNames.push(match[2]);
      }
      console.log('Tables extraites du schema MySQL:', tableNames);
      return tableNames.length > 0 ? tableNames : ['duellistes', 'duels', 'validations_scores', 'email_invitations'];
    } catch (error) {
      console.error('Erreur lecture schema MySQL:', error);
      return ['duellistes', 'duels', 'validations_scores', 'email_invitations'];
    }
  }

  buildDatabaseUrl(config) {
    const { provider, host, port, database, username, password } = config;
    switch (provider) {
      case 'mysql':
        return `mysql://${username}:${password}@${host}:${port || 3306}/${database}`;
      case 'postgresql':
        return `postgresql://${username}:${password}@${host}:${port || 5432}/${database}?schema=public`;
      default:
        return 'file:./prisma/dev.db';
    }
  }

  updatePrismaSchema(provider) {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    try {
      let templatePath;
      if (provider === 'mysql') templatePath = path.join(process.cwd(), 'prisma', 'schema.mysql.prisma');
      else if (provider === 'sqlite') templatePath = path.join(process.cwd(), 'prisma', 'schema.sqlite.prisma');
      else return { success: false, message: `Provider non supporte: ${provider}` };

      if (!fs.existsSync(templatePath)) return { success: false, message: `Template non trouve: ${templatePath}` };

      fs.copyFileSync(templatePath, schemaPath);
      console.log(`Schema Prisma mis a jour vers ${provider}`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testConnection(config) {
    const { provider, host, port, database, username, password } = config;
    try {
      if (provider === 'mysql') {
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({ host, port: parseInt(port) || 3306, user: username, password, database, timeout: 5000 });
        await conn.execute('SELECT 1');
        await conn.end();
        return { success: true, message: 'Connexion MySQL reussie' };
      } else if (provider === 'postgresql') {
        const { Client } = require('pg');
        const client = new Client({ host, port: parseInt(port) || 5432, user: username, password, database, connectionTimeoutMillis: 5000 });
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        return { success: true, message: 'Connexion PostgreSQL reussie' };
      }
      return { success: false, message: 'Provider non supporte pour test connexion' };
    } catch (error) {
      console.error('Erreur test connexion:', error);
      return { success: false, message: `Erreur connexion ${provider}: ${error.message}` };
    }
  }

  async saveConfig(config) {
    const envPath = path.join(process.cwd(), '.env');
    try {
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      const updates = {};
      if (config.provider) updates.DB_PROVIDER = config.provider;
      if (config.host !== undefined) updates.DB_HOST = config.host;
      if (config.port !== undefined) updates.DB_PORT = config.port;
      if (config.database !== undefined) updates.DB_NAME = config.database;
      if (config.username !== undefined) updates.DB_USER = config.username;
      if (config.password !== undefined) updates.DB_PASS = config.password;

      Object.entries(updates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        envContent = regex.test(envContent) ? envContent.replace(regex, `${key}=${value}`) : envContent + `\n${key}=${value}`;
      });
      fs.writeFileSync(envPath, envContent.trim() + '\n');
      return { success: true, message: 'Configuration sauvegardee' };
    } catch (error) {
      return { success: false, message: `Erreur sauvegarde: ${error.message}` };
    }
  }

  convertSQLiteDate(value) {
    if (!value || value === '0000-00-00' || value === '0000-00-00 00:00:00') return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // Autres méthodes : migrateToNewDatabase, copyDataFromSQLite, checkTablesExist, createMissingTables, checkTablesContent, migrateDatabase, finalizeMigration
  // (elles peuvent rester identiques, mais assure-toi de supprimer les doublons et de placer chaque fonction une seule fois).
}

module.exports = new DatabaseConfigService();
