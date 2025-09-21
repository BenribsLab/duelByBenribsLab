const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

/**
 * Servi  updatePrismaSchema(provider) {
    const path = require('path');
    const fs = require('fs');
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const templatePath = path.join(process.cwd(), 'prisma', `schema.${provider}.prisma`);
    
    try {
      // Vérifier que le template existe
      if (!fs.existsSync(templatePath)) {
        return { success: false, message: `Template ${provider} introuvable: ${templatePath}` };
      }
      
      // Copier le template vers le schéma actif
      fs.copyFileSync(templatePath, schemaPath);
      
      console.log(`✅ Schéma Prisma mis à jour vers ${provider}`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }a configuration de base de données
 */
class DatabaseConfigService {
  
  /**
   * Obtenir la configuration actuelle de la base de données
   * Lit directement les variables d'environnement (Docker ou .env)
   */
  getCurrentConfig() {
    // En premier, essayer de lire les variables d'environnement (Docker)
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

    // Fallback: essayer de lire le fichier .env local
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      if (!fs.existsSync(envPath)) {
        return {
          provider: 'sqlite',
          url: 'file:./dev.db',
          host: null,
          port: null,
          database: null,
          username: null,
          password: null
        };
      }

      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      const envVars = {};

      // Parser le fichier .env
      envLines.forEach(line => {
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
      console.error('Erreur lors de la lecture du .env:', error);
      return {
        provider: 'sqlite',
        url: 'file:./dev.db',
        host: null,
        port: null,
        database: null,
        username: null,
        password: null
      };
    }
  }

  /**
   * Construire l'URL de connexion selon le provider
   */
  buildDatabaseUrl(config) {
    const { provider, host, port, database, username, password } = config;
    
    switch (provider) {
      case 'mysql':
        return `mysql://${username}:${password}@${host}:${port || 3306}/${database}`;
      
      case 'postgresql':
        return `postgresql://${username}:${password}@${host}:${port || 5432}/${database}?schema=public`;
      
      case 'sqlite':
      default:
        return 'file:./prisma/dev.db';
    }
  }

  /**
   * Tester la connexion à une base de données
   */
  async testConnection(config) {
    const { provider, host, port, database, username, password } = config;
    
    console.log('🔍 Test de connexion avec config:', {
      provider,
      host,
      port,
      database,
      username,
      password: password ? '••••••••' : 'VIDE!'
    });
    
    try {
      if (provider === 'mysql') {
        // Test de connexion MySQL avec le module mysql2
        const mysql = require('mysql2/promise');
        const connectionConfig = {
          host: host,
          port: parseInt(port) || 3306,
          user: username,
          password: password,
          database: database,
          timeout: 5000 // 5 secondes de timeout
        };
        
        console.log('🔧 Configuration MySQL:', {
          ...connectionConfig,
          password: connectionConfig.password ? '••••••••' : 'VIDE!'
        });
        
        const connection = await mysql.createConnection(connectionConfig);
        
        // Test d'une requête simple
        await connection.execute('SELECT 1');
        await connection.end();
        
        return { success: true, message: 'Connexion MySQL réussie' };
        
      } else if (provider === 'postgresql') {
        // Test de connexion PostgreSQL avec le module pg
        const { Client } = require('pg');
        const client = new Client({
          host: host,
          port: parseInt(port) || 5432,
          user: username,
          password: password,
          database: database,
          connectionTimeoutMillis: 5000 // 5 secondes de timeout
        });
        
        await client.connect();
        // Test d'une requête simple
        await client.query('SELECT 1');
        await client.end();
        
        return { success: true, message: 'Connexion PostgreSQL réussie' };
        
      } else {
        return { 
          success: false, 
          message: 'Provider non supporté pour le test de connexion' 
        };
      }
      
    } catch (error) {
      console.error('Erreur de test de connexion:', error);
      return { 
        success: false, 
        message: `Erreur de connexion ${provider}: ${error.message}` 
      };
    }
  }

  /**
   * Sauvegarder la nouvelle configuration dans .env
   */
  async saveConfig(config) {
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      // Lire le fichier .env actuel
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Mettre à jour seulement les variables fournies
      const updates = {};
      
      // Toujours mettre à jour le provider si fourni
      if (config.provider) {
        updates.DB_PROVIDER = config.provider;
      }
      
      // Mettre à jour les autres champs seulement s'ils sont fournis
      if (config.host !== undefined) updates.DB_HOST = config.host;
      if (config.port !== undefined) updates.DB_PORT = config.port;
      if (config.database !== undefined) updates.DB_NAME = config.database;
      if (config.username !== undefined) updates.DB_USER = config.username;
      if (config.password !== undefined) updates.DB_PASS = config.password;

      // Remplacer ou ajouter chaque variable
      Object.entries(updates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      });

      // Écrire le nouveau fichier .env
      fs.writeFileSync(envPath, envContent.trim() + '\n');
      
      return { success: true, message: 'Configuration sauvegardée' };
    } catch (error) {
      return { 
        success: false, 
        message: `Erreur lors de la sauvegarde: ${error.message}` 
      };
    }
  }

  /**
   * Créer ou mettre à jour le schéma Prisma selon le provider
   */
  updatePrismaSchema(provider) {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    try {
      // Copier le bon template selon le provider
      let templatePath;
      if (provider === 'mysql') {
        templatePath = path.join(process.cwd(), 'prisma', 'schema.mysql.prisma');
      } else if (provider === 'sqlite') {
        templatePath = path.join(process.cwd(), 'prisma', 'schema.sqlite.prisma');
      } else {
        return { success: false, message: `Provider non supporté: ${provider}` };
      }

      // Vérifier que le template existe
      if (!fs.existsSync(templatePath)) {
        return { success: false, message: `Template non trouvé: ${templatePath}` };
      }

      // Copier le template vers le schéma principal
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      fs.writeFileSync(schemaPath, templateContent);
      
      console.log(`📋 Schéma ${provider} copié depuis ${templatePath}`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Migrer vers la nouvelle base de données
   */
  async migrateToNewDatabase(config) {
    try {
      // 1. Tester la connexion
      const testResult = await this.testConnection(config);
      if (!testResult.success) {
        return testResult;
      }

      // 2. Sauvegarder l'ancienne configuration
      const oldConfig = this.getCurrentConfig();
      
      // 3. Sauvegarder la nouvelle configuration
      const saveResult = await this.saveConfig(config);
      if (!saveResult.success) {
        return saveResult;
      }

      // 4. Mettre à jour le schéma Prisma
      const schemaResult = this.updatePrismaSchema(config.provider);
      if (!schemaResult.success) {
        return { success: false, message: `Erreur schéma: ${schemaResult.message}` };
      }

      // 5. Régénérer le client Prisma
      execSync('npx prisma generate', { cwd: process.cwd() });

      // 6. Créer les tables dans la nouvelle base
      execSync('npx prisma db push', { cwd: process.cwd() });

      // 7. Si on migre depuis SQLite, copier les données
      if (oldConfig.provider === 'sqlite' && config.provider !== 'sqlite') {
        await this.copyDataFromSQLite(config);
      }

      return { 
        success: true, 
        message: 'Migration terminée avec succès. Redémarrez le serveur.' 
      };

    } catch (error) {
      return { 
        success: false, 
        message: `Erreur lors de la migration: ${error.message}` 
      };
    }
  }

  /**
   * Copier les données depuis SQLite vers la nouvelle base
   */
  async copyDataFromSQLite(newConfig) {
    // Client pour l'ancienne base SQLite
    const oldClient = new PrismaClient({
      datasources: {
        db: { url: 'file:./prisma/dev.db' }
      }
    });

    // Client pour la nouvelle base
    const newUrl = this.buildDatabaseUrl(newConfig);
    const newClient = new PrismaClient({
      datasources: {
        db: { url: newUrl }
      }
    });

    try {
      // Copier les duellistes
      const duellistes = await oldClient.dueliste.findMany();
      for (const dueliste of duellistes) {
        await newClient.dueliste.create({ data: dueliste });
      }

      // Copier les duels
      const duels = await oldClient.duel.findMany();
      for (const duel of duels) {
        await newClient.duel.create({ data: duel });
      }

      // Copier les scores
      const scores = await oldClient.score.findMany();
      for (const score of scores) {
        await newClient.score.create({ data: score });
      }

      console.log('✅ Données copiées avec succès');
    } finally {
      await oldClient.$disconnect();
      await newClient.$disconnect();
    }
  }

  /**
   * Vérifier si les tables existent dans la nouvelle base
   */
  async checkTablesExist(config) {
    const { provider, host, port, database, username, password } = config;
    
    try {
      const expectedTables = ['duellistes', 'duels', 'validations_scores']; // Tables exactement comme Prisma les nomme
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
        
        // Vérifier les tables existantes
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('🔍 Tables trouvées dans MySQL:', rows);
        
        const tableNames = rows.map(row => Object.values(row)[0]);
        console.log('📋 Noms des tables extraits:', tableNames);
        
        expectedTables.forEach(table => {
          if (tableNames.includes(table)) {
            existingTables.push(table);
          } else {
            missingTables.push(table);
          }
        });
        
        console.log('✅ Tables existantes:', existingTables);
        console.log('❌ Tables manquantes:', missingTables);
        
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
        
        // Vérifier les tables existantes dans le schéma public
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        
        console.log('🔍 Tables trouvées dans PostgreSQL:', result.rows);
        
        const tableNames = result.rows.map(row => row.table_name);
        console.log('📋 Noms des tables extraits:', tableNames);
        
        expectedTables.forEach(table => {
          if (tableNames.includes(table)) {
            existingTables.push(table);
          } else {
            missingTables.push(table);
          }
        });
        
        console.log('✅ Tables existantes:', existingTables);
        console.log('❌ Tables manquantes:', missingTables);
        
        await client.end();
      }
      
      return {
        success: true,
        data: {
          existingTables,
          missingTables,
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

  /**
   * Créer les tables manquantes dans la nouvelle base
   */
  async createMissingTables(config) {
    try {
      const { provider } = config;
      const url = this.buildDatabaseUrl(config);
      
      // Lire le schema.prisma original
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const originalSchema = fs.readFileSync(schemaPath, 'utf8');
      
      // Créer un schema temporaire avec le bon provider
      const tempSchemaPath = path.join(process.cwd(), 'prisma', 'schema.temp.prisma');
      const modifiedSchema = originalSchema.replace(
        /provider = "sqlite"/,
        `provider = "${provider}"`
      );
      
      fs.writeFileSync(tempSchemaPath, modifiedSchema);
      
      // Exécuter prisma db push avec le schema temporaire
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const command = `DATABASE_URL="${url}" npx prisma db push --force-reset --schema=./prisma/schema.temp.prisma`;
      
      console.log('🔧 Commande Prisma:', command.replace(url, 'DATABASE_URL=[HIDDEN]'));
      
      const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
      
      console.log('✅ Stdout Prisma:', stdout);
      if (stderr) {
        console.log('⚠️ Stderr Prisma:', stderr);
      }
      
      // Nettoyer le fichier temporaire
      if (fs.existsSync(tempSchemaPath)) {
        fs.unlinkSync(tempSchemaPath);
      }
      
      return {
        success: true,
        message: 'Tables créées avec succès'
      };
      
    } catch (error) {
      console.error('Erreur lors de la création des tables:', error);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      const tempSchemaPath = path.join(process.cwd(), 'prisma', 'schema.temp.prisma');
      if (fs.existsSync(tempSchemaPath)) {
        fs.unlinkSync(tempSchemaPath);
      }
      
      return {
        success: false,
        message: `Erreur lors de la création des tables: ${error.message}`
      };
    }
  }

  /**
   * Vérifier le contenu des tables dans la nouvelle base
   */
  async checkTablesContent(config) {
    const { provider, host, port, database, username, password } = config;
    
    try {
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
        const tables = ['duellistes', 'duels', 'validations_scores'];
        for (const table of tables) {
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
        const tables = ['duellistes', 'duels', 'validations_scores'];
        for (const table of tables) {
          try {
            const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
            tablesContent[table] = parseInt(result.rows[0].count);
          } catch (error) {
            tablesContent[table] = 0; // Table n'existe pas ou est vide
          }
        }
        
        await client.end();
      }
      
      const totalRecords = Object.values(tablesContent).reduce((sum, count) => sum + count, 0);
      
      return {
        success: true,
        data: {
          tablesContent,
          totalRecords,
          hasData: totalRecords > 0
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de la vérification du contenu:', error);
      return {
        success: false,
        message: `Erreur lors de la vérification du contenu: ${error.message}`
      };
    }
  }

  // Fonction pour convertir les dates SQLite (texte) en vraies dates MySQL
  convertSQLiteDate(dateValue) {
    if (!dateValue || dateValue === '' || dateValue === '0000-00-00' || dateValue === '0000-00-00 00:00:00') {
      return null;
    }
    
    // Si c'est déjà un objet Date
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // Convertir string en Date
    const date = new Date(dateValue);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      console.warn(`⚠️ Date invalide: ${dateValue}, conversion en null`);
      return null;
    }
    
    return date;
  }

  /**
   * Migrer les données de SQLite vers la nouvelle base
   */
  async migrateDatabase(config) {
    console.log('🚀 Début de la migration des données...');
    console.log('📋 Config reçue:', config);
    
    try {
      // 1. Se connecter à SQLite (source) - Utiliser chemin absolu
      const path = require('path');
      const sqliteDbPath = path.join(process.cwd(), 'prisma', 'prisma', 'dev.db');
      console.log('📂 Chemin SQLite:', sqliteDbPath);
      const sqliteDb = new sqlite3.Database(sqliteDbPath);
      
      // 2. Se connecter à la base cible
      let targetConnection;
      const dbType = config.type || config.provider; // Support des deux formats
      
      if (dbType === 'mysql') {
        const mysql = require('mysql2/promise');
        targetConnection = await mysql.createConnection({
          host: config.host || 'localhost',
          port: config.port || 3306,
          user: config.username,
          password: config.password,
          database: config.database
        });
      } else if (dbType === 'postgresql') {
        const { Client } = require('pg');
        targetConnection = new Client({
          host: config.host || 'localhost',
          port: config.port || 5432,
          user: config.username,
          password: config.password,
          database: config.database
        });
        await targetConnection.connect();
      } else {
        throw new Error(`Type de base de données non supporté: ${dbType}. Types supportés: mysql, postgresql`);
      }

      const migrationStats = { duellistes: 0, duels: 0, validations_scores: 0 };

      // 3. Migrer les duellistes
      console.log('🏆 Migration des duellistes...');
      const duellistes = await new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM duellistes', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      for (const dueliste of duellistes) {
        // Utiliser le même nom de table partout : duellistes
        const query = dbType === 'mysql' ? 
          'INSERT INTO duellistes (id, pseudo, avatarUrl, dateInscription, statut, email, passwordHash, authMode, emailVerified, otpCode, otpExpiry, nbVictoires, nbDefaites, nbMatchsTotal, indiceTouches, categorie, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)' :
          'INSERT INTO duellistes (id, pseudo, "avatarUrl", "dateInscription", statut, email, "passwordHash", "authMode", "emailVerified", "otpCode", "otpExpiry", "nbVictoires", "nbDefaites", "nbMatchsTotal", "indiceTouches", categorie, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)';
        
        // Convertir les dates SQLite vers MySQL et undefined en null
        const values = [
          dueliste.id,
          dueliste.pseudo,
          dueliste.avatarUrl ?? null,
          this.convertSQLiteDate(dueliste.dateInscription),
          dueliste.statut,
          dueliste.email ?? null,
          dueliste.passwordHash ?? null,
          dueliste.authMode,
          dueliste.emailVerified,
          dueliste.otpCode ?? null,
          this.convertSQLiteDate(dueliste.otpExpiry),
          dueliste.nbVictoires,
          dueliste.nbDefaites,
          dueliste.nbMatchsTotal,
          dueliste.indiceTouches,
          dueliste.categorie,
          this.convertSQLiteDate(dueliste.createdAt),
          this.convertSQLiteDate(dueliste.updatedAt)
        ];

        if (dbType === 'mysql') {
          await targetConnection.execute(query, values);
        } else {
          await targetConnection.query(query, values);
        }
        migrationStats.duellistes++;
      }

      // 4. Migrer les duels
      console.log('⚔️ Migration des duels...');
      const duels = await new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM duels', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      for (const duel of duels) {
        // Utiliser le même nom de table partout : duels
        const query = dbType === 'mysql' ? 
          'INSERT INTO duels (id, provocateurId, adversaireId, arbitreId, etat, dateProposition, dateAcceptation, dateProgrammee, dateValidation, scoreProvocateur, scoreAdversaire, vainqueurId, valideParProvocateur, valideParAdversaire, valideParArbitre, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)' :
          'INSERT INTO duels (id, "provocateurId", "adversaireId", "arbitreId", etat, "dateProposition", "dateAcceptation", "dateProgrammee", "dateValidation", "scoreProvocateur", "scoreAdversaire", "vainqueurId", "valideParProvocateur", "valideParAdversaire", "valideParArbitre", notes, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)';
        
        // Convertir les dates SQLite vers MySQL et undefined en null
        const values = [
          duel.id,
          duel.provocateurId,
          duel.adversaireId,
          duel.arbitreId ?? null,
          duel.etat,
          this.convertSQLiteDate(duel.dateProposition),
          this.convertSQLiteDate(duel.dateAcceptation),
          this.convertSQLiteDate(duel.dateProgrammee),
          this.convertSQLiteDate(duel.dateValidation),
          duel.scoreProvocateur ?? null,
          duel.scoreAdversaire ?? null,
          duel.vainqueurId ?? null,
          duel.valideParProvocateur,
          duel.valideParAdversaire,
          duel.valideParArbitre,
          duel.notes ?? null,
          this.convertSQLiteDate(duel.createdAt),
          this.convertSQLiteDate(duel.updatedAt)
        ];

        if (dbType === 'mysql') {
          await targetConnection.execute(query, values);
        } else {
          await targetConnection.query(query, values);
        }
        migrationStats.duels++;
      }

      // 5. Migrer les scores de validation
      console.log('📊 Migration des scores...');
      const scores = await new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM validations_scores', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      for (const score of scores) {
        // Utiliser le même nom de table partout : validations_scores
        const query = dbType === 'mysql' ? 
          'INSERT INTO validations_scores (id, matchId, duelisteId, scoreProvocateur, scoreAdversaire, dateSaisie) VALUES (?, ?, ?, ?, ?, ?)' :
          'INSERT INTO validations_scores (id, "matchId", "duelisteId", "scoreProvocateur", "scoreAdversaire", "dateSaisie") VALUES ($1, $2, $3, $4, $5, $6)';
        
        // Convertir undefined en null pour MySQL et adapter les noms de colonnes + dates
        const values = [
          score.id,
          score.matchId ?? score.duelId, // matchId dans le nouveau schéma
          score.duelisteId ?? score.userId, // duelisteId dans le nouveau schéma
          score.scoreProvocateur ?? null,
          score.scoreAdversaire ?? null,
          this.convertSQLiteDate(score.dateSaisie ?? score.dateCreation) // dateSaisie dans le nouveau schéma
        ];

        if (dbType === 'mysql') {
          await targetConnection.execute(query, values);
        } else {
          await targetConnection.query(query, values);
        }
        migrationStats.validations_scores++;
      }

      // 6. Fermer les connexions
      sqliteDb.close();
      if (dbType === 'mysql') {
        await targetConnection.end();
      } else {
        await targetConnection.end();
      }

      console.log('✅ Migration terminée:', migrationStats);
      return {
        success: true,
        data: migrationStats,
        message: 'Migration terminée avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return {
        success: false,
        message: `Erreur lors de la migration: ${error.message}`
      };
    }
  }

  // Finaliser la migration en mettant à jour la configuration
  async finalizeMigration(newConfig) {
    try {
      console.log('🔄 Finalisation de la migration...');
      
      // 1. Sauvegarder la nouvelle configuration dans .env
      const saveResult = await this.saveConfig(newConfig);
      if (!saveResult.success) {
        return saveResult;
      }

      // 2. Mettre à jour le schéma Prisma
      const schemaResult = this.updatePrismaSchema(newConfig.provider);
      if (!schemaResult.success) {
        return { success: false, message: `Erreur schéma: ${schemaResult.message}` };
      }

      // 3. Régénérer le client Prisma
      const { execSync } = require('child_process');
      console.log('📦 Régénération du client Prisma...');
      execSync('npx prisma generate', { cwd: process.cwd() });

      console.log('✅ Migration finalisée avec succès !');
      console.log('⚠️  REDÉMARREZ LE SERVEUR pour que les changements prennent effet.');
      
      return {
        success: true,
        message: 'Migration finalisée avec succès. Redémarrez le serveur.',
        needsRestart: true
      };

    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      return {
        success: false,
        message: `Erreur lors de la finalisation: ${error.message}`
      };
    }
  }
}

module.exports = new DatabaseConfigService();