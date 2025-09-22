import api from './api';

class DatabaseService {
  constructor() {
    // Utiliser le service api existant au lieu de créer une nouvelle instance
  }

  /**
   * Obtenir la configuration actuelle de la base de données
   */
  async getCurrentConfig() {
    try {
      const response = await api.get('/admin/database/config');
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération de la configuration');
    }
  }

  /**
   * Obtenir la liste des providers supportés
   */
  async getSupportedProviders() {
    try {
      const response = await api.get('/admin/database/providers');
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des fournisseurs supportés');
    }
  }

  /**
   * Tester une connexion à une base de données
   */
  async testConnection(config) {
    try {
      const response = await api.post('/admin/database/test-connection', config);
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors du test de connexion');
    }
  }

  /**
   * Migrer vers une nouvelle base de données
   */
  async migrateDatabase(newConfig) {
    try {
      const response = await api.post('/admin/database/migrate', newConfig);
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la migration');
    }
  }

  async checkTablesExist(config) {
    try {
      const response = await api.post('/admin/database/check-tables', config);
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la vérification des tables');
    }
  }

  async createTables(config) {
    try {
      const response = await api.post('/admin/database/create-tables', config);
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la création des tables');
    }
  }

  async checkTablesContent(config) {
    try {
      const response = await api.post('/admin/database/check-content', config);
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la vérification du contenu');
    }
  }

  async migrateData(config) {
    try {
      const response = await api.post('/admin/database/migrate-data', config);
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la migration des données');
    }
  }

  async finalizeMigration(config) {
    try {
      const response = await api.post('/admin/database/finalize-migration', { newConfig: config });
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la finalisation de la migration');
    }
  }

  /**
   * Switch entre SQLite et MySQL
   */
  async switchProvider(provider) {
    try {
      const response = await api.post('/admin/database/switch', { provider });
      // Authorization sera ajouté automatiquement par l'intercepteur
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors du changement de base de données');
    }
  }

  /**
   * Vérifier la santé de l'API (pour Docker restart)
   */
  async checkHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Attendre que l'API redémarre (pour Docker)
   */
  async waitForRestart(maxAttempts = 30, interval = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, interval));
      
      const health = await this.checkHealth();
      if (health && health.status === 'healthy') {
        return true;
      }
      
      console.log(`Tentative ${attempt}/${maxAttempts} - API pas encore prête...`);
    }
    return false;
  }
}

export default new DatabaseService();