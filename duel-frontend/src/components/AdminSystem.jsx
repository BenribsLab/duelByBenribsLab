import React, { useState, useEffect } from 'react';
import { Database, Server, Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import databaseService from '../services/databaseService';

const AdminSystem = () => {
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États pour le formulaire de migration
  const [migrationForm, setMigrationForm] = useState({
    provider: 'mysql',
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  });
  const [connectionTest, setConnectionTest] = useState({
    status: 'idle', // idle, testing, success, error
    message: ''
  });
  const [migration, setMigration] = useState({
    status: 'idle', // idle, migrating, success, error
    message: '',
    progress: 0
  });
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // États pour le switch de base de données
  const [mysqlAvailable, setMysqlAvailable] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  
  // États pour les étapes de migration
  const [migrationSteps, setMigrationSteps] = useState({
    tablesCheck: { status: 'pending', data: null, message: '' },
    tablesCreation: { status: 'pending', data: null, message: '' },
    contentCheck: { status: 'pending', data: null, message: '' },
    dataMigration: { status: 'pending', data: null, message: '' },
    finalization: { status: 'pending', message: '', needsRestart: false }
  });

  useEffect(() => {
    loadConfig();
  }, []);

  // Vérifier MySQL quand la config change
  useEffect(() => {
    if (currentConfig && currentConfig.host) {
      checkMysqlAvailability();
    }
  }, [currentConfig]);

  // Pré-remplir le formulaire avec les données existantes
  useEffect(() => {
    if (currentConfig && currentConfig.host) {
      setMigrationForm({
        provider: currentConfig.provider === 'sqlite' ? 'mysql' : currentConfig.provider,
        host: currentConfig.host || '',
        port: currentConfig.port || '',
        database: currentConfig.database || '',
        username: currentConfig.username || '',
        password: '' // Champ vide pour que l'utilisateur saisisse le mot de passe
      });
    }
  }, [currentConfig]);

  const loadConfig = async () => {
    try {
      const response = await databaseService.getCurrentConfig();
      if (response.success) {
        setCurrentConfig(response.data);
      } else {
        // Si erreur, on garde la config par défaut
        setCurrentConfig({
          provider: 'sqlite',
          database: 'dev.db',
          host: null,
          port: null,
          username: null
        });
      }
    } catch (error) {
      // Si erreur, on garde la config par défaut
      setCurrentConfig({
        provider: 'sqlite',
        database: 'dev.db', 
        host: null,
        port: null,
        username: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si MySQL est disponible
  const checkMysqlAvailability = async () => {
    try {
      // Si déjà sur MySQL, on considère que c'est disponible
      if (currentConfig?.provider === 'mysql') {
        setMysqlAvailable(true);
        return;
      }
      
      // Récupérer la configuration MySQL depuis l'API backend
      const mysqlEnvConfig = await databaseService.getCurrentConfig();
      
      const mysqlConfig = {
        provider: 'mysql',
        host: mysqlEnvConfig.data?.mysqlEnv?.host || mysqlEnvConfig.data?.host || 'benribs.fr',
        port: mysqlEnvConfig.data?.mysqlEnv?.port || mysqlEnvConfig.data?.port || '3306',
        database: mysqlEnvConfig.data?.mysqlEnv?.database || mysqlEnvConfig.data?.database || 'duel',
        username: mysqlEnvConfig.data?.mysqlEnv?.username || mysqlEnvConfig.data?.username || 'duel',
        password: mysqlEnvConfig.data?.mysqlEnv?.password || migrationForm.password || '' // Utiliser le password d'env ou saisi
      };
      
      // Test de connexion
      const connectionResponse = await databaseService.testConnection(mysqlConfig);
      
      if (!connectionResponse.success) {
        setMysqlAvailable(false);
        return;
      }
      
      // Vérifier les tables
      const tablesResponse = await databaseService.checkTablesExist(mysqlConfig);
      
      if (tablesResponse.success && tablesResponse.data?.existingTables?.length > 0) {
        setMysqlAvailable(true);
      } else {
        setMysqlAvailable(false);
      }
    } catch (error) {
      setMysqlAvailable(false);
    }
  };

  // Switch entre SQLite et MySQL
  const handleDatabaseSwitch = async (newProvider) => {
    if (switchLoading || newProvider === currentConfig?.provider) return;
    
    setSwitchLoading(true);
    try {
      const response = await databaseService.switchProvider(newProvider);
      if (response.success) {
        // Si on est dans Docker et redémarrage automatique
        if (response.autoRestart) {
          alert(`Base de données basculée vers ${newProvider === 'mysql' ? 'MySQL' : 'SQLite'}.\nLe serveur redémarre automatiquement...`);
          
          // Attendre que l'API redémarre
          const restarted = await databaseService.waitForRestart();
          if (restarted) {
            // Recharger la configuration après redémarrage
            await loadConfig();
            alert('✅ Redémarrage terminé ! Base de données mise à jour.');
          } else {
            alert('⚠️  Délai d\'attente dépassé. Veuillez rafraîchir la page.');
          }
        } else {
          // Mode classique - redémarrage manuel requis
          await loadConfig();
          alert(`Base de données basculée vers ${newProvider === 'mysql' ? 'MySQL' : 'SQLite'}.\n${response.message}`);
        }
      } else {
        alert(`Erreur lors du switch: ${response.message}`);
      }
    } catch (error) {
      alert(`Erreur lors du switch: ${error.message}`);
    } finally {
      setSwitchLoading(false);
    }
  };

  // Gestion du formulaire de migration
  const handleInputChange = (field, value) => {
    setMigrationForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      };
      
      // Auto-remplir le port par défaut quand on change le provider
      if (field === 'provider' && !prev.port) {
        newForm.port = value === 'mysql' ? '3306' : '5432';
      }
      
      return newForm;
    });
    // Reset du test de connexion quand on change les paramètres
    if (connectionTest.status !== 'idle') {
      setConnectionTest({ status: 'idle', message: '' });
    }
  };

  // Test de connexion à la nouvelle base
  const testConnection = async () => {
    setConnectionTest({ status: 'testing', message: 'Test de connexion en cours...' });
    
    try {
      const response = await databaseService.testConnection(migrationForm);
      
      if (response.success) {
        setConnectionTest({ 
          status: 'success', 
          message: response.message || 'Connexion réussie !' 
        });
      } else {
        setConnectionTest({ 
          status: 'error', 
          message: response.message || response.error || 'Échec de la connexion' 
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de connexion:', error);
      setConnectionTest({ 
        status: 'error', 
        message: `Erreur réseau: ${error.message}` 
      });
    }
  };

  // Migration de la base de données
  const migrateDatabase = async () => {
    setMigration({ status: 'migrating', message: 'Migration en cours...', progress: 0 });
    
    try {
      const response = await databaseService.migrateDatabase(migrationForm);
      if (response.success) {
        setMigration({ 
          status: 'success', 
          message: 'Migration réussie ! Rechargement de la configuration...', 
          progress: 100 
        });
        // Recharger la configuration actuelle
        loadConfig();
      } else {
        setMigration({ 
          status: 'error', 
          message: response.error || 'Échec de la migration', 
          progress: 0 
        });
      }
    } catch (error) {
      setMigration({ 
        status: 'error', 
        message: error.message, 
        progress: 0 
      });
    }
  };

  // Étape 1: Vérifier les tables
  const checkTables = async () => {
    setMigrationSteps(prev => ({
      ...prev,
      tablesCheck: { status: 'loading', data: null, message: 'Vérification des tables...' }
    }));
    
    try {
      const response = await databaseService.checkTablesExist(migrationForm);
      if (response.success) {
        setMigrationSteps(prev => ({
          ...prev,
          tablesCheck: { 
            status: 'success', 
            data: response.data, 
            message: response.data.allTablesExist ? 
              'Toutes les tables existent' : 
              `${response.data.missingTables.length} table(s) manquante(s)`
          }
        }));
      } else {
        setMigrationSteps(prev => ({
          ...prev,
          tablesCheck: { status: 'error', data: null, message: response.message }
        }));
      }
    } catch (error) {
      setMigrationSteps(prev => ({
        ...prev,
        tablesCheck: { status: 'error', data: null, message: error.message }
      }));
    }
  };

  // Étape 2: Créer les tables manquantes
  const createTables = async () => {
    setMigrationSteps(prev => ({
      ...prev,
      tablesCreation: { status: 'loading', data: null, message: 'Création des tables...' }
    }));
    
    try {
      const response = await databaseService.createTables(migrationForm);
      if (response.success) {
        setMigrationSteps(prev => ({
          ...prev,
          tablesCreation: { status: 'success', data: null, message: response.message }
        }));
        // Re-vérifier les tables après création
        checkTables();
      } else {
        setMigrationSteps(prev => ({
          ...prev,
          tablesCreation: { status: 'error', data: null, message: response.message }
        }));
      }
    } catch (error) {
      setMigrationSteps(prev => ({
        ...prev,
        tablesCreation: { status: 'error', data: null, message: error.message }
      }));
    }
  };

  // Étape 3: Vérifier le contenu
  const checkContent = async () => {
    setMigrationSteps(prev => ({
      ...prev,
      contentCheck: { status: 'loading', data: null, message: 'Vérification du contenu...' }
    }));
    
    try {
      const response = await databaseService.checkTablesContent(migrationForm);
      if (response.success) {
        setMigrationSteps(prev => ({
          ...prev,
          contentCheck: { 
            status: 'success', 
            data: response.data, 
            message: response.data.hasData ? 
              `${response.data.totalRecords} enregistrement(s) trouvé(s)` : 
              'Tables vides'
          }
        }));
      } else {
        setMigrationSteps(prev => ({
          ...prev,
          contentCheck: { status: 'error', data: null, message: response.message }
        }));
      }
    } catch (error) {
      setMigrationSteps(prev => ({
        ...prev,
        contentCheck: { status: 'error', data: null, message: error.message }
      }));
    }
  };

  // Étape 5: Finaliser la migration (changer la configuration)
  const finalizeMigration = async () => {
    setMigrationSteps(prev => ({
      ...prev,
      finalization: { status: 'loading', message: 'Finalisation de la migration...' }
    }));
    
    try {
      const response = await databaseService.finalizeMigration(migrationForm);
      if (response.success) {
        setMigrationSteps(prev => ({
          ...prev,
          finalization: { 
            status: 'success', 
            message: response.message,
            needsRestart: response.needsRestart
          }
        }));
        // Recharger la configuration actuelle
        loadConfig();
      } else {
        setMigrationSteps(prev => ({
          ...prev,
          finalization: { status: 'error', message: response.message }
        }));
      }
    } catch (error) {
      setMigrationSteps(prev => ({
        ...prev,
        finalization: { status: 'error', message: `Erreur: ${error.message}` }
      }));
    }
  };

  // Étape 4: Migrer les données
  const migrateData = async () => {
    setMigrationSteps(prev => ({
      ...prev,
      dataMigration: { status: 'loading', data: null, message: 'Migration des données en cours...' }
    }));
    
    try {
      const response = await databaseService.migrateData(migrationForm);
      if (response.success) {
        setMigrationSteps(prev => ({
          ...prev,
          dataMigration: { 
            status: 'success', 
            data: response.data, 
            message: 'Migration terminée ! Prêt pour la finalisation...'
          }
        }));
      } else {
        setMigrationSteps(prev => ({
          ...prev,
          dataMigration: { status: 'error', data: null, message: response.message }
        }));
      }
    } catch (error) {
      setMigrationSteps(prev => ({
        ...prev,
        dataMigration: { status: 'error', data: null, message: error.message }
      }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="mr-2" />
              Configuration Système
            </h2>
            <p className="text-gray-600 mt-1">
              Gérez la configuration de la base de données
            </p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-2" />
            Configuration Système
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez la configuration de la base de données
          </p>
        </div>
      </div>

      {/* Configuration actuelle */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Database className="mr-2" />
          Configuration actuelle
        </h3>
        
        {currentConfig && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type de base de données</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">
                {currentConfig.provider === 'sqlite' ? 'SQLite' : 
                 currentConfig.provider === 'mysql' ? 'MySQL' :
                 currentConfig.provider === 'postgresql' ? 'PostgreSQL' : 
                 currentConfig.provider}
              </dd>
            </div>
            
            {currentConfig.provider === 'sqlite' ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fichier</dt>
                <dd className="mt-1 text-sm text-gray-900">{currentConfig.database}</dd>
              </div>
            ) : (
              <>
                {currentConfig.host && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Serveur</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentConfig.host}:{currentConfig.port}</dd>
                  </div>
                )}
                {currentConfig.database && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Base de données</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentConfig.database}</dd>
                  </div>
                )}
                {currentConfig.username && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Utilisateur</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentConfig.username}</dd>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Formulaire de migration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Server className="mr-2" />
          Changer de base de données
        </h3>
        
        <div className="space-y-6">
          {/* Sélection du type de base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de base de données
            </label>
            <select
              value={migrationForm.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          {/* Paramètres de connexion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serveur (Host)
              </label>
              <input
                type="text"
                value={migrationForm.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder="localhost"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={migrationForm.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                placeholder={migrationForm.provider === 'mysql' ? '3306' : '5432'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la base de données
              </label>
              <input
                type="text"
                value={migrationForm.database}
                onChange={(e) => handleInputChange('database', e.target.value)}
                placeholder="duel"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={migrationForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="root"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={migrationForm.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder=""
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Test de connexion */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Test de connexion</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showDebugInfo ? 'Masquer détails' : 'Voir détails'}
                </button>
                <button
                  onClick={testConnection}
                  disabled={
                    connectionTest.status === 'testing' || 
                    !migrationForm.host.trim() || 
                    !migrationForm.database.trim() ||
                    !migrationForm.username.trim()
                  }
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectionTest.status === 'testing' ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Test en cours...
                    </>
                  ) : (
                    'Tester la connexion'
                  )}
                </button>
              </div>
            </div>
            
            {showDebugInfo && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md text-xs">
                <p className="font-medium text-gray-700 mb-2">Configuration envoyée :</p>
                <pre className="text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify({
                    provider: migrationForm.provider,
                    host: migrationForm.host,
                    port: migrationForm.port,
                    database: migrationForm.database,
                    username: migrationForm.username,
                    password: migrationForm.password ? '••••••••' : ''
                  }, null, 2)}
                </pre>
              </div>
            )}
            
            {connectionTest.status !== 'idle' && (
              <div className={`p-4 rounded-md ${
                connectionTest.status === 'success' ? 'bg-green-50 border border-green-200' :
                connectionTest.status === 'error' ? 'bg-red-50 border border-red-200' : 
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start">
                  {connectionTest.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 mt-0.5 mr-3 text-green-600" />
                  ) : connectionTest.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 mt-0.5 mr-3 text-red-600" />
                  ) : (
                    <Loader className="animate-spin h-5 w-5 mt-0.5 mr-3 text-blue-600" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      connectionTest.status === 'success' ? 'text-green-800' :
                      connectionTest.status === 'error' ? 'text-red-800' : 
                      'text-blue-800'
                    }`}>
                      {connectionTest.status === 'success' ? 'Connexion réussie' :
                       connectionTest.status === 'error' ? 'Erreur de connexion' : 
                       'Test en cours'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      connectionTest.status === 'success' ? 'text-green-700' :
                      connectionTest.status === 'error' ? 'text-red-700' : 
                      'text-blue-700'
                    }`}>
                      {connectionTest.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Migration par étapes */}
          {connectionTest.status === 'success' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Migration par étapes</h4>
              
              <div className="space-y-4">
                {/* Étape 1: Vérification des tables */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">1. Vérifier les tables</span>
                      {migrationSteps.tablesCheck.status === 'success' && (
                        <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                      )}
                      {migrationSteps.tablesCheck.status === 'error' && (
                        <AlertCircle className="ml-2 h-4 w-4 text-red-600" />
                      )}
                      {migrationSteps.tablesCheck.status === 'loading' && (
                        <Loader className="animate-spin ml-2 h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    {migrationSteps.tablesCheck.message && (
                      <p className="text-xs text-gray-600 mt-1">{migrationSteps.tablesCheck.message}</p>
                    )}
                    {migrationSteps.tablesCheck.data && (
                      <div className="text-xs text-gray-500 mt-1">
                        Existantes: {migrationSteps.tablesCheck.data.existingTables.join(', ') || 'Aucune'} |
                        Manquantes: {migrationSteps.tablesCheck.data.missingTables.join(', ') || 'Aucune'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={checkTables}
                    disabled={migrationSteps.tablesCheck.status === 'loading'}
                    className="ml-4 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    {migrationSteps.tablesCheck.status === 'loading' ? 'Vérification...' : 'Vérifier'}
                  </button>
                </div>

                {/* Étape 2: Création des tables */}
                {migrationSteps.tablesCheck.data && (!migrationSteps.tablesCheck.data.allTablesExist || migrationSteps.tablesCreation.status !== 'pending') && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">2. Créer les tables manquantes</span>
                        {migrationSteps.tablesCreation.status === 'success' && (
                          <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                        )}
                        {migrationSteps.tablesCreation.status === 'error' && (
                          <AlertCircle className="ml-2 h-4 w-4 text-red-600" />
                        )}
                        {migrationSteps.tablesCreation.status === 'loading' && (
                          <Loader className="animate-spin ml-2 h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      {migrationSteps.tablesCreation.message && (
                        <p className="text-xs text-gray-600 mt-1">{migrationSteps.tablesCreation.message}</p>
                      )}
                      {migrationSteps.tablesCheck.data && migrationSteps.tablesCheck.data.allTablesExist && migrationSteps.tablesCreation.status === 'pending' && (
                        <p className="text-xs text-gray-600 mt-1">Toutes les tables existent déjà</p>
                      )}
                    </div>
                    {(!migrationSteps.tablesCheck.data.allTablesExist && migrationSteps.tablesCreation.status !== 'success') && (
                      <button
                        onClick={createTables}
                        disabled={
                          migrationSteps.tablesCreation.status === 'loading' ||
                          migrationSteps.tablesCheck.status !== 'success'
                        }
                        className="ml-4 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        {migrationSteps.tablesCreation.status === 'loading' ? 'Création...' : 'Créer'}
                      </button>
                    )}
                    {migrationSteps.tablesCreation.status === 'success' && (
                      <span className="ml-4 px-3 py-1 text-xs text-green-600 font-medium">Terminé</span>
                    )}
                  </div>
                )}

                {/* Étape 3: Vérification du contenu */}
                {((migrationSteps.tablesCheck.data && migrationSteps.tablesCheck.data.allTablesExist) || 
                  migrationSteps.tablesCreation.status === 'success') && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">3. Vérifier le contenu existant</span>
                        {migrationSteps.contentCheck.status === 'success' && (
                          <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                        )}
                        {migrationSteps.contentCheck.status === 'error' && (
                          <AlertCircle className="ml-2 h-4 w-4 text-red-600" />
                        )}
                        {migrationSteps.contentCheck.status === 'loading' && (
                          <Loader className="animate-spin ml-2 h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      {migrationSteps.contentCheck.message && (
                        <p className="text-xs text-gray-600 mt-1">{migrationSteps.contentCheck.message}</p>
                      )}
                      {migrationSteps.contentCheck.data && (
                        <div className="text-xs text-gray-500 mt-1">
                          Duellistes: {migrationSteps.contentCheck.data.tablesContent.duellistes || 0} |
                          Duels: {migrationSteps.contentCheck.data.tablesContent.duels || 0} |
                          Validations: {migrationSteps.contentCheck.data.tablesContent.validations_scores || 0}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={checkContent}
                      disabled={migrationSteps.contentCheck.status === 'loading'}
                      className="ml-4 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      {migrationSteps.contentCheck.status === 'loading' ? 'Vérification...' : 'Vérifier'}
                    </button>
                  </div>
                )}

                {/* Étape 4: Migration des données */}
                {(migrationSteps.contentCheck.status === 'success' || 
                  (migrationSteps.tablesCreation.status === 'success' && migrationSteps.contentCheck.status === 'pending')) && (
                  <div className="p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        migrationSteps.dataMigration.status === 'success' ? 'bg-green-100 text-green-800' :
                        migrationSteps.dataMigration.status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                        migrationSteps.dataMigration.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        4
                      </span>
                      <span className="font-medium text-sm">Migration des données</span>
                      {migrationSteps.dataMigration.status === 'loading' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                    
                    {migrationSteps.dataMigration.status === 'idle' && (
                      <div className="text-gray-600 text-xs mb-3">
                        Prêt pour la migration des données depuis SQLite
                      </div>
                    )}
                    
                    {migrationSteps.dataMigration.status === 'success' && (
                      <div className="text-green-600 text-xs mb-3">
                        ✓ Migration terminée avec succès !
                        {migrationSteps.dataMigration.data && (
                          <div className="mt-1 text-xs">
                            <div>Duellistes: {migrationSteps.dataMigration.data.migrationDetails?.duellistes || 0}</div>
                            <div>Duels: {migrationSteps.dataMigration.data.migrationDetails?.duels || 0}</div>
                            <div>Scores: {migrationSteps.dataMigration.data.migrationDetails?.validations_scores || 0}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {migrationSteps.dataMigration.status === 'error' && (
                      <div className="text-red-600 text-xs mb-3">
                        ✗ {migrationSteps.dataMigration.message}
                      </div>
                    )}
                    
                    {migrationSteps.dataMigration.status === 'loading' && (
                      <div className="text-blue-600 text-xs mb-3">
                        {migrationSteps.dataMigration.message}
                      </div>
                    )}
                    
                    <button
                      onClick={migrateData}
                      disabled={
                        migrationSteps.contentCheck.status !== 'success' ||
                        migrationSteps.dataMigration.status === 'loading' ||
                        migrationSteps.dataMigration.status === 'success'
                      }
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        migrationSteps.contentCheck.status !== 'success' ||
                        migrationSteps.dataMigration.status === 'loading' ||
                        migrationSteps.dataMigration.status === 'success'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {migrationSteps.dataMigration.status === 'loading' ? 'Migration...' : 
                       migrationSteps.dataMigration.status === 'success' ? 'Terminé' : 
                       'Migrer les données'}
                    </button>
                  </div>
                )}

                {/* Étape 5: Finalisation */}
                {connectionTest.status === 'success' && (
                  <div className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">5. Finaliser la migration</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        migrationSteps.finalization.status === 'success' ? 'bg-green-100 text-green-700' :
                        migrationSteps.finalization.status === 'error' ? 'bg-red-100 text-red-700' :
                        migrationSteps.finalization.status === 'loading' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {migrationSteps.finalization.status === 'success' ? 'Terminé' :
                         migrationSteps.finalization.status === 'error' ? 'Erreur' :
                         migrationSteps.finalization.status === 'loading' ? 'En cours' :
                         'En attente'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      Mettre à jour la configuration pour utiliser la nouvelle base de données
                    </p>
                    
                    {migrationSteps.finalization.status === 'success' && (
                      <div className="text-green-600 text-xs mb-3">
                        ✓ {migrationSteps.finalization.message}
                        {migrationSteps.finalization.needsRestart && (
                          <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-orange-700">
                            ⚠️ Redémarrez le serveur pour que les changements prennent effet
                          </div>
                        )}
                      </div>
                    )}
                    
                    {migrationSteps.finalization.status === 'error' && (
                      <div className="text-red-600 text-xs mb-3">
                        ✗ {migrationSteps.finalization.message}
                      </div>
                    )}
                    
                    {migrationSteps.finalization.status === 'loading' && (
                      <div className="text-blue-600 text-xs mb-3">
                        {migrationSteps.finalization.message}
                      </div>
                    )}
                    
                    <button
                      onClick={finalizeMigration}
                      disabled={
                        migrationSteps.dataMigration.status !== 'success' ||
                        migrationSteps.finalization.status === 'loading' ||
                        migrationSteps.finalization.status === 'success'
                      }
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        migrationSteps.dataMigration.status !== 'success' ||
                        migrationSteps.finalization.status === 'loading' ||
                        migrationSteps.finalization.status === 'success'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {migrationSteps.finalization.status === 'loading' ? 'Finalisation...' : 
                       migrationSteps.finalization.status === 'success' ? 'Terminé' : 
                       'Finaliser la migration'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {connectionTest.status !== 'success' && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                Vous devez d'abord tester et valider la connexion avant de pouvoir procéder à la migration.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section Switch Base de Données */}
      {(() => {
        const shouldShow = (currentConfig?.provider === 'mysql' || mysqlAvailable);
        return shouldShow;
      })() && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Database className="mr-2" />
            Basculer entre les bases de données
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choisissez quelle base de données utiliser pour l'application.
            </p>
            
            <div className="flex items-center justify-center p-6">
              <div className="flex items-center space-x-4">
                {/* SQLite */}
                <div className="text-center">
                  <button
                    onClick={() => handleDatabaseSwitch('sqlite')}
                    disabled={switchLoading || currentConfig?.provider === 'sqlite'}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      currentConfig?.provider === 'sqlite'
                        ? 'bg-blue-600 text-white ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${switchLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    SQLite
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Local</p>
                </div>

                {/* Indicateur de connexion */}
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-16 rounded-full ${
                    currentConfig?.provider === 'mysql' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  {switchLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  <div className={`h-2 w-16 rounded-full ${
                    currentConfig?.provider === 'sqlite' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                </div>

                {/* MySQL */}
                <div className="text-center">
                  <button
                    onClick={() => handleDatabaseSwitch('mysql')}
                    disabled={switchLoading || currentConfig?.provider === 'mysql'}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      currentConfig?.provider === 'mysql'
                        ? 'bg-blue-600 text-white ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${switchLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    MySQL
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Remote</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Base active : <span className="font-medium">
                  {currentConfig?.provider === 'mysql' ? 'MySQL' : 'SQLite'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystem;