const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // TODO: utiliser pour le hash des mots de passe

/**
 * Service d'authentification pour l'administration
 */
class AdminAuthService {
  
  /**
   * Vérifier les credentials admin
   */
  async verifyAdminCredentials(username, password) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'test123';
    
    // Vérification simple (en production, stocker le hash du mot de passe)
    if (username === adminUsername && password === adminPassword) {
      return true;
    }
    
    return false;
  }

  /**
   * Générer un token JWT admin
   */
  generateAdminToken(username = 'admin') {
    return jwt.sign(
      { 
        username, 
        role: 'admin',
        type: 'admin_session'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token admin expire en 24h
    );
  }

  /**
   * Vérifier un token admin
   */
  verifyAdminToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier que c'est bien un token admin
      if (decoded.role === 'admin' && decoded.type === 'admin_session') {
        return decoded;
      }
      
      throw new Error('Token admin invalide');
    } catch (error) {
      throw new Error('Token admin invalide ou expiré');
    }
  }

  /**
   * Connexion admin
   */
  async loginAdmin(username, password) {
    const isValid = await this.verifyAdminCredentials(username, password);
    
    if (!isValid) {
      throw new Error('Identifiants administrateur invalides');
    }

    const token = this.generateAdminToken(username);
    
    return {
      token,
      message: 'Connexion administrateur réussie'
    };
  }

  /**
   * Mettre à jour le mot de passe admin
   */
  async updateAdminPassword(currentPassword, newPassword) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const isCurrentValid = await this.verifyAdminCredentials(adminUsername, currentPassword);
    
    if (!isCurrentValid) {
      throw new Error('Mot de passe actuel incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    // Note: Dans un vrai système, vous devriez mettre à jour le .env 
    // ou une base de données sécurisée. Ici, c'est juste pour la démo.
    console.log('ATTENTION: Le changement de mot de passe admin nécessite une mise à jour manuelle du fichier .env');
    
    return {
      message: 'Pour des raisons de sécurité, le mot de passe doit être changé manuellement dans le fichier .env',
      instruction: `Modifiez ADMIN_PASSWORD=${newPassword} dans le fichier .env et redémarrez le serveur`
    };
  }
}

module.exports = new AdminAuthService();