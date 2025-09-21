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

  async checkTablesExist(config) {
    const { provider, host, port, database, username, password } = config;
    
    try {
      const expectedTables = this.getExpectedTablesFromSchema();
      const existingTables = [];
      const missingTables = [];
      
      if (provider === 'mysql') {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
          host: host,
          port: parseInt(port) || 3306,
          user: username,
          password: password,
          database: database,
          timeout: 5000
        });
        
        const [rows] = await connection.execute('SHOW TABLES');
        const tableNames = rows.map(row => Object.values(row)[0]);
        
        expectedTables.forEach(table => {
          if (tableNames.includes(table)) {
            existingTables.push(table);
          } else {
            missingTables.push(table);
          }
        });
        
        await connection.end();
        
      } else if (provider === 'postgresql') {
        const { Client } = require('pg');
        const client = new Client({
          host: host,
          port: parseInt(port) || 5432,
          user: username,
          password: password,
          database: database,
          connectionTimeoutMillis: 5000
        });
        
        await client.connect();
        const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tableNames = result.rows.map(row => row.table_name);
        
        expectedTables.forEach(table => {
          if (tableNames.includes(table)) {
            existingTables.push(table);
          } else {
            missingTables.push(table);
          }
        });
        
        await client.end();
      } else {
        return {
          success: false,
          message: 'Provider non supporté pour la vérification des tables'
        };
      }
      
      return {
        success: true,
        data: {
          existingTables: existingTables,
          missingTables: missingTables,
          allTablesExist: missingTables.length === 0
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de la vérification des tables:', error);
      return {
        success: false,
        message: `Erreur lors de la vérification des tables: ${error.message}`
      };
    }
  }

  async checkTablesContent(config) {
    const { provider, host, port, database, username, password } = config;
    
    try {
      const expectedTables = this.getExpectedTablesFromSchema();
      const tablesContent = {};
      
      if (provider === 'mysql') {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
          host: host,
          port: parseInt(port) || 3306,
          user: username,
          password: password,
          database: database,
          timeout: 5000
        });
        
        // Compter les enregistrements dans chaque table
        for (const table of expectedTables) {
          try {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            tablesContent[table] = rows[0].count;
          } catch (error) {
            tablesContent[table] = 0; // Table n'existe pas ou est vide
          }
        }
        
        await connection.end();
        
      } else if (provider === 'postgresql') {
        const { Client } = require('pg');
        const client = new Client({
          host: host,
          port: parseInt(port) || 5432,
          user: username,
          password: password,
          database: database,
          connectionTimeoutMillis: 5000
        });
        
        await client.connect();
        
        // Compter les enregistrements dans chaque table
        for (const table of expectedTables) {
          try {
            const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
            tablesContent[table] = parseInt(result.rows[0].count);
          } catch (error) {
            tablesContent[table] = 0; // Table n'existe pas ou est vide
          }
        }
        
        await client.end();
      } else {
        return {
          success: false,
          message: 'Provider non supporté pour la vérification du contenu'
        };
      }
      
      return {
        success: true,
        data: {
          tablesContent: tablesContent
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de la vérification du contenu des tables:', error);
      return {
        success: false,
        message: `Erreur lors de la vérification du contenu: ${error.message}`
      };
    }
  }

  async migrateDatabase(config) {
    try {
      console.log('🚀 Début de la migration vers', config.provider);
      
      // 1. Tester la connexion
      const connectionTest = await this.testConnection(config);
      if (!connectionTest.success) {
        return connectionTest;
      }
      
      // 2. Mettre à jour le schéma Prisma
      const schemaUpdate = this.updatePrismaSchema(config.provider);
      if (!schemaUpdate.success) {
        return schemaUpdate;
      }
      
      // 3. Sauvegarder la configuration
      const configSave = await this.saveConfig(config);
      if (!configSave.success) {
        return configSave;
      }
      
      // 4. Exécuter les commandes Prisma
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        // Mettre à jour DATABASE_URL dans l'environnement
        process.env.DATABASE_URL = this.buildDatabaseUrl(config);
        
        console.log('🔧 Génération du client Prisma...');
        await execAsync('npx prisma generate');
        
        console.log('🗄️ Application du schéma à la base de données...');
        await execAsync('npx prisma db push --accept-data-loss');
        
        console.log('✅ Migration terminée avec succès');
        
        return {
          success: true,
          message: `Migration vers ${config.provider} réussie`,
          data: {
            provider: config.provider,
            database: config.database
          }
        };
        
      } catch (prismaError) {
        console.error('❌ Erreur Prisma:', prismaError);
        return {
          success: false,
          message: `Erreur Prisma: ${prismaError.message}`
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return {
        success: false,
        message: `Erreur lors de la migration: ${error.message}`
      };
    }
  }

  // Autres méthodes : migrateToNewDatabase, copyDataFromSQLite, checkTablesExist, createMissingTables, checkTablesContent, migrateDatabase, finalizeMigration
  // (elles peuvent rester identiques, mais assure-toi de supprimer les doublons et de placer chaque fonction une seule fois).
}

module.exports = new DatabaseConfigService();
