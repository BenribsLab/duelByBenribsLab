import api from './api';

class AdminAuthService {
  constructor() {
    this.TOKEN_KEY = 'admin_auth_token';
  }

  /**
   * Connexion administrateur
   */
  async login(username, password) {
    try {
      const response = await api.post('/admin/auth/login', {
        username,
        password
      });

      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
        return response.data;
      }

      throw new Error(response.data.error || 'Erreur de connexion');
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur de connexion administrateur');
    }
  }

  /**
   * Vérifier le token admin
   */
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Aucun token administrateur');
      }

      const response = await api.post('/admin/auth/verify', {});
      // Authorization sera ajouté automatiquement par l'intercepteur

      return response.data.success;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }

  /**
   * Déconnexion
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await api.post('/admin/auth/logout', {});
        // Authorization sera ajouté automatiquement par l'intercepteur
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.removeToken();
    }
  }

  /**
   * Changer le mot de passe admin
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await api.post('/admin/auth/change-password', {
        currentPassword,
        newPassword
      });
      // Authorization sera ajouté automatiquement par l'intercepteur

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Obtenir le token depuis le localStorage
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Sauvegarder le token dans le localStorage
   */
  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Supprimer le token du localStorage
   */
  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Vérifier si l'utilisateur est connecté en tant qu'admin
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Obtenir le header d'autorisation pour les requêtes
   */
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export default new AdminAuthService();