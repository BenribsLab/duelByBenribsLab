const adminAuthService = require('../services/adminAuthService');

class AdminAuthController {
  
  /**
   * POST /api/admin/auth/login - Connexion admin
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nom d\'utilisateur et mot de passe requis'
        });
      }

      const result = await adminAuthService.loginAdmin(username, password);

      res.status(200).json({
        success: true,
        message: 'Connexion administrateur réussie',
        data: result
      });
    } catch (error) {
      console.error('Erreur de connexion admin:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Erreur lors de la connexion administrateur'
      });
    }
  }

  /**
   * POST /api/admin/auth/verify - Vérifier le token admin
   */
  async verifyToken(req, res) {
    try {
      // Si on arrive ici, c'est que le middleware a validé le token
      res.status(200).json({
        success: true,
        message: 'Token admin valide',
        data: {
          admin: req.admin
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Token admin invalide'
      });
    }
  }

  /**
   * POST /api/admin/auth/change-password - Changer le mot de passe admin
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe actuel et nouveau mot de passe requis'
        });
      }

      const result = await adminAuthService.updateAdminPassword(currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Erreur de changement de mot de passe admin:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors du changement de mot de passe'
      });
    }
  }

  /**
   * POST /api/admin/auth/logout - Déconnexion admin (côté client)
   */
  async logout(req, res) {
    // Côté serveur, pas besoin de faire quoi que ce soit pour JWT
    // Le client supprime simplement le token
    res.status(200).json({
      success: true,
      message: 'Déconnexion administrateur réussie'
    });
  }
}

module.exports = new AdminAuthController();