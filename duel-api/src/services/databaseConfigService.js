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
    
    // Utiliser la même logique que les autres fonctions qui marchent
    const validPort = parseInt(port) || (provider === 'mysql' ? 3306 : 5432);
    
    // S'assurer que tous les paramètres sont définis
    if (!host || !database || !username) {
      throw new Error(`Paramètres manquants pour ${provider}: host=${host}, database=${database}, username=${username}`);
    }
    
    switch (provider) {
      case 'mysql':
        return `mysql://${username}:${password || ''}@${host}:${validPort}/${database}`;
      case 'postgresql':
        return `postgresql://${username}:${password || ''}@${host}:${validPort}/${database}?schema=public`;
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
      console.log('🚀 Début de la migration des données vers', config.provider);
      
      // 1. Créer le verrou de migration pour empêcher les changements de schéma automatiques
      const migrationLockPath = path.join(process.cwd(), 'prisma', 'migration.lock');
      fs.writeFileSync(migrationLockPath, `Migration started at: ${new Date().toISOString()}\nTarget: ${config.provider}`, 'utf8');
      console.log('🔒 Verrou de migration créé');
      
      // 2. Tester la connexion à la base cible
      const connectionTest = await this.testConnection(config);
      if (!connectionTest.success) {
        // Supprimer le verrou en cas d'échec
        if (fs.existsSync(migrationLockPath)) {
          fs.unlinkSync(migrationLockPath);
        }
        return connectionTest;
      }
      
      // 3. Vérifier/créer les tables sur la base cible
      const tablesCheck = await this.checkTablesExist(config);
      if (!tablesCheck.success) {
        // Supprimer le verrou en cas d'échec
        if (fs.existsSync(migrationLockPath)) {
          fs.unlinkSync(migrationLockPath);
        }
        return tablesCheck;
      }
      
      if (!tablesCheck.data.allTablesExist) {
        const createResult = await this.createTables(config);
        if (!createResult.success) {
          // Supprimer le verrou en cas d'échec
          if (fs.existsSync(migrationLockPath)) {
            fs.unlinkSync(migrationLockPath);
          }
          return createResult;
        }
      }
      
      // 4. Migrer les données depuis SQLite vers la nouvelle base
      console.log('📦 Migration des données...');
      const dataMigrationResult = await this.copyDataFromSQLite(config);
      
      if (!dataMigrationResult.success) {
        // Supprimer le verrou en cas d'échec
        if (fs.existsSync(migrationLockPath)) {
          fs.unlinkSync(migrationLockPath);
        }
        return dataMigrationResult;
      }
      
      console.log('✅ Migration des données terminée avec succès');
      console.log('⚠️ IMPORTANT: Vous devez maintenant finaliser la migration pour changer la configuration');
      
      return {
        success: true,
        message: `Migration des données vers ${config.provider} réussie. Finalisez maintenant la migration.`,
        data: {
          provider: config.provider,
          database: config.database,
          recordsMigrated: dataMigrationResult.data?.recordsMigrated || 0,
          migrationLockActive: true
        }
      };
        
    } catch (error) {
      console.error('❌ Erreur lors de la migration des données:', error);
      
      // Supprimer le verrou en cas d'erreur
      const migrationLockPath = path.join(process.cwd(), 'prisma', 'migration.lock');
      if (fs.existsSync(migrationLockPath)) {
        fs.unlinkSync(migrationLockPath);
        console.log('🔓 Verrou de migration supprimé après erreur');
      }
      
      return {
        success: false,
        message: `Erreur lors de la migration des données: ${error.message}`
      };
    }
  }

  /**
   * Finaliser la migration en changeant le schéma Prisma et la configuration
   * Cette fonction doit être appelée APRÈS que les données aient été migrées avec succès
   */
  async finalizeMigration(newConfig) {
    console.log('🔄 Début de la finalisation de la migration...');
    
    try {
      // 1. Copier le schéma MySQL en place du schéma SQLite
      console.log('📋 Copie du schéma MySQL...');
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const mysqlSchemaPath = path.join(process.cwd(), 'prisma', 'schema.mysql.prisma');
      
      if (!fs.existsSync(mysqlSchemaPath)) {
        throw new Error('Le fichier schema.mysql.prisma est introuvable');
      }
      
      // Sauvegarde du schéma SQLite actuel
      const sqliteBackupPath = path.join(process.cwd(), 'prisma', 'schema.sqlite.backup.prisma');
      if (fs.existsSync(schemaPath)) {
        fs.copyFileSync(schemaPath, sqliteBackupPath);
        console.log('✅ Sauvegarde du schéma SQLite créée');
      }
      
      // Copie du schéma MySQL
      fs.copyFileSync(mysqlSchemaPath, schemaPath);
      console.log('✅ Schéma MySQL copié en place');
      
      // 2. Construire la nouvelle URL de base de données
      const databaseUrl = this.buildDatabaseUrl(newConfig);
      console.log('🔗 URL construite:', databaseUrl.replace(/:[^:@]*@/, ':***@')); // Masquer le mot de passe dans les logs
      
      // 3. Mettre à jour les variables d'environnement
      console.log('⚙️ Mise à jour de la configuration...');
      process.env.DB_PROVIDER = newConfig.provider;
      process.env.DATABASE_URL = databaseUrl;
      process.env.DB_HOST = newConfig.host;
      process.env.DB_PORT = newConfig.port;
      process.env.DB_NAME = newConfig.database;
      process.env.DB_USER = newConfig.username;
      process.env.DB_PASS = newConfig.password;
      
      // 4. Mettre à jour le fichier .env si on n'est pas dans Docker
      const isDocker = fs.existsSync('/.dockerenv');
      if (!isDocker) {
        console.log('📝 Mise à jour du fichier .env...');
        this.updateEnvFile({
          DB_PROVIDER: newConfig.provider,
          DATABASE_URL: databaseUrl,
          DB_HOST: newConfig.host,
          DB_PORT: newConfig.port,
          DB_NAME: newConfig.database,
          DB_USER: newConfig.username,
          DB_PASS: newConfig.password
        });
      }
      
      // 5. Générer le client Prisma avec le nouveau schéma
      console.log('🔧 Génération du client Prisma...');
      try {
        if (isDocker) {
          // Dans Docker, utiliser npx prisma generate directement
          execSync('cd /app && npx prisma generate', { 
            stdio: 'pipe',
            encoding: 'utf-8'
          });
        } else {
          execSync('npx prisma generate', { 
            stdio: 'pipe',
            encoding: 'utf-8',
            cwd: process.cwd()
          });
        }
        console.log('✅ Client Prisma généré avec succès');
      } catch (generateError) {
        console.warn('⚠️ Erreur lors de la génération du client Prisma:', generateError.message);
        // Ne pas échouer complètement car le redémarrage peut résoudre ce problème
      }
      
      // 6. Supprimer le verrou de migration
      const migrationLockPath = path.join(process.cwd(), 'prisma', 'migration.lock');
      if (fs.existsSync(migrationLockPath)) {
        fs.unlinkSync(migrationLockPath);
        console.log('🔓 Verrou de migration supprimé');
      }
      
      // 7. Indiquer si un redémarrage est nécessaire
      const needsRestart = isDocker || true; // Toujours recommander un redémarrage pour être sûr
      
      console.log('✅ Finalisation terminée avec succès');
      
      return {
        success: true,
        message: 'Migration finalisée avec succès. Le serveur va redémarrer...',
        needsRestart: needsRestart,
        newProvider: newConfig.provider
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      
      // En cas d'erreur, essayer de restaurer le schéma SQLite
      try {
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        const sqliteBackupPath = path.join(process.cwd(), 'prisma', 'schema.sqlite.backup.prisma');
        
        if (fs.existsSync(sqliteBackupPath)) {
          fs.copyFileSync(sqliteBackupPath, schemaPath);
          console.log('🔄 Schéma SQLite restauré après erreur');
        }
      } catch (restoreError) {
        console.error('❌ Impossible de restaurer le schéma SQLite:', restoreError);
      }
      
      return {
        success: false,
        message: `Erreur lors de la finalisation: ${error.message}`
      };
    }
  }

  /**
   * Mettre à jour le fichier .env avec de nouvelles valeurs
   */
  updateEnvFile(newVars) {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    // Lire le fichier existant s'il existe
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Créer un objet avec toutes les variables
    const envVars = {};
    
    // Parser les variables existantes
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });
    
    // Ajouter/mettre à jour les nouvelles variables
    Object.keys(newVars).forEach(key => {
      if (newVars[key] !== null && newVars[key] !== undefined) {
        envVars[key] = newVars[key];
      }
    });
    
    // Reconstruire le contenu du fichier
    const newContent = Object.keys(envVars)
      .map(key => `${key}=${envVars[key]}`)
      .join('\n') + '\n';
    
    fs.writeFileSync(envPath, newContent, 'utf8');
    console.log('✅ Fichier .env mis à jour');
  }

  /**
   * Copier les données depuis SQLite vers une nouvelle base de données
   */
  async copyDataFromSQLite(targetConfig) {
    console.log('📦 Début de la copie des données depuis SQLite...');
    
    try {
      // 1. Se connecter à SQLite (source) - utiliser la vraie URL SQLite actuelle
      const currentConfig = this.getCurrentConfig();
      console.log('🔍 Configuration actuelle:', JSON.stringify(currentConfig, null, 2));
      
      let sqliteDbPath;
      
      if (currentConfig.provider === 'sqlite') {
        // Extraire le chemin depuis l'URL SQLite
        const sqliteUrl = currentConfig.url || process.env.DATABASE_URL || 'file:./prisma/dev.db';
        sqliteDbPath = sqliteUrl.replace('file:', '');
        console.log('🔍 Chemin SQLite actuel:', sqliteDbPath);
      } else {
        // Si on n'est pas sur SQLite, utiliser le chemin par défaut
        sqliteDbPath = './prisma/dev.db';
        console.log('🔍 Utilisation du chemin SQLite par défaut:', sqliteDbPath);
      }
      
      // Vérifier si le fichier existe
      if (!fs.existsSync(sqliteDbPath)) {
        console.error('❌ Fichier SQLite introuvable:', sqliteDbPath);
        throw new Error(`Fichier SQLite introuvable: ${sqliteDbPath}`);
      }
      
      console.log('✅ Fichier SQLite trouvé, taille:', fs.statSync(sqliteDbPath).size, 'bytes');
      
      const sqliteDb = new sqlite3.Database(sqliteDbPath);
      
      // Test rapide pour lister les tables existantes
      const existingTables = await new Promise((resolve, reject) => {
        sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.name));
        });
      });
      console.log('📋 Tables existantes dans SQLite:', existingTables);
      
      // 2. Créer une connexion vers la base cible
      const targetUrl = this.buildDatabaseUrl(targetConfig);
      const { PrismaClient } = require('@prisma/client');
      
      // Créer un client Prisma temporaire pour la base cible
      const targetPrisma = new PrismaClient({
        datasources: {
          db: {
            url: targetUrl
          }
        }
      });
      
      let totalRecords = 0;
      
      // 3. Lister les modèles et leurs tables mappées depuis le schéma SQLite ACTUEL
      const currentSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = fs.readFileSync(currentSchemaPath, 'utf8');
      
      // Extraire les modèles et leurs tables mappées
      const models = [];
      const modelRegex = /model\s+(\w+)\s*{[^}]*@@map\("([^"]+)"\)/g;
      let match;
      
      while ((match = modelRegex.exec(schemaContent)) !== null) {
        models.push({
          modelName: match[1],
          tableName: match[2]
        });
      }
      
      console.log('📋 Modèles à migrer depuis SQLite:', models);
      
      // 4. Pour chaque modèle, copier les données
      for (const model of models) {
        try {
          console.log(`📦 Migration du modèle ${model.modelName} (table: ${model.tableName})`);
          
          // Lire les données depuis SQLite en utilisant le nom de table mappé
          const rows = await new Promise((resolve, reject) => {
            const query = `SELECT * FROM "${model.tableName}"`;
            console.log(`🔍 Exécution de la requête: ${query}`);
            
            sqliteDb.all(query, (err, rows) => {
              if (err) {
                console.log(`❌ Erreur SQL: ${err.message}`);
                if (err.message.includes('no such table')) {
                  console.log(`⚠️ Table ${model.tableName} n'existe pas dans SQLite - ignorée`);
                  resolve([]);
                } else {
                  reject(err);
                }
              } else {
                console.log(`✅ Requête réussie, ${rows.length} lignes trouvées`);
                if (rows.length > 0) {
                  console.log(`📄 Première ligne:`, JSON.stringify(rows[0], null, 2));
                }
                resolve(rows);
              }
            });
          });
          
          if (rows.length === 0) {
            console.log(`📋 Table ${model.tableName} vide - ignorée`);
            continue;
          }
          
          console.log(`📦 ${rows.length} enregistrements trouvés dans ${model.tableName}`);
          
          // Utiliser le nom du modèle en minuscule pour Prisma
          const prismaModelName = model.modelName.toLowerCase();
          
          // Insérer les données dans la base cible via Prisma
          if (targetPrisma[prismaModelName]) {
            // Utiliser createMany si le modèle existe
            await targetPrisma[prismaModelName].createMany({
              data: rows,
              skipDuplicates: true
            });
            totalRecords += rows.length;
            console.log(`✅ ${rows.length} enregistrements migrés pour ${model.tableName}`);
          } else {
            console.warn(`⚠️ Modèle ${prismaModelName} non trouvé dans Prisma - table ${model.tableName} ignorée`);
          }
          
        } catch (tableError) {
          console.warn(`⚠️ Erreur lors de la migration de ${model.modelName}:`, tableError.message);
          // Continuer avec les autres tables
        }
      }
      
      // 5. Fermer les connexions
      sqliteDb.close();
      await targetPrisma.$disconnect();
      
      console.log(`✅ Migration terminée - ${totalRecords} enregistrements copiés au total`);
      
      return {
        success: true,
        message: `Migration réussie - ${totalRecords} enregistrements copiés`,
        data: {
          recordsMigrated: totalRecords,
          tablesProcessed: models.length
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la copie des données:', error);
      return {
        success: false,
        message: `Erreur lors de la copie des données: ${error.message}`
      };
    }
  }

  // Autres méthodes : migrateToNewDatabase, copyDataFromSQLite, checkTablesExist, createMissingTables, checkTablesContent, migrateDatabase
  // (elles peuvent rester identiques, mais assure-toi de supprimer les doublons et de placer chaque fonction une seule fois).
}

module.exports = new DatabaseConfigService();
