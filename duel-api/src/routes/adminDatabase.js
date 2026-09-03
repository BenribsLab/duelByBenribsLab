const express = require('express');
const { body } = require('express-validator');
const validation = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { localhostOnly } = require('../middleware/localhostOnly');
const databaseConfigService = require('../services/databaseConfigService');

const router = express.Router();

// Middleware d'authentification admin pour toutes les routes
router.use(authenticateAdmin);
router.use(localhostOnly);

/**
 * GET /api/admin/database/config
 * Obtenir la configuration actuelle de la base de données
 * Accès restreint à localhost uniquement pour des raisons de sécurité
 */
router.get('/config', localhostOnly, async (req, res) => {
  try {
    const config = databaseConfigService.getCurrentConfig();
    
    const responseData = {
      provider: config.provider,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la config DB:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/admin/database/test-connection
 * Tester une connexion à une base de données
 */
router.post('/test-connection', [
  body('provider')
    .isIn(['sqlite', 'mysql', 'postgresql'])
    .withMessage('Provider doit être sqlite, mysql ou postgresql'),
  
  body('host')
    .optional()
    .isString()
    .withMessage('Host doit être une chaîne'),
  
  body('port')
    .optional()
    .isPort()
    .withMessage('Port doit être valide'),
  
  body('database')
    .optional()
    .isString()
    .withMessage('Database doit être une chaîne'),
  
  body('username')
    .optional()
    .isString()
    .withMessage('Username doit être une chaîne'),
  
  body('password')
    .optional()
    .isString()
    .withMessage('Password doit être une chaîne'),
  
  validation.handleValidation,
], async (req, res) => {
  try {
    const { provider, host, port, database, username, password } = req.body;
    
    console.log('📡 Requête de test de connexion reçue:', {
      provider,
      host,
      port,
      database,
      username,
      password: password ? '••••••••' : 'VIDE!'
    });
    
    const config = {
      provider,
      host,
      port,
      database,
      username,
      password
    };
    
    const result = await databaseConfigService.testConnection(config);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du test'
    });
  }
});

/**
 * POST /api/admin/database/migrate
 * Migrer vers une nouvelle base de données
 */
router.post('/migrate', [
  body('provider')
    .isIn(['sqlite', 'mysql', 'postgresql'])
    .withMessage('Provider doit être sqlite, mysql ou postgresql'),
  
  body('host')
    .if(body('provider').not().equals('sqlite'))
    .notEmpty()
    .withMessage('Host requis pour MySQL/PostgreSQL'),
  
  body('database')
    .if(body('provider').not().equals('sqlite'))
    .notEmpty()
    .withMessage('Database requis pour MySQL/PostgreSQL'),
  
  body('username')
    .if(body('provider').not().equals('sqlite'))
    .notEmpty()
    .withMessage('Username requis pour MySQL/PostgreSQL'),
  
  body('password')
    .if(body('provider').not().equals('sqlite'))
    .notEmpty()
    .withMessage('Password requis pour MySQL/PostgreSQL'),
  
  validation.handleValidation,
], async (req, res) => {
  try {
    const { provider, host, port, database, username, password } = req.body;
    
    const config = {
      provider,
      host,
      port,
      database,
      username,
      password
    };
    
    const result = await databaseConfigService.migrateToNewDatabase(config);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la migration'
    });
  }
});

/**
 * GET /api/admin/database/providers
 * Lister les providers de base de données supportés
 */
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'sqlite',
        name: 'SQLite',
        description: 'Base de données embarquée (par défaut)',
        requiresConnection: false
      },
      {
        id: 'mysql',
        name: 'MySQL',
        description: 'Base de données MySQL/MariaDB',
        requiresConnection: true,
        defaultPort: 3306
      },
      {
        id: 'postgresql',
        name: 'PostgreSQL',
        description: 'Base de données PostgreSQL',
        requiresConnection: true,
        defaultPort: 5432
      }
    ]
  });
});

/**
 * POST /api/admin/database/check-tables
 * Vérifier si les tables existent dans la nouvelle base
 */
router.post('/check-tables', [
  body('provider')
    .isIn(['mysql', 'postgresql'])
    .withMessage('Provider doit être mysql ou postgresql'),
  
  body('host')
    .notEmpty()
    .withMessage('Host requis'),
  
  body('database')
    .notEmpty()
    .withMessage('Database requis'),
  
  body('username')
    .notEmpty()
    .withMessage('Username requis'),
  
  body('password')
    .notEmpty()
    .withMessage('Password requis'),
  
  validation.handleValidation,
], async (req, res) => {
  try {
    const config = req.body;
    const result = await databaseConfigService.checkTablesExist(config);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des tables'
    });
  }
});

/**
 * POST /api/admin/database/create-tables
 * Créer les tables manquantes dans la nouvelle base
 */
router.post('/create-tables', [
  body('provider')
    .isIn(['mysql', 'postgresql'])
    .withMessage('Provider doit être mysql ou postgresql'),
  
  body('host')
    .notEmpty()
    .withMessage('Host requis'),
  
  body('database')
    .notEmpty()
    .withMessage('Database requis'),
  
  body('username')
    .notEmpty()
    .withMessage('Username requis'),
  
  body('password')
    .notEmpty()
    .withMessage('Password requis'),
  
  validation.handleValidation,
], async (req, res) => {
  try {
    const config = req.body;
    const result = await databaseConfigService.createMissingTables(config);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création des tables'
    });
  }
});

/**
 * POST /api/admin/database/check-content
 * Vérifier le contenu des tables dans la nouvelle base
 */
router.post('/check-content', [
  body('provider')
    .isIn(['mysql', 'postgresql'])
    .withMessage('Provider doit être mysql ou postgresql'),
  
  body('host')
    .notEmpty()
    .withMessage('Host requis'),
  
  body('database')
    .notEmpty()
    .withMessage('Database requis'),
  
  body('username')
    .notEmpty()
    .withMessage('Username requis'),
  
  body('password')
    .notEmpty()
    .withMessage('Password requis'),
  
  validation.handleValidation,
], async (req, res) => {
  try {
    const config = req.body;
    const result = await databaseConfigService.checkTablesContent(config);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la vérification du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du contenu'
    });
  }
});

// Migrer les données
router.post('/migrate-data', authenticateAdmin, async (req, res) => {
  console.log('🚀 Début de la migration des données...');
  console.log('Migration demandée pour le provider:', req.body.provider);
  
  try {
    const config = req.body;
    console.log('⚙️ Appel du service de migration...');
    const result = await databaseConfigService.migrateDatabase(config);
    console.log('✅ Migration réussie:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la migration des données'
    });
  }
});

// Route pour finaliser la migration
router.post('/finalize-migration', async (req, res) => {
  console.log('📝 Requête de finalisation de migration reçue');
  
  try {
    const { newConfig } = req.body;
    
    if (!newConfig) {
      return res.status(400).json({
        success: false,
        message: 'Configuration manquante'
      });
    }

    console.log('🔄 Lancement de la finalisation...');
    const result = await databaseConfigService.finalizeMigration(newConfig);
    
    console.log('✅ Finalisation terminée:', result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur lors de la finalisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la finalisation'
    });
  }
});

// Switch entre SQLite et MySQL
router.post('/switch', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider || !['sqlite', 'mysql'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Provider invalide. Utilisez "sqlite" ou "mysql"'
      });
    }

    console.log(`🔄 Switch vers ${provider}...`);
    
    // Mettre à jour le schéma Prisma
    await databaseConfigService.updatePrismaSchema(provider);
    
    // Mettre à jour la configuration
    const newConfig = { provider: provider };
    await databaseConfigService.saveConfig(newConfig);
    
    // Régénérer le client Prisma
    const { execSync } = require('child_process');
    console.log('📦 Régénération du client Prisma...');
    execSync('npx --no-install prisma generate', { cwd: process.cwd() });
    
    console.log(`✅ Switch vers ${provider} terminé`);
    
    // Détecter si on est dans Docker
    const isDocker = process.env.DOCKER_ENV || require('fs').existsSync('/.dockerenv');
    
    if (isDocker) {
      console.log('🐳 Environnement Docker détecté - redémarrage automatique du container...');
      
      // Envoyer la réponse avant le redémarrage
      res.json({
        success: true,
        message: `Base de données basculée vers ${provider}. Le container va redémarrer automatiquement...`,
        currentProvider: provider,
        autoRestart: true
      });
      
      // Redémarrer le container après un délai
      setTimeout(() => {
        console.log('🔄 Redémarrage du container...');
        process.exit(0); // Le container va redémarrer automatiquement
      }, 1000);
      
    } else {
      res.json({
        success: true,
        message: `Base de données basculée vers ${provider}. Redémarrez le serveur pour appliquer les changements.`,
        currentProvider: provider,
        needsRestart: true
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du switch:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du switch'
    });
  }
});

module.exports = router;
