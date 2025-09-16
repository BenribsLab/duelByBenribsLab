import api from './api';
import adminAuthService from './adminAuthService';

class AdminService {
  /**
   * Obtenir la liste des utilisateurs avec pagination
   */
  async getUsers(page = 1, limit = 10) {
    try {
      const response = await api.get('/admin/users', {
        params: { page, limit },
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des utilisateurs');
    }
  }

  /**
   * Rechercher des utilisateurs
   */
  async searchUsers(query, page = 1, limit = 10) {
    try {
      const response = await api.get('/admin/search', {
        params: { q: query, page, limit },
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la recherche');
    }
  }

  /**
   * Obtenir les détails d'un utilisateur
   */
  async getUserById(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`, {
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération de l\'utilisateur');
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData, {
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`, {
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  }

  /**
   * Obtenir les statistiques du système
   */
  async getStats() {
    try {
      const response = await api.get('/admin/stats', {
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Obtenir l'activité système
   */
  async getActivity(page = 1, limit = 20) {
    try {
      const response = await api.get('/admin/activity', {
        params: { page, limit },
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération de l\'activité');
    }
  }

  /**
   * Valider manuellement un utilisateur
   */
  async validateUser(userId) {
    try {
      const response = await api.post(`/admin/users/${userId}/validate`, {}, {
        headers: adminAuthService.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors de la validation');
    }
  }

  /**
   * Gestion des duels
   */
  duels = {
    /**
     * Obtenir tous les duels avec pagination et filtres
     */
    getAll: async (params = {}) => {
      try {
        // Nettoyer les paramètres vides
        const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            acc[key] = value;
          }
          return acc;
        }, {});
        
        console.log('Params envoyés à l\'API:', cleanParams);
        const response = await api.get('/admin/duels', {
          params: cleanParams,
          headers: adminAuthService.getAuthHeaders()
        });
        return response.data;
      } catch (error) {
        console.error('Erreur API duels:', error.response?.data);
        console.error('Details validation:', error.response?.data?.details);
        console.error('Status:', error.response?.status);
        throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des duels');
      }
    },

    /**
     * Obtenir les statistiques des duels
     */
    getStatistiques: async () => {
      try {
        const response = await api.get('/admin/duels/statistiques', {
          headers: adminAuthService.getAuthHeaders()
        });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des statistiques');
      }
    },

    /**
     * Supprimer un duel
     */
    supprimer: async (id, raison) => {
      try {
        const response = await api.delete(`/admin/duels/${id}`, {
          data: { raison },
          headers: adminAuthService.getAuthHeaders()
        });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Erreur lors de la suppression');
      }
    },

    /**
     * Forcer la validation d'un duel
     */
    forcerValidation: async (id, scoreData) => {
      try {
        const response = await api.put(`/admin/duels/${id}/forcer-validation`, scoreData, {
          headers: adminAuthService.getAuthHeaders()
        });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || 'Erreur lors de la validation forcée');
      }
    }
  };
}

export default new AdminService();