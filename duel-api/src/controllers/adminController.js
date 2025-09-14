const adminService = require('../services/adminService');

class AdminController {
  
  /**
   * GET /api/admin/users - Lister tous les utilisateurs
   */
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await adminService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        message: 'Liste des utilisateurs récupérée',
        data: result
      });
    } catch (error) {
      console.error('Erreur dans getUsers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }

  /**
   * GET /api/admin/users/:id - Obtenir un utilisateur par ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);

      res.status(200).json({
        success: true,
        message: 'Utilisateur récupéré',
        data: { user }
      });
    } catch (error) {
      console.error('Erreur dans getUserById:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Utilisateur non trouvé'
      });
    }
  }

  /**
   * PUT /api/admin/users/:id - Mettre à jour un utilisateur
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedUser = await adminService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Erreur dans updateUser:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors de la mise à jour'
      });
    }
  }

  /**
   * DELETE /api/admin/users/:id - Supprimer un utilisateur
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Erreur dans deleteUser:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors de la suppression'
      });
    }
  }

  /**
   * DELETE /api/admin/users - Supprimer plusieurs utilisateurs
   */
  async deleteMultipleUsers(req, res) {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Liste d\'IDs utilisateurs requise'
        });
      }

      const result = await adminService.deleteMultipleUsers(userIds);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Erreur dans deleteMultipleUsers:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors de la suppression multiple'
      });
    }
  }

  /**
   * GET /api/admin/stats - Obtenir les statistiques
   */
  async getStats(req, res) {
    try {
      const stats = await adminService.getUserStats();

      res.status(200).json({
        success: true,
        message: 'Statistiques récupérées',
        data: { stats }
      });
    } catch (error) {
      console.error('Erreur dans getStats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  /**
   * GET /api/admin/search - Rechercher des utilisateurs
   */
  async searchUsers(req, res) {
    try {
      const { q: query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Paramètre de recherche requis'
        });
      }

      const result = await adminService.searchUsers(query, page, limit);

      res.status(200).json({
        success: true,
        message: 'Recherche effectuée',
        data: result
      });
    } catch (error) {
      console.error('Erreur dans searchUsers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la recherche'
      });
    }
  }
}

module.exports = new AdminController();